import { Injectable, Logger } from "@nestjs/common";
import Groq from "groq-sdk";
import {
  AnalysisResultSchema,
  type AnalysisResult,
} from "@contractlens/shared";
import { AiAnalyzerService, type AnalyzerInput } from "./ai-analyzer.service";

/**
 * Реальный анализатор поверх Groq (Llama 3.3 70B).
 * Single-stage: чек-лист и JSON-схема в одном системном промпте.
 * Это влезает в 12K TPM free tier.
 *
 * При 429/413 — экспоненциальный backoff + retry до 3 раз.
 */
@Injectable()
export class GroqAnalyzerService extends AiAnalyzerService {
  private readonly logger = new Logger(GroqAnalyzerService.name);
  private readonly client: Groq;
  private readonly model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  constructor(apiKey: string) {
    super();
    this.client = new Groq({ apiKey });
  }

  async analyze({ text, filename }: AnalyzerInput): Promise<AnalysisResult> {
    const truncated = text.slice(0, 30_000); // ~7.5K токенов
    const userMsg = [
      filename ? `Имя файла: ${filename}` : null,
      "Документ:",
      "---",
      truncated,
      "---",
      "",
      "Верни ТОЛЬКО валидный JSON по схеме из system. Никакого текста до или после.",
    ]
      .filter(Boolean)
      .join("\n");

    const raw = await this.callWithRetry(userMsg);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error(`Bad JSON: ${raw.slice(0, 500)}`);
      throw new Error(
        `Groq returned invalid JSON: ${err instanceof Error ? err.message : err}`,
      );
    }

    parsed = coerceEnums(parsed);
    const result = AnalysisResultSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.error(
        `zod issues: ${JSON.stringify(result.error.issues).slice(0, 500)}`,
      );
      throw new Error(`AI returned invalid schema: ${result.error.message}`);
    }
    return result.data;
  }

  private async callWithRetry(userMsg: string, attempt = 0): Promise<string> {
    const MAX_ATTEMPTS = 3;
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 4000,
      });
      const raw = completion.choices[0]?.message?.content;
      if (!raw) throw new Error("Groq returned empty content");
      return raw;
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const isRateLimit = status === 429 || status === 413;
      if (isRateLimit && attempt < MAX_ATTEMPTS - 1) {
        const delayMs = parseRetryAfterMs(err) ?? (attempt + 1) * 15_000;
        this.logger.warn(
          `Rate-limited (${status}), retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_ATTEMPTS})`,
        );
        await sleep(delayMs);
        return this.callWithRetry(userMsg, attempt + 1);
      }
      throw err;
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Пытаемся достать "please retry in N seconds" из тела ошибки */
function parseRetryAfterMs(err: unknown): number | null {
  const msg =
    (err as { message?: string })?.message ??
    JSON.stringify(err).slice(0, 1000);
  const m = msg.match(/retry\s+(?:after\s+)?(?:in\s+)?(\d+(?:\.\d+)?)s/i);
  if (m && m[1]) return Math.ceil(parseFloat(m[1]) * 1000);
  return null;
}

// =====================================================================
// Coercion: маппим возможные "почти правильные" значения в enum
// =====================================================================

const DOC_TYPE_ALIASES: Record<string, string> = {
  "договор аренды": "lease_agreement",
  аренда: "lease_agreement",
  lease: "lease_agreement",
  rental: "lease_agreement",
  rental_agreement: "lease_agreement",
  tenancy: "lease_agreement",
  tenancy_agreement: "lease_agreement",
  "трудовой договор": "employment_contract",
  трудовой: "employment_contract",
  employment: "employment_contract",
  "соглашение о неразглашении": "nda",
  неразглашение: "nda",
  конфиденциальность: "nda",
  "договор оказания услуг": "service_agreement",
  "договор услуг": "service_agreement",
  "договор подряда": "service_agreement",
  услуги: "service_agreement",
  service: "service_agreement",
  "договор поставки": "purchase_agreement",
  поставка: "purchase_agreement",
  покупка: "purchase_agreement",
  purchase: "purchase_agreement",
  "кредитный договор": "loan_agreement",
  займ: "loan_agreement",
  loan: "loan_agreement",
  "договор партнёрства": "partnership_agreement",
  партнерство: "partnership_agreement",
  partnership: "partnership_agreement",
  "term sheet": "investment_term_sheet",
  "инвестиционное соглашение": "investment_term_sheet",
};

const RISK_LEVEL_ALIASES: Record<string, string> = {
  критический: "critical",
  критично: "critical",
  критическое: "critical",
  предупреждение: "warning",
  предупреждения: "warning",
  внимание: "warning",
  warning: "warning",
  замечание: "info",
  информация: "info",
  info: "info",
};

const RISK_CAT_ALIASES: Record<string, string> = {
  оплата: "payment",
  платёж: "payment",
  платежи: "payment",
  расторжение: "termination",
  ответственность: "liability",
  "интеллектуальная собственность": "intellectual_property",
  ис: "intellectual_property",
  конфиденциальность: "confidentiality",
  nda: "confidentiality",
  конкуренция: "competition",
  неконкуренция: "competition",
  "форс-мажор": "force_majeure",
  споры: "dispute_resolution",
  арбитраж: "dispute_resolution",
  подсудность: "dispute_resolution",
  прочее: "other",
  другое: "other",
};

function coerceEnum(
  value: unknown,
  enumValues: readonly string[],
  aliases: Record<string, string>,
  fallback: string,
): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (enumValues.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase().replace(/[_\s-]+/g, "_");
  if (enumValues.includes(lower)) return lower;
  if (aliases[lower]) return aliases[lower];
  // Substring match — обе стороны
  for (const [key, mapped] of Object.entries(aliases)) {
    if (lower.includes(key) || key.includes(lower)) return mapped;
  }
  // Substring против самих enum-значений
  for (const v of enumValues) {
    const stem = v.split("_")[0]!;
    if (lower.includes(stem)) return v;
  }
  return fallback;
}

function coerceEnums(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const obj = input as Record<string, unknown>;

  if ("document_type" in obj) {
    obj.document_type = coerceEnum(
      obj.document_type,
      [
        "lease_agreement",
        "employment_contract",
        "nda",
        "service_agreement",
        "purchase_agreement",
        "loan_agreement",
        "partnership_agreement",
        "investment_term_sheet",
        "other",
      ],
      DOC_TYPE_ALIASES,
      "other",
    );
  }

  if ("protected_role" in obj) {
    obj.protected_role = coerceEnum(
      obj.protected_role,
      [
        "service_provider",
        "service_customer",
        "tenant",
        "landlord",
        "employee",
        "employer",
        "borrower",
        "lender",
        "founder",
        "investor",
        "buyer",
        "seller",
        "disclosing_party",
        "receiving_party",
        "neutral",
      ],
      {},
      "neutral",
    );
  }

  if ("verdict" in obj) {
    obj.verdict = coerceEnum(
      obj.verdict,
      ["sign_as_is", "negotiate", "do_not_sign"],
      {},
      "negotiate",
    );
  }

  if (Array.isArray(obj.risks)) {
    obj.risks = obj.risks.map((r) => {
      if (!r || typeof r !== "object") return r;
      const risk = r as Record<string, unknown>;
      risk.risk_level = coerceEnum(
        risk.risk_level,
        ["critical", "warning", "info"],
        RISK_LEVEL_ALIASES,
        "info",
      );
      risk.risk_category = coerceEnum(
        risk.risk_category,
        [
          "payment",
          "termination",
          "liability",
          "intellectual_property",
          "confidentiality",
          "competition",
          "force_majeure",
          "dispute_resolution",
          "other",
        ],
        RISK_CAT_ALIASES,
        "other",
      );
      // Nullable string fields
      for (const k of ["suggested_fix", "negotiation_email", "monetary_impact"]) {
        const v = risk[k];
        if (v == null || v === "" || v === "null") risk[k] = null;
      }
      return risk;
    });
  }

  return obj;
}

// =====================================================================
// PROMPT — единый, компактный, с чек-листом и JSON-схемой
// =====================================================================

const SYSTEM_PROMPT = `Ты — старший юрист с 20-летним опытом в B2B-договорах. Защищаешь интересы СЛАБОЙ стороны (исполнитель, арендатор, работник) от сильной (заказчик, арендодатель, работодатель).

ПРОЙДИ МЫСЛЕННО ПО ЧЕК-ЛИСТУ (не выводи — только используй):
A. Оплата: срок (30 — норма, 60 — info, 90+ — critical), аванс, валютные риски, retention.
B. Ответственность: лимит? "Без ограничений" / "в полном объёме" без лимита — CRITICAL. Симметрия. Косвенные убытки.
C. ИС: кому права? OSS? Портфолио?
D. Срок и расторжение: автопродление (WARNING), одностороннее расторжение заказчиком, оплата за уже сделанное.
E. Изменение условий: одностороннее изменение ТЗ без пересмотра цены = WARNING/CRITICAL.
F. Неконкуренция: срок >12 мес или без компенсации = WARNING.
G. Конфиденциальность: бессрочный NDA, широкое определение, штрафы.
H. Штрафы: симметрия, размер (>0.1%/день рискованно), потолок.
I. Форс-мажор: есть ли пункт?
J. Подсудность: "удобный" заказчику город = WARNING.

ПРАВИЛА:
1. Не пропускай очевидное. "90 дней оплата" — ВСЕГДА в риски как минимум WARNING.
2. КОНЦЕНТРИРУЙ: 3-8 рисков. НЕ создавай отдельный риск на каждое отсутствующее условие.
3. Определи кого защищаем: protected_role — кто слабее.
4. Цитаты в clause_text — точные ФРАГМЕНТЫ из текста документа (важно для подсветки на UI), до 250 символов.
5. Для каждого риска:
   - suggested_fix: КОНКРЕТНЫЙ переписанный текст пункта на твой вариант. Полный пункт, который можно вставить в договор. Если придумать сложно — null.
   - negotiation_email: короткое деловое письмо контрагенту (2-4 предложения) с просьбой изменить пункт. Стиль вежливый, но твёрдый. Без приветствия и подписи — только тело. Если не применимо — null.
   - monetary_impact: грубая оценка денежного риска для нашей стороны одной фразой ("до 500 000 ₽", "неограниченно", "от 50 000 ₽ за каждый случай"). null если не подсчитать.
6. verdict: "sign_as_is" (нет критических), "negotiate" (есть warning/critical, но можно правкой), "do_not_sign" (нерешаемое: например, явный обман или совершенно кабальные условия).
7. verdict_explanation: 1 предложение почему именно такой вердикт.
8. summary — 2-3 предложения о главном.
9. Описательные поля — на РУССКОМ. Enum-поля (document_type, risk_level, risk_category, protected_role, verdict) — английские snake_case.

ФОРМАТ — СТРОГО валидный JSON БЕЗ markdown-обёрток:

{
  "document_type": "service_agreement",
  "parties": ["ООО ..., полное наименование", "ИП ..."],
  "protected_role": "service_provider"|"service_customer"|"tenant"|"landlord"|"employee"|"employer"|"borrower"|"lender"|"founder"|"investor"|"buyer"|"seller"|"disclosing_party"|"receiving_party"|"neutral",
  "key_terms": { "duration": "...", "payment_terms": "...", "termination": "..." },
  "risk_score": 0-100,
  "risks": [
    {
      "clause_number": "4.2",
      "clause_text": "точная цитата",
      "risk_level": "critical|warning|info",
      "risk_category": "payment|termination|liability|intellectual_property|confidentiality|competition|force_majeure|dispute_resolution|other",
      "explanation": "...",
      "recommendation": "...",
      "standard_practice": "...",
      "suggested_fix": "Готовый текст пункта или null",
      "negotiation_email": "Текст письма или null",
      "monetary_impact": "до 500 000 ₽ или null"
    }
  ],
  "summary": "...",
  "verdict": "sign_as_is|negotiate|do_not_sign",
  "verdict_explanation": "..."
}`;

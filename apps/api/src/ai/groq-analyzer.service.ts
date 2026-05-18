import { Injectable, Logger } from "@nestjs/common";
import Groq from "groq-sdk";
import {
  AnalysisResultSchema,
  type AnalysisResult,
} from "@contractlens/shared";
import { AiAnalyzerService, type AnalyzerInput } from "./ai-analyzer.service";

/**
 * Реальный анализатор поверх Groq (Llama 3.3 70B).
 * Подход: two-stage.
 *  1) reasoning — модель пишет "мозговой штурм" свободным текстом, проходясь
 *     по чек-листу обязательных проверок. Это заставляет её НЕ пропустить
 *     очевидные риски (90-дневная оплата, авто-продление и т.п.).
 *  2) extract  — на основе своего reasoning возвращает строгий JSON.
 *
 * Бесплатный план Groq: ~30 req/min. Два запроса на документ — нормально.
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
    const truncated = text.slice(0, 100_000);

    // Stage 1: reasoning (свободный текст по чек-листу)
    const reasoning = await this.runReasoning(truncated, filename);
    this.logger.debug(`reasoning length: ${reasoning.length}`);

    // Stage 2: extract (структурированный JSON на основе reasoning + текста)
    return this.runExtract(truncated, reasoning, filename);
  }

  private async runReasoning(
    text: string,
    filename?: string,
  ): Promise<string> {
    const userMsg = [
      filename ? `Имя файла: ${filename}` : null,
      "Документ:",
      "---",
      text,
      "---",
      "",
      "Пройди по чек-листу выше и распиши, что нашёл. Свободным текстом.",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: REASONING_PROMPT },
        { role: "user", content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });
    return completion.choices[0]?.message?.content ?? "";
  }

  private async runExtract(
    text: string,
    reasoning: string,
    filename?: string,
  ): Promise<AnalysisResult> {
    const userMsg = [
      "Документ:",
      "---",
      text,
      "---",
      "",
      "Твой анализ выше:",
      "---",
      reasoning,
      "---",
      "",
      "Теперь преобразуй свой анализ в JSON строго по схеме.",
      "Возьми ВСЕ риски из своего анализа — ничего не теряй.",
      "Цитаты в clause_text — точные фразы из документа, до 250 символов.",
    ].join("\n");

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: userMsg },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 8000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Groq returned empty extraction response");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error(`Bad JSON: ${raw.slice(0, 500)}`);
      throw new Error(
        `Groq returned invalid JSON: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Нормализация: иногда модель возвращает русские значения в enum-полях
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
}

// =====================================================================
// Coercion: маппим возможные "почти правильные" значения в enum
// =====================================================================

const DOC_TYPE_ALIASES: Record<string, string> = {
  "договор аренды": "lease_agreement",
  "аренда": "lease_agreement",
  "lease": "lease_agreement",
  "трудовой договор": "employment_contract",
  "трудовой": "employment_contract",
  "employment": "employment_contract",
  "соглашение о неразглашении": "nda",
  "неразглашение": "nda",
  "конфиденциальность": "nda",
  "договор оказания услуг": "service_agreement",
  "договор услуг": "service_agreement",
  "договор подряда": "service_agreement",
  "услуги": "service_agreement",
  "service": "service_agreement",
  "договор поставки": "purchase_agreement",
  "поставка": "purchase_agreement",
  "покупка": "purchase_agreement",
  "purchase": "purchase_agreement",
  "кредитный договор": "loan_agreement",
  "займ": "loan_agreement",
  "loan": "loan_agreement",
  "договор партнёрства": "partnership_agreement",
  "партнерство": "partnership_agreement",
  "partnership": "partnership_agreement",
  "term sheet": "investment_term_sheet",
  "инвестиционное соглашение": "investment_term_sheet",
};

const RISK_LEVEL_ALIASES: Record<string, string> = {
  "критический": "critical",
  "критично": "critical",
  "критическое": "critical",
  "предупреждение": "warning",
  "предупреждения": "warning",
  "внимание": "warning",
  "warning": "warning",
  "замечание": "info",
  "информация": "info",
  "info": "info",
};

const RISK_CAT_ALIASES: Record<string, string> = {
  "оплата": "payment",
  "платёж": "payment",
  "платежи": "payment",
  "расторжение": "termination",
  "ответственность": "liability",
  "интеллектуальная собственность": "intellectual_property",
  "ис": "intellectual_property",
  "конфиденциальность": "confidentiality",
  "nda": "confidentiality",
  "конкуренция": "competition",
  "неконкуренция": "competition",
  "форс-мажор": "force_majeure",
  "споры": "dispute_resolution",
  "арбитраж": "dispute_resolution",
  "подсудность": "dispute_resolution",
  "прочее": "other",
  "другое": "other",
};

function coerceEnum(
  value: unknown,
  enumValues: readonly string[],
  aliases: Record<string, string>,
): string | unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (enumValues.includes(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  if (aliases[lower]) return aliases[lower];
  // Поиск по подстроке
  for (const [key, mapped] of Object.entries(aliases)) {
    if (lower.includes(key)) return mapped;
  }
  return value;
}

function coerceEnums(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const obj = input as Record<string, unknown>;

  if (typeof obj.document_type === "string") {
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
    );
  }

  if (Array.isArray(obj.risks)) {
    obj.risks = obj.risks.map((r) => {
      if (!r || typeof r !== "object") return r;
      const risk = r as Record<string, unknown>;
      if (typeof risk.risk_level === "string") {
        risk.risk_level = coerceEnum(
          risk.risk_level,
          ["critical", "warning", "info"],
          RISK_LEVEL_ALIASES,
        );
      }
      if (typeof risk.risk_category === "string") {
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
        );
      }
      return risk;
    });
  }

  return obj;
}

// =====================================================================
// PROMPTS
// =====================================================================

const REASONING_PROMPT = `Ты — старший юрист с 20-летним опытом по B2B-договорам в РФ и международной практике. Твоя работа сейчас — провести аудит договора так, как будто его подписывает близкий друг, и ты обязан защитить его от рисков.

Тщательно прочитай документ и пройди по обязательному ЧЕК-ЛИСТУ. По каждому пункту — найди в тексте подтверждение или его отсутствие.

ОБЯЗАТЕЛЬНЫЙ ЧЕК-ЛИСТ (по каждому пункту дай ответ):

A) ОПЛАТА
- Каков срок оплаты после акта/счёта? Если больше 30 дней — это риск. 45 дней — info, 60 — warning, 90+ — critical для маленького исполнителя.
- Есть ли авансовый платёж? Какой процент? (Меньше 30% — рискованно для исполнителя.)
- Кто несёт банковские/валютные риски?
- Есть ли отсрочка/удержание (retention)? Сколько процентов?

B) ОТВЕТСТВЕННОСТЬ
- Есть ли лимит ответственности? Если "без ограничений", "в полном объёме", "за все убытки" без лимита — это CRITICAL.
- Симметричная ли ответственность сторон, или только одна сторона отвечает?
- Включены ли косвенные убытки / упущенная выгода? Обычно их исключают.
- Есть ли заверения и гарантии (representations & warranties), и за что несут ответственность?

C) ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ
- Кому принадлежат права на результат? Если "все исключительные права передаются заказчику без отдельной оплаты" — стоит ли это в цене?
- Используются ли сторонние библиотеки/OSS? Кто несёт лицензионные риски?
- Может ли исполнитель использовать наработки в своём портфолио / переиспользовать код?

D) СРОК И РАСТОРЖЕНИЕ
- Срок действия. Есть ли АВТОМАТИЧЕСКОЕ ПРОДЛЕНИЕ (пролонгация)? Если да — это WARNING, надо помнить о сроке уведомления.
- Может ли заказчик расторгнуть в одностороннем порядке без причины? Это WARNING.
- Может ли исполнитель расторгнуть? Симметрично ли?
- Что происходит с оплатой за уже выполненную работу при расторжении?

E) ИЗМЕНЕНИЕ УСЛОВИЙ
- Может ли заказчик в одностороннем порядке менять ТЗ, объём, требования? Без пересмотра цены/срока — это WARNING/CRITICAL.
- Как оформляется изменение объёма работ?

F) НЕКОНКУРЕНЦИЯ И ПЕРЕМАНИВАНИЕ
- Есть ли non-compete? На какой срок, в каком регионе, без компенсации? Срок больше 12 месяцев или без компенсации — WARNING.
- Есть ли non-solicitation (не переманивать сотрудников/клиентов)?

G) КОНФИДЕНЦИАЛЬНОСТЬ
- Срок NDA? Если "бессрочно" — info/warning в зависимости от контекста.
- Что считается конфиденциальной информацией? Не слишком ли широко?
- Штрафы за разглашение? Соразмерны ли?

H) ШТРАФЫ И НЕУСТОЙКИ
- Есть ли штрафы только для одной стороны? Симметрично ли?
- Размер: больше 0.1%/день или больше двойной ставки ЦБ — может быть снижен судом, но рисково.
- Есть ли потолок штрафов?

I) ФОРС-МАЖОР
- Есть ли пункт о форс-мажоре? Включены ли пандемии, санкции?
- Срок уведомления о ФМ?

J) ПОДСУДНОСТЬ И ПРИМЕНИМОЕ ПРАВО
- Где рассматриваются споры? Если в "удобном" заказчику городе/стране — WARNING для маленького исполнителя.
- Применимое право?
- Обязательная медиация / претензионный порядок?

K) ПРОЧЕЕ
- Конкретные сроки этапов и санкции за их нарушение.
- Порядок приёмки работ. Есть ли "молчаливая приёмка" / автоматическое подписание акта?
- Гарантийный период и его условия.

ПРАВИЛА АНАЛИЗА:
1. По каждому пункту чек-листа отметь "OK" / "INFO: ..." / "WARNING: ..." / "CRITICAL: ..." в своём reasoning.
2. ⚠️ ВАЖНО про отсутствие пунктов: НЕ создавай отдельный риск на каждое отсутствующее условие. Большинство договоров не покрывают всё. Создавай риск ОТ ОТСУТСТВИЯ только если это реально опасно (например: нет ограничения ответственности, нет пункта о форс-мажоре в долгом договоре, нет указания подсудности при стороне в другой юрисдикции). Просто "не указано про банковские риски" — НЕ риск.
3. Не пропускай очевидные вещи. Если видишь "90 дней" в оплате — это ВСЕГДА должно попасть в риски.
4. Цитируй точные фразы из документа.
5. Думай как юрист маленького исполнителя/арендатора, защищающий клиента от крупной стороны. "Что плохого для нашей стороны", а не "обе стороны должны".
6. Итоговый список рисков должен быть КОНЦЕНТРИРОВАННЫМ — 3-8 пунктов для среднего договора. Лучше меньше, но по делу, чем много мелочей.`;

const EXTRACTION_PROMPT = `Ты преобразуешь юридический анализ в строгий JSON-объект для отображения пользователю.

⚠️ КРИТИЧЕСКИ ВАЖНО: значения полей document_type, risk_level, risk_category — ТОЛЬКО английские snake_case коды из списка ниже. НЕ пиши их по-русски. Описательные тексты (explanation, recommendation, summary, clause_text) — на русском.

ПРАВИЛА:
1. Описательные тексты — на русском.
2. document_type — РОВНО один из английских кодов: lease_agreement | employment_contract | nda | service_agreement | purchase_agreement | loan_agreement | partnership_agreement | investment_term_sheet | other.
3. parties — стороны как они названы в преамбуле (полное наименование).
4. key_terms.duration — срок действия одной фразой (даты или продолжительность).
5. key_terms.payment_terms — условия оплаты одной фразой (с указанием срока и процентов).
6. key_terms.termination — условия расторжения одной фразой.
7. risk_score: 0–29 низкий, 30–59 средний, 60–100 высокий. Считай по совокупности: критические +30, предупреждения +15, замечания +5.
8. risks — МАССИВ всех найденных рисков. Не пропускай ничего из своего анализа.
9. risks: КОНЦЕНТРИРУЙ — берёшь только реальные риски из своего анализа, не каждое отсутствие условия. Цель: 3-8 рисков для среднего договора. Если в reasoning было много "INFO: отсутствие X" — БЕРИ В JSON только те, которые реально важны (1-3 из них максимум, в один сводный пункт).
10. Для каждого риска:
   - clause_number: номер пункта из документа ("4.2", "5.3" и т.п.) или короткая метка если без номера.
   - clause_text: ТОЧНАЯ цитата из документа (фраза, на которую опирается риск). До 250 символов.
   - risk_level: critical / warning / info.
   - risk_category: payment / termination / liability / intellectual_property / confidentiality / competition / force_majeure / dispute_resolution / other.
   - explanation: 1–2 предложения простым языком — ЧТО это, ПОЧЕМУ плохо для нашей стороны.
   - recommendation: конкретно ЧТО делать (попросить такую-то правку, добавить лимит и т.п.).
   - standard_practice: как обычно делается в нормальных договорах.
10. summary: 2–3 предложения — главное что нужно знать пользователю.

ФОРМАТ ОТВЕТА — СТРОГО валидный JSON, ничего вокруг (без \`\`\`json, без комментариев):

{
  "document_type": "...",
  "parties": ["...", "..."],
  "key_terms": { "duration": "...", "payment_terms": "...", "termination": "..." },
  "risk_score": 0,
  "risks": [
    {
      "clause_number": "...",
      "clause_text": "...",
      "risk_level": "...",
      "risk_category": "...",
      "explanation": "...",
      "recommendation": "...",
      "standard_practice": "..."
    }
  ],
  "summary": "..."
}`;

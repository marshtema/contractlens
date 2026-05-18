import { Injectable, Logger } from "@nestjs/common";
import Groq from "groq-sdk";
import {
  AnalysisResultSchema,
  type AnalysisResult,
} from "@contractlens/shared";
import { AiAnalyzerService, type AnalyzerInput } from "./ai-analyzer.service";

/**
 * Реальный анализатор поверх Groq (Llama 3.3 70B).
 * Бесплатный план Groq: ~30 req/min, очень быстро (1–3 сек).
 * Доступен в РФ/СНГ без VPN.
 *
 * Особенность: Groq поддерживает JSON mode, но не strict schema —
 * валидируем zod-схемой на выходе.
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
    const truncated = text.slice(0, 100_000); // ~25K токенов, Llama 3.3 окно 128K

    const userMessage = [
      filename ? `Имя файла: ${filename}` : null,
      "Документ для анализа:",
      "---",
      truncated,
      "---",
      "",
      "Верни JSON строго по описанной схеме. Только JSON, без markdown-обёрток.",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 8000,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      throw new Error("Groq returned empty response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error(`Failed to parse Groq JSON: ${raw.slice(0, 500)}`);
      throw new Error(
        `Groq returned invalid JSON: ${err instanceof Error ? err.message : err}`,
      );
    }

    const result = AnalysisResultSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.error(
        `Groq output failed zod validation: ${JSON.stringify(result.error.issues).slice(0, 500)}`,
      );
      // Иногда модель возвращает близкое к схеме, но не идеально —
      // например, лишние поля. Попробуем "spread" с дефолтами.
      throw new Error(`AI returned invalid schema: ${result.error.message}`);
    }
    return result.data;
  }
}

const SYSTEM_PROMPT = `Ты — эксперт по юридическому анализу договоров с 20-летним опытом.
Твоя задача — проанализировать предоставленный договор и вернуть структурированный JSON-отчёт.

ПРАВИЛА:
1. Объясняй всё простым языком, как будто пользователю 18 лет без юридического образования.
2. Не давай юридических консультаций — только анализ документа.
3. Всегда указывай конкретные номера пунктов (если есть нумерация).
4. Сравнивай с типовой практикой, когда это возможно.
5. Отмечай только реальные проблемы, не придумывай.
6. risk_score: 0–29 низкий, 30–59 средний, 60–100 высокий.
7. risk_level: critical (серьёзные деньги/права под угрозой), warning (невыгодно, но управляемо), info (норма или мелочь).
8. Если документ не похож на юридический — document_type=other, пустой risks.
9. Все тексты — на русском.

ФОРМАТ ОТВЕТА — СТРОГО JSON со следующими полями:
{
  "document_type": one of ["lease_agreement","employment_contract","nda","service_agreement","purchase_agreement","loan_agreement","partnership_agreement","investment_term_sheet","other"],
  "parties": ["сторона 1", "сторона 2"],
  "key_terms": {
    "duration": "срок действия одной строкой",
    "payment_terms": "условия оплаты одной строкой",
    "termination": "условия расторжения одной строкой"
  },
  "risk_score": целое от 0 до 100,
  "risks": [
    {
      "clause_number": "номер пункта или короткая метка",
      "clause_text": "цитата из документа, до 250 символов",
      "risk_level": one of ["critical","warning","info"],
      "risk_category": one of ["payment","termination","liability","intellectual_property","confidentiality","competition","force_majeure","dispute_resolution","other"],
      "explanation": "почему это проблема, простым языком",
      "recommendation": "что делать",
      "standard_practice": "как обычно делается"
    }
  ],
  "summary": "краткое резюме для пользователя, 2-3 предложения"
}

Возвращай ТОЛЬКО валидный JSON. Никаких комментариев, никаких markdown-блоков.`;

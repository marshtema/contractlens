import { Injectable, Logger } from "@nestjs/common";
import { GoogleGenAI, Type } from "@google/genai";
import {
  AnalysisResultSchema,
  type AnalysisResult,
} from "@contractlens/shared";
import { AiAnalyzerService, type AnalyzerInput } from "./ai-analyzer.service";

/**
 * Реальный анализатор поверх Google Gemini.
 * - Использует structured output (responseSchema) — Gemini сам гарантирует
 *   валидный JSON по схеме.
 * - System prompt из ТЗ раздел 9.1 (адаптирован).
 * - Бесплатный план Gemini: gemini-2.0-flash, 1500 запросов/день.
 */
@Injectable()
export class GeminiAnalyzerService extends AiAnalyzerService {
  private readonly logger = new Logger(GeminiAnalyzerService.name);
  private readonly client: GoogleGenAI;
  private readonly model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenAI({ apiKey });
  }

  async analyze({ text, filename }: AnalyzerInput): Promise<AnalysisResult> {
    const truncated = text.slice(0, 200_000); // ~50K токенов, безопасно

    const prompt = [
      filename ? `Имя файла: ${filename}` : null,
      "Документ для анализа:",
      "---",
      truncated,
      "---",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.2,
      },
    });

    const raw = response.text;
    if (!raw) {
      throw new Error("Gemini returned empty response");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      this.logger.error(`Failed to parse Gemini JSON: ${raw.slice(0, 500)}`);
      throw new Error(
        `Gemini returned invalid JSON: ${err instanceof Error ? err.message : err}`,
      );
    }

    // Финальная валидация через zod — даже если Gemini нарушил схему,
    // фронт получит чистый AnalysisResult или ошибку.
    const result = AnalysisResultSchema.safeParse(parsed);
    if (!result.success) {
      this.logger.error(
        `Gemini output failed zod validation: ${result.error.message}`,
      );
      throw new Error(`AI returned invalid schema: ${result.error.message}`);
    }
    return result.data;
  }
}

const SYSTEM_PROMPT = `Ты — эксперт по юридическому анализу договоров с 20-летним опытом.
Твоя задача — проанализировать предоставленный договор и выдать структурированный отчёт.

ПРАВИЛА:
1. Объясняй всё простым языком, как будто пользователю 18 лет без юридического образования.
2. Не давай юридических консультаций — только анализ документа.
3. Всегда указывай конкретные номера пунктов (если в документе есть нумерация).
4. Сравнивай с типовой практикой, когда это возможно.
5. Отмечай только реальные проблемы, не придумывай.
6. risk_score рассчитывай по совокупности: 0–29 низкий риск, 30–59 средний, 60–100 высокий.
7. Уровень риска:
   - critical: пункт, который реально может стоить пользователю существенных денег или прав.
   - warning: невыгодное, но управляемое условие.
   - info: нормальное условие или мелкое замечание.
8. Если документ не похож на юридический — верни document_type=other и пустой массив risks.
9. Все текстовые поля — на русском языке.`;

/**
 * JSON Schema для Gemini structured output. Должна соответствовать zod-схеме
 * AnalysisResultSchema из @contractlens/shared. Если меняешь zod-схему —
 * обнови и эту.
 */
const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    "document_type",
    "parties",
    "protected_role",
    "key_terms",
    "risk_score",
    "risks",
    "summary",
    "verdict",
    "verdict_explanation",
  ],
  properties: {
    protected_role: {
      type: Type.STRING,
      enum: [
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
    },
    verdict: {
      type: Type.STRING,
      enum: ["sign_as_is", "negotiate", "do_not_sign"],
    },
    verdict_explanation: { type: Type.STRING },
    document_type: {
      type: Type.STRING,
      enum: [
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
    },
    parties: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    key_terms: {
      type: Type.OBJECT,
      required: ["duration", "payment_terms", "termination"],
      properties: {
        duration: { type: Type.STRING },
        payment_terms: { type: Type.STRING },
        termination: { type: Type.STRING },
      },
    },
    risk_score: { type: Type.INTEGER },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          "clause_number",
          "clause_text",
          "risk_level",
          "risk_category",
          "explanation",
          "recommendation",
          "standard_practice",
        ],
        properties: {
          clause_number: { type: Type.STRING },
          clause_text: { type: Type.STRING },
          risk_level: {
            type: Type.STRING,
            enum: ["critical", "warning", "info"],
          },
          risk_category: {
            type: Type.STRING,
            enum: [
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
          },
          explanation: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          standard_practice: { type: Type.STRING },
          suggested_fix: { type: Type.STRING },
          negotiation_email: { type: Type.STRING },
          monetary_impact: { type: Type.STRING },
        },
      },
    },
    summary: { type: Type.STRING },
  },
};

import { Injectable } from "@nestjs/common";
import {
  AnalysisResultSchema,
  type AnalysisResult,
  type DocumentType,
  type RiskItem,
} from "@contractlens/shared";
import { AiAnalyzerService, type AnalyzerInput } from "./ai-analyzer.service.js";

/**
 * Mock-анализатор: эвристика по ключевым словам для демонстрации флоу
 * без расхода токенов на реальную LLM. Заменяется на AnthropicAnalyzerService
 * когда появятся API-ключи.
 */
@Injectable()
export class MockAiAnalyzerService extends AiAnalyzerService {
  async analyze({ text, filename }: AnalyzerInput): Promise<AnalysisResult> {
    // Симулируем задержку как у реальной LLM
    await sleep(800);

    const lower = text.toLowerCase();
    const documentType = guessDocumentType(lower, filename ?? "");
    const risks = detectMockRisks(text);
    const riskScore = computeRiskScore(risks);

    const result: AnalysisResult = {
      document_type: documentType,
      parties: extractParties(text),
      key_terms: {
        duration: matchSnippet(text, /срок\s+(действ|договор)[^.\n]{0,120}/i)
          ?? "не указан",
        payment_terms:
          matchSnippet(text, /(оплат[аы]|payment)[^.\n]{0,120}/i)
          ?? "не указаны",
        termination:
          matchSnippet(text, /(растор[жг]|termination)[^.\n]{0,120}/i)
          ?? "не указаны",
      },
      risk_score: riskScore,
      risks,
      summary: buildSummary(documentType, risks, riskScore),
    };

    // Валидируем итог через ту же схему, что использует фронт
    return AnalysisResultSchema.parse(result);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function guessDocumentType(text: string, filename: string): DocumentType {
  const hay = `${filename.toLowerCase()} ${text}`;
  if (/(nda|неразглаш|конфиденциальн)/.test(hay)) return "nda";
  if (/(аренд|lease)/.test(hay)) return "lease_agreement";
  if (/(труд|employment|работник)/.test(hay)) return "employment_contract";
  if (/(услуг|service|подряд)/.test(hay)) return "service_agreement";
  if (/(поставк|purchase)/.test(hay)) return "purchase_agreement";
  if (/(заём|кредит|loan)/.test(hay)) return "loan_agreement";
  if (/(партнёр|partnership)/.test(hay)) return "partnership_agreement";
  if (/(term sheet|инвестиц)/.test(hay)) return "investment_term_sheet";
  return "other";
}

function extractParties(text: string): string[] {
  const matches = text.match(/(?:сторон[ыа]|parties)[^.\n]{0,200}/i);
  if (matches) {
    const tail = matches[0].replace(/^[^:]+:?/, "").trim();
    const parts = tail
      .split(/(?:[,;]|\bи\b|\band\b)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 80);
    if (parts.length >= 2) return parts.slice(0, 2);
  }
  return ["Сторона 1", "Сторона 2"];
}

function detectMockRisks(text: string): RiskItem[] {
  const risks: RiskItem[] = [];

  if (/90\s*дн|девяност[оа]\s*дн/i.test(text)) {
    risks.push({
      clause_number: "оплата",
      clause_text: matchSnippet(text, /[^.\n]*90\s*дн[^.\n]*/i) ?? "",
      risk_level: "warning",
      risk_category: "payment",
      explanation:
        "Срок оплаты 90 дней выглядит длинным. По типовой практике клиент платит в течение 30 дней.",
      recommendation: "Попросите сократить срок оплаты до 30 дней.",
      standard_practice: "30 дней после выставления счёта.",
    });
  }

  if (/без\s+ограничен|unlimited\s+liab/i.test(text)) {
    risks.push({
      clause_number: "ответственность",
      clause_text:
        matchSnippet(text, /[^.\n]*ответствен[^.\n]{0,160}/i) ?? "",
      risk_level: "critical",
      risk_category: "liability",
      explanation:
        "Неограниченная ответственность опасна — в случае спора убытки могут превысить стоимость контракта в десятки раз.",
      recommendation:
        "Добавьте лимит ответственности, обычно равный сумме контракта или годовому платежу.",
      standard_practice:
        "Лимит ответственности = сумма контракта (или 12 месяцев платежей).",
    });
  }

  if (/(автоматическ[аио]\w*\s+продлен|auto[- ]?renew)/i.test(text)) {
    risks.push({
      clause_number: "продление",
      clause_text:
        matchSnippet(text, /[^.\n]*(продлен|renew)[^.\n]{0,160}/i) ?? "",
      risk_level: "warning",
      risk_category: "termination",
      explanation:
        "Автоматическое продление может зафиксировать вас на ещё один срок, если забудете уведомить о расторжении.",
      recommendation:
        "Уточните срок уведомления (обычно 30 дней) и поставьте напоминание в календарь.",
      standard_practice: "Уведомление о нерасторжении за 30 дней до конца срока.",
    });
  }

  if (/(не\s+конкур|non[- ]?compete)/i.test(text)) {
    risks.push({
      clause_number: "неконкуренция",
      clause_text:
        matchSnippet(text, /[^.\n]*(неконкур|non[- ]?compete)[^.\n]{0,160}/i)
          ?? "",
      risk_level: "warning",
      risk_category: "competition",
      explanation:
        "Оговорка о неконкуренции может ограничить вашу работу с другими клиентами или после ухода.",
      recommendation:
        "Сузьте сферу и срок (обычно не больше 6–12 месяцев и в той же нише).",
      standard_practice: "6–12 месяцев в узкой нише, иногда с компенсацией.",
    });
  }

  if (risks.length === 0) {
    risks.push({
      clause_number: "общее",
      clause_text: "",
      risk_level: "info",
      risk_category: "other",
      explanation:
        "Mock-анализатор не нашёл явных красных флагов. Это демо: реальный AI-анализ доступен после подключения Claude/OpenAI ключа.",
      recommendation:
        "Подключите ANTHROPIC_API_KEY и установите AI_PROVIDER=anthropic для полноценного анализа.",
      standard_practice: "—",
    });
  }

  return risks;
}

function computeRiskScore(risks: RiskItem[]): number {
  const weights: Record<RiskItem["risk_level"], number> = {
    critical: 35,
    warning: 15,
    info: 0,
  };
  const sum = risks.reduce((acc, r) => acc + weights[r.risk_level], 0);
  return Math.min(100, sum);
}

function matchSnippet(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[0].trim().slice(0, 200) : null;
}

function buildSummary(
  docType: DocumentType,
  risks: RiskItem[],
  score: number,
): string {
  const critical = risks.filter((r) => r.risk_level === "critical").length;
  const warnings = risks.filter((r) => r.risk_level === "warning").length;
  return `Документ распознан как «${docType}». Скор риска ${score}/100: ${critical} критических, ${warnings} предупреждений.`;
}

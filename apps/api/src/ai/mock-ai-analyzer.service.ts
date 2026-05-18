import { Injectable } from "@nestjs/common";
import {
  AnalysisResultSchema,
  type AnalysisResult,
  type DocumentType,
  type RiskItem,
} from "@contractlens/shared";
import { AiAnalyzerService, type AnalyzerInput } from "./ai-analyzer.service";

/**
 * Mock-анализатор: эвристика по ключевым словам для демонстрации флоу
 * без расхода токенов на реальную LLM. Заменяется на реальный AnalyzerService
 * когда появятся API-ключи. Не пытается заменить LLM — лишь демонстрирует,
 * что флоу работает.
 */
@Injectable()
export class MockAiAnalyzerService extends AiAnalyzerService {
  async analyze({ text, filename }: AnalyzerInput): Promise<AnalysisResult> {
    await sleep(600); // имитация задержки LLM

    const documentType = guessDocumentTypeByVote(text, filename ?? "");
    const risks = detectMockRisks(text);
    const riskScore = computeRiskScore(risks);

    const result: AnalysisResult = {
      document_type: documentType,
      parties: extractParties(text),
      protected_role: "neutral",
      key_terms: {
        duration: extractKeyTerm(text, KEY_TERM_PATTERNS.duration) ?? "не указан",
        payment_terms:
          extractKeyTerm(text, KEY_TERM_PATTERNS.payment) ?? "не указаны",
        termination:
          extractKeyTerm(text, KEY_TERM_PATTERNS.termination) ?? "не указаны",
      },
      risk_score: riskScore,
      risks,
      summary: buildSummary(documentType, risks, riskScore),
      verdict:
        riskScore >= 60
          ? "do_not_sign"
          : riskScore >= 30
            ? "negotiate"
            : "sign_as_is",
      verdict_explanation:
        riskScore >= 60
          ? "Слишком много критических рисков — подписывать опасно."
          : riskScore >= 30
            ? "Есть несколько спорных пунктов — стоит обсудить с контрагентом."
            : "Договор в целом сбалансирован.",
    };

    return AnalysisResultSchema.parse(result);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Тип документа ----------

const TYPE_KEYWORDS: Record<DocumentType, RegExp[]> = {
  nda: [/\bnda\b/i, /неразглашен/i, /конфиденциальн.*информац/i],
  lease_agreement: [/аренд/i, /\blease\b/i, /арендодател/i, /арендатор/i, /наймодател/i],
  employment_contract: [
    /трудов(ой|ого)\s+договор/i,
    /\bemployment\b/i,
    /работник/i,
    /работодател/i,
  ],
  service_agreement: [
    /оказани[ея]\s+услуг/i,
    /договор\s+услуг/i,
    /\bservice\s+agreement\b/i,
    /договор\s+подряд/i,
    /исполнител/i,
    /заказчик/i,
  ],
  purchase_agreement: [/поставк/i, /\bpurchase\s+agreement\b/i, /купли-продажи/i],
  loan_agreement: [/\bloan\b/i, /заём|займ/i, /кредитн/i],
  partnership_agreement: [/партнёрств/i, /\bpartnership\b/i],
  investment_term_sheet: [/term\s+sheet/i, /инвестицион/i, /\bsafe\b/i],
  other: [],
};

function guessDocumentTypeByVote(text: string, filename: string): DocumentType {
  const hay = `${filename}\n${text}`;
  let best: DocumentType = "other";
  let bestScore = 0;
  (Object.keys(TYPE_KEYWORDS) as DocumentType[]).forEach((type) => {
    const score = TYPE_KEYWORDS[type].reduce(
      (acc, re) => acc + (re.test(hay) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  });
  return best;
}

// ---------- Стороны ----------

function extractParties(text: string): string[] {
  // Берём первые 1500 символов — там обычно преамбула
  const head = text.slice(0, 1500);

  // Шаблоны "ООО ...", "ИП ...", "АО ..."
  const orgRe = /(?:ООО|ОАО|ЗАО|ПАО|АО|ИП)\s+["«]?[^"»,.;\n]{2,80}["»]?/g;
  const matches = [...head.matchAll(orgRe)].map((m) => m[0].trim());
  const uniq = Array.from(new Set(matches));
  if (uniq.length >= 2) return uniq.slice(0, 2);
  if (uniq.length === 1) return [uniq[0]!, "Сторона 2"];
  return ["Сторона 1", "Сторона 2"];
}

// ---------- Key terms ----------

interface KeyTermPattern {
  /** Regex, который ищет заголовок раздела */
  header: RegExp;
  /** Regex, ищущий inline-форму "Слово: значение" */
  inline: RegExp;
}

const KEY_TERM_PATTERNS: Record<"duration" | "payment" | "termination", KeyTermPattern> = {
  duration: {
    header: /срок\s+(действ|договор|аренд|найма)/i,
    inline: /срок[^.\n]{0,5}[:—-][^.\n]{3,200}/i,
  },
  payment: {
    header: /(оплат|стоимост|цена\s+договор|расчёт|платеж|вознагражден)/i,
    inline:
      /(оплат[аы]|стоимост|цена|вознагражден)[^.\n]{0,5}[:—-][^.\n]{3,200}/i,
  },
  termination: {
    header: /(растор[жг]|прекращен|extension|termination)/i,
    inline:
      /(растор[жг][^.\n]{0,40}|прекращен[^.\n]{0,40})[:—-][^.\n]{3,200}/i,
  },
};

function extractKeyTerm(text: string, p: KeyTermPattern): string | null {
  // Сначала ищем inline-вариант "X: значение"
  const inline = text.match(p.inline);
  if (inline) return cleanSnippet(inline[0]);

  // Иначе ищем заголовок и берём следующую непустую строку с реальным контентом
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!p.header.test(line)) continue;
    // Заголовок — обычно короткий и крупными буквами или начинается с номера типа "5.", "5.1."
    const looksLikeHeader =
      line.length < 80 ||
      /^[A-ZА-ЯЁ\d\s.,()«»"-]{5,}$/.test(line) ||
      /^\d+(\.\d+)*[.)]\s/.test(line);
    if (!looksLikeHeader) {
      // Это уже содержимое — возвращаем строку целиком
      return cleanSnippet(line);
    }
    // Берём первую непустую строку после заголовка
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const next = (lines[j] ?? "").trim();
      if (next.length > 15) return cleanSnippet(next);
    }
  }
  return null;
}

function cleanSnippet(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 250);
}

// ---------- Риски ----------

interface RiskRule {
  id: string;
  clauseLabel: string;
  pattern: RegExp;
  /** Опциональный второй регекс, который тоже должен сматчить (для уточнения) */
  also?: RegExp;
  level: RiskItem["risk_level"];
  category: RiskItem["risk_category"];
  explanation: string;
  recommendation: string;
  standardPractice: string;
}

const RISK_RULES: RiskRule[] = [
  {
    id: "long_payment_90",
    clauseLabel: "оплата",
    pattern:
      /(90|девяност[оа])\s*(?:\(?\s*(?:девяноста|ninety|90)?\s*\)?)?\s*(?:календарн|банковск|рабоч)?\s*(?:их|ых)?\s*дн/i,
    also: /(оплат|расчёт|платёж|перечислен|выплат)/i,
    level: "warning",
    category: "payment",
    explanation:
      "Срок оплаты 90 дней выглядит длинным. По типовой практике клиент платит в течение 30 дней.",
    recommendation: "Попросите сократить срок оплаты до 30 дней.",
    standardPractice: "30 дней после выставления счёта или подписания акта.",
  },
  {
    id: "long_payment_60",
    clauseLabel: "оплата",
    pattern:
      /(60|шестьдесят)\s*(?:\(?\s*(?:sixty|60)?\s*\)?)?\s*(?:календарн|банковск|рабоч)?\s*(?:их|ых)?\s*дн/i,
    also: /(оплат|расчёт|платёж|перечислен)/i,
    level: "info",
    category: "payment",
    explanation:
      "Срок оплаты 60 дней — на грани комфортного для исполнителя. Стандарт 30 дней.",
    recommendation: "Если поток платежей важен — попросите 30 дней.",
    standardPractice: "30 дней после выставления счёта.",
  },
  {
    id: "unlimited_liability",
    clauseLabel: "ответственность",
    pattern:
      /(без\s+(?:какого-либо\s+)?ограничен|без\s+верхнего\s+предел|в\s+полном\s+объ[её]м[ея]\s+(?:без|причинённ)|unlimited\s+liab|без\s+(?:лимит|ограничения)\s+размер)/i,
    also: /(ответствен|liabilit)/i,
    level: "critical",
    category: "liability",
    explanation:
      "Неограниченная ответственность опасна — в случае спора убытки могут превысить стоимость контракта в десятки раз.",
    recommendation:
      "Добавьте лимит ответственности — обычно равный сумме контракта или годовому платежу.",
    standardPractice:
      "Лимит ответственности = сумма контракта (или 12 месяцев платежей).",
  },
  {
    id: "auto_renew",
    clauseLabel: "продление",
    pattern:
      /(автоматическ[аио]\w*\s+продл|пролонгируется\s+автоматическ|считается\s+продл[её]нн|auto[- ]?renew|tacit\s+renewal)/i,
    level: "warning",
    category: "termination",
    explanation:
      "Автоматическое продление зафиксирует вас на следующий срок, если забудете уведомить о расторжении.",
    recommendation:
      "Уточните срок уведомления (обычно 30 дней) и поставьте напоминание в календарь.",
    standardPractice:
      "Уведомление о нерасторжении за 30 дней до конца срока.",
  },
  {
    id: "non_compete",
    clauseLabel: "неконкуренция",
    pattern:
      /(не\s+(?:вправе|имеет\s+права|может)\s+(?:заключать|работать|сотрудничать)\s+(?:с\s+)?конкурент|не\s+конкурировать|non[- ]?compete|обязуется\s+не\s+(?:оказывать|предоставлять)\s+услуг\s+конкурент)/i,
    level: "warning",
    category: "competition",
    explanation:
      "Оговорка о неконкуренции может ограничить вашу работу с другими клиентами или после ухода.",
    recommendation:
      "Сузьте сферу и срок — обычно не больше 6–12 месяцев в той же узкой нише. Без компенсации — слабый аргумент в суде, но проще не подписывать вовсе.",
    standardPractice:
      "6–12 месяцев в узкой нише, иногда с компенсацией от 50% последнего вознаграждения.",
  },
  {
    id: "unilateral_change",
    clauseLabel: "изменения",
    pattern:
      /(в\s+одностороннем\s+порядке|unilaterally|без\s+(?:согласия|уведомления)\s+(?:исполнител|подрядчик|стороны))\b/i,
    also: /(изменя|вносить\s+изменен|менять|пересматр)/i,
    level: "warning",
    category: "other",
    explanation:
      "Право заказчика менять условия (ТЗ, объём работ) в одностороннем порядке без пересмотра цены и сроков выгодно только ему — вы будете делать больше за те же деньги.",
    recommendation:
      "Добавьте: любые изменения ТЗ согласуются дополнительным соглашением с пересмотром стоимости и сроков.",
    standardPractice:
      "Изменения объёма — допсоглашение с новой ценой/сроком.",
  },
  {
    id: "high_penalty",
    clauseLabel: "штрафы",
    pattern:
      /(штраф|пен[яи]).{0,40}(?:\d{1,3}\s*%|\d+\s*(?:тыс|тысяч|млн|миллион))/i,
    level: "info",
    category: "payment",
    explanation:
      "В договоре есть пункт о штрафах. Проверьте, что штраф соразмерен — суды часто снижают неустойку выше 0.1% в день или больше двойной ставки ЦБ.",
    recommendation: "Сравните размер штрафа с ключевой ставкой ЦБ × 2.",
    standardPractice: "0.05–0.1% от суммы договора в день за просрочку.",
  },
  {
    id: "ip_transfer_all",
    clauseLabel: "права",
    pattern:
      /(исключительн|exclusive).{0,80}(прав|right).{0,80}(переход|transferr|assign|уступ)/i,
    level: "info",
    category: "intellectual_property",
    explanation:
      "Все исключительные права переходят заказчику — нормально для work-for-hire, но проверьте что в цену включена стоимость передачи прав, а не только работа.",
    recommendation:
      "Убедитесь, что вознаграждение покрывает и работу, и передачу исключительных прав.",
    standardPractice:
      "Передача исключительных прав — отдельной строкой в стоимости или явно включена в цену.",
  },
];

function detectMockRisks(text: string): RiskItem[] {
  const risks: RiskItem[] = [];

  for (const rule of RISK_RULES) {
    const match = text.match(rule.pattern);
    if (!match) continue;
    if (rule.also && !rule.also.test(text)) continue;
    risks.push({
      clause_number: rule.clauseLabel,
      clause_text: extractAround(text, match.index ?? 0, 200),
      risk_level: rule.level,
      risk_category: rule.category,
      explanation: rule.explanation,
      recommendation: rule.recommendation,
      standard_practice: rule.standardPractice,
      suggested_fix: null,
      negotiation_email: null,
      monetary_impact: null,
    });
  }

  if (risks.length === 0) {
    risks.push({
      clause_number: "общее",
      clause_text: "",
      risk_level: "info",
      risk_category: "other",
      explanation:
        "Mock-анализатор не нашёл явных красных флагов по заложенным шаблонам. Это эвристика, не настоящий AI — реальный анализ доступен после подключения LLM-ключа.",
      recommendation:
        "Подключите GROQ_API_KEY и установите AI_PROVIDER=groq для полноценного анализа.",
      standard_practice: "—",
      suggested_fix: null,
      negotiation_email: null,
      monetary_impact: null,
    });
  }

  return risks;
}

function extractAround(text: string, index: number, span: number): string {
  const start = Math.max(0, index - span / 2);
  const end = Math.min(text.length, index + span / 2);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function computeRiskScore(risks: RiskItem[]): number {
  const weights: Record<RiskItem["risk_level"], number> = {
    critical: 35,
    warning: 15,
    info: 5,
  };
  const sum = risks.reduce((acc, r) => acc + weights[r.risk_level], 0);
  return Math.min(100, sum);
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

import { z } from "zod";

export const DocumentTypeEnum = z.enum([
  "lease_agreement",
  "employment_contract",
  "nda",
  "service_agreement",
  "purchase_agreement",
  "loan_agreement",
  "partnership_agreement",
  "investment_term_sheet",
  "other",
]);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const RiskLevelEnum = z.enum(["critical", "warning", "info"]);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

export const RiskCategoryEnum = z.enum([
  "payment",
  "termination",
  "liability",
  "intellectual_property",
  "confidentiality",
  "competition",
  "force_majeure",
  "dispute_resolution",
  "other",
]);
export type RiskCategory = z.infer<typeof RiskCategoryEnum>;

/** Кого защищаем — определяет тон рекомендаций */
export const PlaybookRoleEnum = z.enum([
  "service_provider", // фрилансер / подрядчик
  "service_customer", // заказчик услуг
  "tenant", // арендатор
  "landlord", // арендодатель
  "employee", // работник
  "employer", // работодатель
  "borrower", // заёмщик
  "lender", // кредитор
  "founder", // фаундер на term sheet
  "investor",
  "buyer",
  "seller",
  "disclosing_party", // раскрывающая сторона NDA
  "receiving_party",
  "neutral", // если не определено
]);
export type PlaybookRole = z.infer<typeof PlaybookRoleEnum>;

export const RiskItemSchema = z.object({
  clause_number: z.string().describe("Номер пункта (например, '4.2')"),
  clause_text: z.string().describe("Точная цитата из документа"),
  risk_level: RiskLevelEnum,
  risk_category: RiskCategoryEnum,
  explanation: z.string().describe("Почему это проблема, простым языком"),
  recommendation: z.string().describe("Что делать"),
  standard_practice: z.string().describe("Как обычно делается"),
  /**
   * Готовый текст исправленной формулировки пункта — то, что можно отправить
   * контрагенту как контрпредложение.
   */
  suggested_fix: z
    .string()
    .nullable()
    .describe("Готовый исправленный текст пункта, можно скопировать"),
  /**
   * Готовое короткое деловое письмо контрагенту с просьбой об изменении.
   */
  negotiation_email: z
    .string()
    .nullable()
    .describe("Шаблон делового письма контрагенту"),
  /**
   * Грубая оценка денежного риска для нашей стороны — диапазон или фраза.
   * Например: "до 100 000 ₽ при просрочке заказчика" или "неограниченно".
   */
  monetary_impact: z
    .string()
    .nullable()
    .describe("Грубая оценка денежного риска"),
});
export type RiskItem = z.infer<typeof RiskItemSchema>;

export const KeyTermsSchema = z.object({
  duration: z.string().describe("Срок действия"),
  payment_terms: z.string().describe("Условия оплаты"),
  termination: z.string().describe("Условия расторжения"),
});
export type KeyTerms = z.infer<typeof KeyTermsSchema>;

export const AnalysisResultSchema = z.object({
  document_type: DocumentTypeEnum,
  parties: z.array(z.string()).describe("Стороны договора"),
  /** Какую сторону мы защищаем — берётся первая попавшая если AI определил */
  protected_role: PlaybookRoleEnum.default("neutral"),
  key_terms: KeyTermsSchema,
  risk_score: z.number().int().min(0).max(100),
  risks: z.array(RiskItemSchema),
  summary: z.string().describe("Краткое резюме для пользователя"),
  /** Главная рекомендация: подписывать как есть / договариваться / не подписывать */
  verdict: z
    .enum(["sign_as_is", "negotiate", "do_not_sign"])
    .default("negotiate"),
  /** Цвет вердикта для UI */
  verdict_explanation: z
    .string()
    .default("Рекомендуется обсудить с контрагентом несколько пунктов."),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

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

export const RiskItemSchema = z.object({
  clause_number: z.string().describe("Номер пункта (например, '4.2')"),
  clause_text: z.string().describe("Текст пункта"),
  risk_level: RiskLevelEnum,
  risk_category: RiskCategoryEnum,
  explanation: z.string().describe("Почему это проблема, простым языком"),
  recommendation: z.string().describe("Что делать"),
  standard_practice: z.string().describe("Как обычно делается"),
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
  key_terms: KeyTermsSchema,
  risk_score: z.number().int().min(0).max(100),
  risks: z.array(RiskItemSchema),
  summary: z.string().describe("Краткое резюме для пользователя"),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

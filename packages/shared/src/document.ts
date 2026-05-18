import { z } from "zod";
import { AnalysisResultSchema } from "./analysis";

export const DocumentStatusEnum = z.enum([
  "uploaded",
  "processing",
  "analyzed",
  "error",
]);
export type DocumentStatus = z.infer<typeof DocumentStatusEnum>;

export const SupportedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB по ТЗ

export const DocumentSummarySchema = z.object({
  id: z.string(),
  filename: z.string(),
  size: z.number().int().nonnegative(),
  mimeType: z.string(),
  status: DocumentStatusEnum,
  riskScore: z.number().int().min(0).max(100).nullable(),
  createdAt: z.string().datetime(),
});
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;

export const DocumentDetailSchema = DocumentSummarySchema.extend({
  analysisResult: AnalysisResultSchema.nullable(),
  extractedText: z.string().nullable(),
  errorMessage: z.string().nullable(),
});
export type DocumentDetail = z.infer<typeof DocumentDetailSchema>;

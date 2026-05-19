import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  AnalysisResultSchema,
  type DocumentDetail,
  type DocumentStatus,
  type DocumentSummary,
} from "@contractlens/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "../storage/storage.service.js";
import { AiAnalyzerService } from "../ai/ai-analyzer.service.js";
import { TextExtractionService } from "./text-extraction.service.js";
import { AuthService } from "../auth/auth.service.js";
import { ForbiddenException, HttpException, HttpStatus } from "@nestjs/common";

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly extractor: TextExtractionService,
    private readonly analyzer: AiAnalyzerService,
    private readonly authService: AuthService,
  ) {}

  async uploadAndAnalyze(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string | null,
  ): Promise<DocumentSummary> {
    if (userId) {
      const usage = await this.authService.checkAndIncrementUsage(userId);
      if (!usage.allowed) {
        // 402 Payment Required: фронт показывает диалог апгрейда
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            code: "plan_limit",
            message: usage.reason ?? "Превышен лимит документов по вашему тарифу.",
            current_plan: usage.user.subscriptionTier,
            documents_used: usage.user.documentsUsedThisMonth,
            documents_limit: usage.user.documentsLimit,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    const saved = await this.storage.save(fileBuffer, originalName, mimeType);

    const doc = await this.prisma.document.create({
      data: {
        userId,
        filename: saved.storagePath,
        originalName,
        fileSize: saved.size,
        mimeType,
        storagePath: saved.storagePath,
        status: "processing",
      },
    });

    void this.runAnalysis(doc.id, fileBuffer, mimeType).catch((err) => {
      this.logger.error(
        `analysis crashed for ${doc.id}: ${err instanceof Error ? err.message : err}`,
      );
    });

    return this.toSummary(doc);
  }

  async getById(id: string, userId: string | null = null): Promise<DocumentDetail> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    // Если документ привязан к юзеру — другие не имеют доступа
    if (doc.userId && doc.userId !== userId) {
      throw new ForbiddenException("Not your document");
    }
    return this.toDetail(doc);
  }

  async getExtractedText(id: string): Promise<string> {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: { extractedText: true },
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc.extractedText ?? "";
  }

  async list(userId: string | null): Promise<DocumentSummary[]> {
    // Анонимы не видят чужие документы. Если нужно показать свои —
    // фронт хранит ID последнего загруженного в localStorage.
    if (!userId) return [];
    const docs = await this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return docs.map((d) => this.toSummary(d));
  }

  async listCalendar(userId: string): Promise<
    Array<{
      id: string;
      filename: string;
      renewalDate: string | null;
      riskScore: number | null;
      documentType: string | null;
    }>
  > {
    const docs = await this.prisma.document.findMany({
      where: { userId, status: "analyzed" },
      orderBy: [{ renewalDate: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        originalName: true,
        renewalDate: true,
        riskScore: true,
        documentType: true,
      },
    });
    return docs.map((d) => ({
      id: d.id,
      filename: d.originalName,
      renewalDate: d.renewalDate?.toISOString() ?? null,
      riskScore: d.riskScore,
      documentType: d.documentType,
    }));
  }

  private async runAnalysis(
    documentId: string,
    buffer: Buffer,
    mimeType: string,
  ) {
    try {
      const text = await this.extractor.extract(buffer, mimeType);
      const trimmed = text.trim();
      if (!trimmed) {
        await this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: "error",
            errorMessage: "Не удалось извлечь текст из документа.",
          },
        });
        return;
      }

      // Сохраняем извлечённый текст сразу — пригодится для viewer/чата
      // даже если AI упадёт.
      await this.prisma.document.update({
        where: { id: documentId },
        data: { extractedText: trimmed.slice(0, 100_000) },
      });

      const analysis = await this.analyzer.analyze({
        text: trimmed.slice(0, 50_000),
        filename: documentId,
      });

      await this.prisma.$transaction([
        this.prisma.documentRisk.deleteMany({ where: { documentId } }),
        ...analysis.risks.map((r) =>
          this.prisma.documentRisk.create({
            data: {
              documentId,
              clauseNumber: r.clause_number,
              clauseText: r.clause_text,
              riskLevel: r.risk_level,
              riskCategory: r.risk_category,
              explanation: r.explanation,
              recommendation: r.recommendation,
              standardPractice: r.standard_practice,
            },
          }),
        ),
        this.prisma.document.update({
          where: { id: documentId },
          data: {
            status: "analyzed",
            documentType: analysis.document_type,
            riskScore: analysis.risk_score,
            analysisResult: JSON.stringify(analysis),
            // Сначала пробуем по AI-извлечённому сроку, потом по сырому тексту
            renewalDate:
              extractRenewalDate(analysis.key_terms.duration) ??
              extractRenewalDate(trimmed.slice(0, 5000)),
            errorMessage: null,
          },
        }),
      ]);

      this.logger.log(
        `analyzed ${documentId}: score=${analysis.risk_score}, risks=${analysis.risks.length}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: "error", errorMessage: message },
      });
      this.logger.error(`analysis failed for ${documentId}: ${message}`);
    }
  }

  // ----- helpers -----

  private toSummary(doc: {
    id: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    status: string;
    riskScore: number | null;
    createdAt: Date;
  }): DocumentSummary {
    return {
      id: doc.id,
      filename: doc.originalName,
      size: doc.fileSize,
      mimeType: doc.mimeType,
      status: doc.status as DocumentStatus,
      riskScore: doc.riskScore,
      createdAt: doc.createdAt.toISOString(),
    };
  }

  private toDetail(doc: {
    id: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    status: string;
    riskScore: number | null;
    createdAt: Date;
    analysisResult: string | null;
    extractedText: string | null;
    errorMessage: string | null;
  }): DocumentDetail {
    const summary = this.toSummary(doc);
    let analysis = null;
    if (doc.analysisResult) {
      try {
        analysis = AnalysisResultSchema.parse(JSON.parse(doc.analysisResult));
      } catch (err) {
        this.logger.warn(
          `stored analysisResult for ${doc.id} failed schema parse: ${
            err instanceof Error ? err.message : err
          }`,
        );
      }
    }
    return {
      ...summary,
      analysisResult: analysis,
      extractedText: doc.extractedText,
      errorMessage: doc.errorMessage,
    };
  }
}

/**
 * Грубый эвристический парсер даты окончания/продления из строки key_terms.duration.
 * Пытается найти явную дату ("по 20 ноября 2026"), или вычислить из срока в месяцах
 * ("12 месяцев с автоматическим продлением" → +12 мес от сегодня).
 * Возвращает null если ничего не нашёл.
 */
function extractRenewalDate(text: string): Date | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Месяца → +N месяцев от сегодня (для авто-продления это полезно как
  // приблизительный дедлайн)
  const monthsMatch = lower.match(/(\d{1,3})\s*(?:календарн|кален)?\s*месяц/);
  if (monthsMatch && monthsMatch[1]) {
    const months = parseInt(monthsMatch[1], 10);
    if (months > 0 && months < 60) {
      const d = new Date();
      d.setMonth(d.getMonth() + months);
      return d;
    }
  }

  // Лет
  const yearsMatch = lower.match(/(\d{1,2})\s*(?:календарн)?\s*(?:года|лет)/);
  if (yearsMatch && yearsMatch[1]) {
    const years = parseInt(yearsMatch[1], 10);
    if (years > 0 && years < 30) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + years);
      return d;
    }
  }

  // "по 20 ноября 2026", "до 20.11.2026"
  const MONTHS_RU: Record<string, number> = {
    января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5,
    июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11,
  };
  const ruMatch = lower.match(
    /(\d{1,2})\s+([а-я]+)\s+(\d{4})/,
  );
  if (ruMatch && ruMatch[1] && ruMatch[2] && ruMatch[3]) {
    const day = parseInt(ruMatch[1], 10);
    const mon = MONTHS_RU[ruMatch[2]];
    const yr = parseInt(ruMatch[3], 10);
    if (mon !== undefined) {
      return new Date(yr, mon, day);
    }
  }

  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    return new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );
  }

  const dotMatch = text.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (dotMatch && dotMatch[1] && dotMatch[2] && dotMatch[3]) {
    return new Date(
      parseInt(dotMatch[3], 10),
      parseInt(dotMatch[2], 10) - 1,
      parseInt(dotMatch[1], 10),
    );
  }

  return null;
}

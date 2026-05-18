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

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly extractor: TextExtractionService,
    private readonly analyzer: AiAnalyzerService,
  ) {}

  async uploadAndAnalyze(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<DocumentSummary> {
    const saved = await this.storage.save(fileBuffer, originalName, mimeType);

    const doc = await this.prisma.document.create({
      data: {
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

  async getById(id: string): Promise<DocumentDetail> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
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

  async list(): Promise<DocumentSummary[]> {
    const docs = await this.prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return docs.map((d) => this.toSummary(d));
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

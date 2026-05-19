import { Injectable, Logger } from "@nestjs/common";
import mammoth from "mammoth";

/**
 * Cached Tesseract.js worker, инициализируется при первом OCR-вызове.
 * Поддерживает русский и английский.
 */
let tesseractWorkerPromise: Promise<unknown> | null = null;

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      const { createWorker } = (await import("tesseract.js")) as {
        createWorker: (
          langs: string,
          oem?: number,
          options?: Record<string, unknown>,
        ) => Promise<unknown>;
      };
      // 'rus+eng' — оба языка, чтобы распознавать смешанные документы.
      // При первом запуске будут скачаны language packs (~30 МБ).
      const worker = await createWorker("rus+eng");
      return worker;
    })();
  }
  return tesseractWorkerPromise;
}

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    switch (mimeType) {
      case "application/pdf":
        return this.extractPdf(buffer);
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return this.extractDocx(buffer);
      case "text/plain":
        return buffer.toString("utf8");
      case "image/jpeg":
      case "image/png":
        return this.extractOcr(buffer);
      default:
        throw new Error(`Unsupported mime type: ${mimeType}`);
    }
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    const mod = await import("pdf-parse");
    const pdfParse = (mod.default ?? mod) as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    const text = result.text ?? "";
    // Если PDF был сканом — pdf-parse вернёт пустоту. Падаем на OCR.
    if (text.trim().length < 50) {
      this.logger.warn(
        "PDF text extraction yielded too little (likely scanned), OCR fallback skipped — only image files are OCR'd here. Consider a multi-page image converter.",
      );
    }
    return text;
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }

  private async extractOcr(buffer: Buffer): Promise<string> {
    try {
      this.logger.log("Running OCR via Tesseract.js (rus+eng)…");
      const worker = (await getTesseractWorker()) as {
        recognize: (input: Buffer) => Promise<{ data: { text: string } }>;
      };
      const result = await worker.recognize(buffer);
      return result.data.text ?? "";
    } catch (err) {
      this.logger.error(
        `OCR failed: ${err instanceof Error ? err.message : err}`,
      );
      throw new Error(
        "OCR не справился с изображением. Попробуйте PDF или DOCX.",
      );
    }
  }
}

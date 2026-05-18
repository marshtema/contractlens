import { Injectable, Logger } from "@nestjs/common";
import mammoth from "mammoth";

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
        this.logger.warn(
          "OCR не реализован — изображения временно возвращают пустой текст. Подключите Tesseract/Azure DI для FR-001.",
        );
        return "";
      default:
        throw new Error(`Unsupported mime type: ${mimeType}`);
    }
  }

  private async extractPdf(buffer: Buffer): Promise<string> {
    // pdf-parse подгружаем динамически, чтобы избежать его debug-кода при старте
    const mod = await import("pdf-parse");
    const pdfParse = (mod.default ?? mod) as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text ?? "";
  }

  private async extractDocx(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }
}

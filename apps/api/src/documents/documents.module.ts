import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { TextExtractionService } from "./text-extraction.service.js";
import { PdfReportService } from "./pdf-report.service.js";
import { ShareService } from "./share.service.js";
import { ShareController } from "./share.controller.js";

@Module({
  controllers: [DocumentsController, ShareController],
  providers: [
    DocumentsService,
    TextExtractionService,
    PdfReportService,
    ShareService,
  ],
})
export class DocumentsModule {}

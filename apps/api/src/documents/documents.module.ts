import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { TextExtractionService } from "./text-extraction.service.js";

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, TextExtractionService],
})
export class DocumentsModule {}

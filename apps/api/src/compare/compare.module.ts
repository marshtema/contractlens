import { Module } from "@nestjs/common";
import { CompareController } from "./compare.controller.js";
import { CompareService } from "./compare.service.js";
import { TextExtractionService } from "../documents/text-extraction.service.js";

@Module({
  controllers: [CompareController],
  providers: [CompareService, TextExtractionService],
})
export class CompareModule {}

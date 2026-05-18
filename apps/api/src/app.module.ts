import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { AiModule } from "./ai/ai.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { CompareModule } from "./compare/compare.module.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AiModule,
    DocumentsModule,
    CompareModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

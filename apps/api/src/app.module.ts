import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { AiModule } from "./ai/ai.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [PrismaModule, StorageModule, AiModule, DocumentsModule],
  controllers: [HealthController],
})
export class AppModule {}

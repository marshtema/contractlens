import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { AiModule } from "./ai/ai.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { CompareModule } from "./compare/compare.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { AttachUserGuard } from "./auth/current-user.decorator.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AuthModule,
    AiModule,
    DocumentsModule,
    CompareModule,
    BillingModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AttachUserGuard }],
})
export class AppModule {}

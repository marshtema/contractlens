import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  AnalysisResultSchema,
  type DocumentDetail,
} from "@contractlens/shared";
import {
  CurrentUser,
  RequireUserGuard,
} from "../auth/current-user.decorator.js";
import type { SessionUser } from "../auth/auth.service.js";
import { ShareService } from "./share.service.js";

@Controller()
export class ShareController {
  constructor(private readonly share: ShareService) {}

  /** Создать токен для шеринга. Требует владельца (или аноним без userId). */
  @Post("documents/:id/share")
  async create(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser | null,
  ) {
    const token = await this.share.createOrGet(id, user?.id ?? null);
    return { token };
  }

  @Delete("documents/:id/share")
  async revoke(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser | null,
  ) {
    await this.share.revoke(id, user?.id ?? null);
    return { ok: true };
  }

  /** Публичный read-only доступ по токену. */
  @Get("share/:token")
  async getShared(@Param("token") token: string): Promise<DocumentDetail> {
    const doc = await this.share.getByToken(token);
    let analysis = null;
    if (doc.analysisResult) {
      try {
        analysis = AnalysisResultSchema.parse(JSON.parse(doc.analysisResult));
      } catch {
        /* ignore */
      }
    }
    return {
      id: doc.id,
      filename: doc.originalName,
      size: doc.fileSize,
      mimeType: doc.mimeType,
      status: "analyzed",
      riskScore: doc.riskScore,
      createdAt: doc.createdAt.toISOString(),
      analysisResult: analysis,
      extractedText: doc.extractedText,
      errorMessage: null,
    };
  }
}

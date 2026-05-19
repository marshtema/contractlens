import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  /** Создаёт (или возвращает существующий) шарящий токен для документа. */
  async createOrGet(documentId: string, userId: string | null): Promise<string> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException("Document not found");
    // Только владелец (если есть) или аноним-загрузивший в той же сессии
    if (doc.userId && doc.userId !== userId) {
      throw new NotFoundException("Document not found");
    }
    if (doc.shareToken) return doc.shareToken;
    const token = randomBytes(16).toString("base64url");
    await this.prisma.document.update({
      where: { id: documentId },
      data: { shareToken: token, shareCreatedAt: new Date() },
    });
    return token;
  }

  async revoke(documentId: string, userId: string | null): Promise<void> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException("Document not found");
    if (doc.userId && doc.userId !== userId) {
      throw new NotFoundException("Document not found");
    }
    await this.prisma.document.update({
      where: { id: documentId },
      data: { shareToken: null, shareCreatedAt: null },
    });
  }

  async getByToken(token: string) {
    const doc = await this.prisma.document.findUnique({
      where: { shareToken: token },
    });
    if (!doc || doc.status !== "analyzed") {
      throw new NotFoundException("Shared document not found");
    }
    return doc;
  }
}

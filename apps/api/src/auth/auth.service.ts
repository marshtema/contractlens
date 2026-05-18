import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { randomBytes, createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  documentsUsedThisMonth: number;
  documentsLimit: number;
  pagesLimit: number;
}

const PLAN_LIMITS: Record<
  string,
  { documents: number; pages: number }
> = {
  free: { documents: 3, pages: 5 },
  pro: { documents: 20, pages: 50 },
  business: { documents: 1000, pages: 200 },
  enterprise: { documents: 10_000, pages: 1000 },
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly TOKEN_TTL_MS = 15 * 60 * 1000; // 15 минут
  private readonly SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Шаг 1: запрос magic-link.
   * Создаёт пользователя если ещё нет, генерит токен, возвращает ссылку.
   * В dev-режиме ссылка пишется в консоль (без отправки email).
   */
  async requestMagicLink(email: string, baseUrl: string): Promise<{
    ok: true;
    dev_link?: string;
  }> {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new UnauthorizedException("Invalid email");
    }

    const user = await this.prisma.user.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: {},
    });

    // Сбрасываем неиспользованные токены
    await this.prisma.loginToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hash(rawToken);

    await this.prisma.loginToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt: new Date(Date.now() + this.TOKEN_TTL_MS),
      },
    });

    // Линк идёт через web-прокси (/api → API) — там же ставится cookie на web origin
    const link = `${baseUrl}/api/auth/verify?token=${rawToken}`;
    const isDev = process.env.NODE_ENV !== "production";

    // В реальном проде здесь Resend/SES/SMTP. Пока — лог в консоль.
    this.logger.log(`Magic link for ${normalized}: ${link}`);
    return isDev ? { ok: true, dev_link: link } : { ok: true };
  }

  /**
   * Шаг 2: пользователь кликает по ссылке, мы валидируем токен и создаём сессию.
   * Возвращает сессионный токен (для cookie) и юзера.
   */
  async verifyToken(rawToken: string): Promise<{
    sessionToken: string;
    user: SessionUser;
    expiresAt: Date;
  }> {
    const tokenHash = this.hash(rawToken);
    const record = await this.prisma.loginToken.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    await this.prisma.loginToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    const sessionRaw = randomBytes(32).toString("hex");
    const sessionHash = this.hash(sessionRaw);
    const expiresAt = new Date(Date.now() + this.SESSION_TTL_MS);

    await this.prisma.session.create({
      data: {
        userId: record.userId,
        token: sessionHash,
        expiresAt,
      },
    });

    return {
      sessionToken: sessionRaw,
      expiresAt,
      user: this.toSessionUser(record.user),
    };
  }

  async getUserBySessionToken(rawToken: string): Promise<SessionUser | null> {
    if (!rawToken) return null;
    const tokenHash = this.hash(rawToken);
    const session = await this.prisma.session.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return this.toSessionUser(session.user);
  }

  async logout(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const tokenHash = this.hash(rawToken);
    await this.prisma.session
      .delete({ where: { token: tokenHash } })
      .catch(() => undefined);
  }

  /**
   * Проверка лимитов пользователя по плану.
   * Сбрасывает счётчик usageResetAt раз в 30 дней.
   * Возвращает разрешено или нет, и почему.
   */
  async checkAndIncrementUsage(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    user: SessionUser;
  }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");

    const now = new Date();
    let resetAt = user.usageResetAt;
    let used = user.documentsUsedThisMonth;

    if (now.getTime() - resetAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
      used = 0;
      resetAt = now;
    }

    const limits = PLAN_LIMITS[user.subscriptionTier] ?? PLAN_LIMITS.free!;
    if (used >= limits.documents) {
      return {
        allowed: false,
        reason: `Лимит плана «${user.subscriptionTier}»: ${limits.documents} документов в месяц.`,
        user: this.toSessionUser(user),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        documentsUsedThisMonth: used + 1,
        usageResetAt: resetAt,
        documentsLimit: limits.documents,
        pagesLimit: limits.pages,
      },
    });

    return { allowed: true, user: this.toSessionUser(updated) };
  }

  async setPlan(
    userId: string,
    tier: "free" | "pro" | "business" | "enterprise",
  ): Promise<SessionUser> {
    const limits = PLAN_LIMITS[tier] ?? PLAN_LIMITS.free!;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionStatus: "active",
        documentsLimit: limits.documents,
        pagesLimit: limits.pages,
      },
    });
    return this.toSessionUser(user);
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private toSessionUser(user: {
    id: string;
    email: string;
    name: string | null;
    subscriptionTier: string;
    documentsUsedThisMonth: number;
    documentsLimit: number;
    pagesLimit: number;
  }): SessionUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionTier: user.subscriptionTier,
      documentsUsedThisMonth: user.documentsUsedThisMonth,
      documentsLimit: user.documentsLimit,
      pagesLimit: user.pagesLimit,
    };
  }
}

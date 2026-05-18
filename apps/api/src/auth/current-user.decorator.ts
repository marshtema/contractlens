import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  CanActivate,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { AuthService, type SessionUser } from "./auth.service.js";
import { SESSION_COOKIE, parseCookies } from "./auth.controller.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: SessionUser | null;
  }
}

/**
 * Извлекает текущего пользователя из cookie. null если не авторизован.
 * Используется в контроллерах через @CurrentUser().
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser | null => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    return req.user ?? null;
  },
);

/**
 * Глобальный middleware-guard: парсит cookie и кладёт user в req.
 * Использовать как глобальный guard в main.ts через app.useGlobalInterceptors
 * или мы вызываем его явно в каждом контроллере. Здесь делаем простой
 * Guard который НЕ блокирует — только обогащает req.
 */
@Injectable()
export class AttachUserGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    req.user = token ? await this.auth.getUserBySessionToken(token) : null;
    return true;
  }
}

/**
 * Жёсткий guard: 401 если не залогинен.
 */
@Injectable()
export class RequireUserGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    if (!req.user) {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[SESSION_COOKIE];
      req.user = token ? await this.auth.getUserBySessionToken(token) : null;
    }
    if (!req.user) throw new UnauthorizedException("Login required");
    return true;
  }
}

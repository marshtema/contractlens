import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";

const SESSION_COOKIE = "cl_session";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async requestLink(
    @Body() body: { email?: string },
    @Req() req: FastifyRequest,
  ) {
    if (!body?.email) throw new BadRequestException("email required");
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    return this.auth.requestMagicLink(body.email, webOrigin);
  }

  @Get("verify")
  async verify(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const token = (req.query as { token?: string })?.token;
    if (!token) throw new BadRequestException("token required");
    const { sessionToken, expiresAt } = await this.auth.verifyToken(token);

    // Ставим httpOnly cookie на корневой домен
    const isHttps = (req.headers["x-forwarded-proto"] ?? "").includes("https");
    const cookie = [
      `${SESSION_COOKIE}=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      isHttps ? "Secure" : "",
      `Expires=${expiresAt.toUTCString()}`,
    ]
      .filter(Boolean)
      .join("; ");
    res.header("Set-Cookie", cookie);

    // Редиректим на главную web-приложения
    const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
    res.redirect(`${webOrigin}/documents`, 302);
  }

  @Post("logout")
  async logout(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (token) await this.auth.logout(token);
    res.header(
      "Set-Cookie",
      `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    );
    res.send({ ok: true });
  }

  @Get("me")
  async me(@Req() req: FastifyRequest) {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (!token) return { user: null };
    const user = await this.auth.getUserBySessionToken(token);
    return { user };
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export { SESSION_COOKIE };

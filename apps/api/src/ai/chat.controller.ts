import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service.js";
import { ChatService, type ChatMessage } from "./chat.service.js";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

@Controller("documents/:id/chat")
export class ChatController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chat: ChatService,
  ) {}

  @Post()
  async streamChat(
    @Param("id") id: string,
    @Body() body: unknown,
    @Res() res: FastifyReply,
  ) {
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.message);
    }

    const doc = await this.prisma.document.findUnique({
      where: { id },
      select: {
        extractedText: true,
        documentType: true,
        analysisResult: true,
      },
    });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    if (!doc.extractedText) {
      throw new BadRequestException("Document text is not extracted yet");
    }

    let summary: string | undefined;
    if (doc.analysisResult) {
      try {
        const a = JSON.parse(doc.analysisResult) as { summary?: string };
        summary = a.summary;
      } catch {
        /* ignore */
      }
    }

    res.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.raw.setHeader("Cache-Control", "no-cache, no-transform");
    res.raw.setHeader("Connection", "keep-alive");
    res.raw.setHeader("X-Accel-Buffering", "no");
    res.raw.flushHeaders?.();

    const messages: ChatMessage[] = parsed.data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      for await (const token of this.chat.stream({
        documentText: doc.extractedText,
        documentSummary: summary,
        documentType: doc.documentType ?? undefined,
        messages,
      })) {
        res.raw.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      res.raw.write(`event: done\ndata: {}\n\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.raw.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } finally {
      res.raw.end();
    }
  }
}

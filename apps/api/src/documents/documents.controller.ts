import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  MAX_FILE_SIZE_BYTES,
  SupportedMimeTypes,
} from "@contractlens/shared";
import { DocumentsService } from "./documents.service.js";
import { PdfReportService } from "./pdf-report.service.js";
import {
  CurrentUser,
  RequireUserGuard,
} from "../auth/current-user.decorator.js";
import { UseGuards } from "@nestjs/common";
import type { SessionUser } from "../auth/auth.service.js";

@Controller("documents")
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly pdf: PdfReportService,
  ) {}

  @Get(":id/report.pdf")
  async report(@Param("id") id: string, @Res() res: FastifyReply) {
    const doc = await this.documents.getById(id);
    if (!doc.analysisResult) {
      throw new NotFoundException("Document is not analyzed yet");
    }
    const buffer = await this.pdf.render({
      filename: doc.filename,
      analysis: doc.analysisResult,
      riskScore: doc.riskScore ?? 0,
      generatedAt: new Date().toLocaleString("ru-RU"),
    });
    res
      .header("Content-Type", "application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename="contractlens-${id.slice(0, 8)}.pdf"`,
      )
      .send(buffer);
  }

  @Get()
  list(@CurrentUser() user: SessionUser | null) {
    return this.documents.list(user?.id ?? null);
  }

  @Get("calendar")
  @UseGuards(RequireUserGuard)
  calendar(@CurrentUser() user: SessionUser) {
    return this.documents.listCalendar(user.id);
  }

  @Get(":id")
  getOne(
    @Param("id") id: string,
    @CurrentUser() user: SessionUser | null,
  ) {
    return this.documents.getById(id, user?.id ?? null);
  }

  @Post("upload")
  async upload(
    @Req() req: FastifyRequest,
    @CurrentUser() user: SessionUser | null,
  ) {
    const file = await req.file({
      limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
    });
    if (!file) {
      throw new BadRequestException("No file uploaded (field name: 'file')");
    }

    const buffer = await file.toBuffer();
    if (buffer.length === 0) {
      throw new BadRequestException("Uploaded file is empty");
    }
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large: ${buffer.length} > ${MAX_FILE_SIZE_BYTES} bytes`,
      );
    }

    const mimeType = file.mimetype || "application/octet-stream";
    if (!(SupportedMimeTypes as readonly string[]).includes(mimeType)) {
      throw new BadRequestException(
        `Unsupported mime type: ${mimeType}. Allowed: ${SupportedMimeTypes.join(", ")}`,
      );
    }

    return this.documents.uploadAndAnalyze(
      buffer,
      file.filename,
      mimeType,
      user?.id ?? null,
    );
  }
}

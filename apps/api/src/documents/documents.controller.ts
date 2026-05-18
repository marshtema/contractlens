import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import {
  MAX_FILE_SIZE_BYTES,
  SupportedMimeTypes,
} from "@contractlens/shared";
import { DocumentsService } from "./documents.service.js";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list() {
    return this.documents.list();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.documents.getById(id);
  }

  @Post("upload")
  async upload(@Req() req: FastifyRequest) {
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

    return this.documents.uploadAndAnalyze(buffer, file.filename, mimeType);
  }
}

import {
  BadRequestException,
  Controller,
  Post,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { MAX_FILE_SIZE_BYTES, SupportedMimeTypes } from "@contractlens/shared";
import { TextExtractionService } from "../documents/text-extraction.service.js";
import { CompareService } from "./compare.service.js";

@Controller("compare")
export class CompareController {
  constructor(
    private readonly extractor: TextExtractionService,
    private readonly compareService: CompareService,
  ) {}

  @Post()
  async compareTwo(@Req() req: FastifyRequest) {
    const files: Array<{ buffer: Buffer; filename: string; mimetype: string }> =
      [];
    const parts = req.parts({
      limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 2 },
    });
    for await (const part of parts) {
      if (part.type === "file") {
        const buf = await part.toBuffer();
        if (buf.length === 0) continue;
        if (
          !(SupportedMimeTypes as readonly string[]).includes(part.mimetype)
        ) {
          throw new BadRequestException(
            `Unsupported mime: ${part.mimetype}`,
          );
        }
        files.push({
          buffer: buf,
          filename: part.filename,
          mimetype: part.mimetype,
        });
      }
    }
    if (files.length !== 2) {
      throw new BadRequestException("Need exactly 2 files (old and new)");
    }

    const [oldFile, newFile] = files as [
      (typeof files)[0],
      (typeof files)[0],
    ];

    const [oldText, newText] = await Promise.all([
      this.extractor.extract(oldFile.buffer, oldFile.mimetype),
      this.extractor.extract(newFile.buffer, newFile.mimetype),
    ]);

    if (!oldText.trim() || !newText.trim()) {
      throw new BadRequestException(
        "Failed to extract text from one of the files",
      );
    }

    const result = await this.compareService.compare(
      oldText.slice(0, 60_000),
      newText.slice(0, 60_000),
    );

    return {
      old_filename: oldFile.filename,
      new_filename: newFile.filename,
      ...result,
    };
  }
}

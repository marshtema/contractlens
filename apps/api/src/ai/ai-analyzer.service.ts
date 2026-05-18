import { Injectable } from "@nestjs/common";
import type { AnalysisResult } from "@contractlens/shared";

export interface AnalyzerInput {
  /** Извлечённый текст документа */
  text: string;
  /** Опционально — имя файла (для подсказок модели) */
  filename?: string;
}

@Injectable()
export abstract class AiAnalyzerService {
  abstract analyze(input: AnalyzerInput): Promise<AnalysisResult>;
}

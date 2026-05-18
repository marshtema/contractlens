import { Global, Logger, Module } from "@nestjs/common";
import { AiAnalyzerService } from "./ai-analyzer.service";
import { MockAiAnalyzerService } from "./mock-ai-analyzer.service";
import { GeminiAnalyzerService } from "./gemini-analyzer.service";
import { GroqAnalyzerService } from "./groq-analyzer.service";

@Global()
@Module({
  providers: [
    {
      provide: AiAnalyzerService,
      useFactory: () => {
        const logger = new Logger("AiModule");
        const provider = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

        switch (provider) {
          case "groq": {
            const key = process.env.GROQ_API_KEY;
            if (!key) {
              logger.warn(
                "AI_PROVIDER=groq but GROQ_API_KEY is empty — falling back to mock",
              );
              return new MockAiAnalyzerService();
            }
            logger.log(
              `Using Groq (${process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"})`,
            );
            return new GroqAnalyzerService(key);
          }
          case "gemini": {
            const key = process.env.GEMINI_API_KEY;
            if (!key) {
              logger.warn(
                "AI_PROVIDER=gemini but GEMINI_API_KEY is empty — falling back to mock",
              );
              return new MockAiAnalyzerService();
            }
            logger.log(
              `Using Gemini (${process.env.GEMINI_MODEL ?? "gemini-2.0-flash"})`,
            );
            return new GeminiAnalyzerService(key);
          }
          case "mock":
            logger.log("Using mock analyzer (no LLM)");
            return new MockAiAnalyzerService();
          default:
            logger.warn(
              `Unknown AI_PROVIDER=${provider}, falling back to mock`,
            );
            return new MockAiAnalyzerService();
        }
      },
    },
  ],
  exports: [AiAnalyzerService],
})
export class AiModule {}

import { Global, Module } from "@nestjs/common";
import { AiAnalyzerService } from "./ai-analyzer.service.js";
import { MockAiAnalyzerService } from "./mock-ai-analyzer.service.js";

@Global()
@Module({
  providers: [
    {
      provide: AiAnalyzerService,
      useFactory: () => {
        const provider = process.env.AI_PROVIDER ?? "mock";
        switch (provider) {
          case "mock":
            return new MockAiAnalyzerService();
          // case 'anthropic': return new AnthropicAnalyzerService(...);
          // case 'openai':    return new OpenAIAnalyzerService(...);
          default:
            // eslint-disable-next-line no-console
            console.warn(
              `[ai] unknown AI_PROVIDER=${provider}, falling back to mock`,
            );
            return new MockAiAnalyzerService();
        }
      },
    },
  ],
  exports: [AiAnalyzerService],
})
export class AiModule {}

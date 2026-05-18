import { Injectable, Logger } from "@nestjs/common";
import Groq from "groq-sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamChatInput {
  documentText: string;
  documentSummary?: string;
  documentType?: string;
  messages: ChatMessage[];
}

const SYSTEM_PROMPT = `Ты — AI-юрист, специализирующийся на анализе договоров. Пользователь загрузил договор и задаёт по нему вопросы.

ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе текста договора, который дан ниже. Если ответа в тексте нет — честно скажи "В договоре это не указано".
2. Цитируй точные пункты ("Пункт 4.2 говорит..."). Не выдумывай номера.
3. Объясняй простым языком, как для непрофессионала.
4. Не давай юридических консультаций — только разбор документа.
5. Если пользователь спрашивает о рисках/проблемах — будь честен.
6. Краткость > длинна. 2-5 предложений обычно достаточно.
7. Отвечай на русском, если пользователь пишет на русском.
8. Если вопрос не про договор (а про погоду, политику и т.п.) — мягко верни к теме.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly client: Groq | null;
  private readonly model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  constructor() {
    const key = process.env.GROQ_API_KEY;
    this.client = key ? new Groq({ apiKey: key }) : null;
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async *stream(input: StreamChatInput): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      yield "AI-чат недоступен: не задан GROQ_API_KEY. Подключите ключ в .env, чтобы задавать вопросы.";
      return;
    }

    const context = [
      input.documentType ? `Тип документа: ${input.documentType}` : null,
      input.documentSummary ? `Резюме анализа: ${input.documentSummary}` : null,
      "",
      "ТЕКСТ ДОГОВОРА:",
      "---",
      input.documentText.slice(0, 50_000),
      "---",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
          ...input.messages.slice(-12), // последние 12 сообщений из истории
        ],
        temperature: 0.3,
        max_tokens: 1024,
        stream: true,
      });

      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`chat stream failed: ${message}`);
      yield `\n\n[ошибка: ${message.slice(0, 200)}]`;
    }
  }
}

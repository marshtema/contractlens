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

/**
 * Эвристический ответ для случая без LLM-ключа.
 * Не такой умный, но даёт пользователю осмысленный ответ по типичным вопросам.
 */
async function* mockReply(
  input: StreamChatInput,
): AsyncGenerator<string, void, unknown> {
  const lastUser =
    [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = lastUser.toLowerCase();
  const text = input.documentText.toLowerCase();

  const reply = (() => {
    if (/риск|опасн|плох/.test(q)) {
      const flags: string[] = [];
      if (/90\s*дн/.test(text)) flags.push("срок оплаты 90 дней");
      if (/без\s+ограничен|в\s+полном\s+объ/.test(text))
        flags.push("неограниченная ответственность");
      if (/автоматическ\w+\s+продл/.test(text)) flags.push("автоматическое продление");
      if (/не\s+(вправе|может)\s+(заключ|сотрудн|работ).+конкурент/.test(text))
        flags.push("ограничение на работу с конкурентами");
      if (flags.length) {
        return `Основные риски в этом договоре: ${flags.join(", ")}. Подробности — в карточках рисков выше. Реальный AI-анализ доступен при подключении GROQ_API_KEY.`;
      }
      return "Я работаю в режиме без LLM — точных оценок дать не могу. См. карточки рисков выше: они построены на проверенных эвристиках.";
    }

    if (/срок\s+опл|когда\s+плат|оплат/.test(q)) {
      const m = text.match(/[^.\n]{0,40}(\d+\s*(?:календарн|банковск|рабоч)?\s*(?:их|ых)?\s*дн[^.\n]{0,40})/);
      if (m) return `В договоре указан срок оплаты: «${m[1]}». См. карточку «Оплата».`;
      return "Срок оплаты в извлечённом тексте не нашёлся. Проверьте раздел про расчёты в самом документе.";
    }

    if (/растор|прекращ/.test(q)) {
      return "Условия расторжения см. в блоке «Ключевые факты» → «Расторжение». Обычно нужно уведомление за 30 дней.";
    }

    if (/подпис|можно\s+ли/.test(q)) {
      return "Решение о подписании зависит от вашей готовности принять найденные риски. См. вердикт сверху отчёта.";
    }

    if (/что|где|какой|какие/.test(q)) {
      return "Эвристический режим не умеет давать развёрнутые ответы. Главные факты — в блоке «Ключевые факты», риски — в карточках ниже. Для полноценного диалога подключите GROQ_API_KEY в apps/api/.env.";
    }

    return "Я в режиме без LLM-ключа — отвечаю только на типовые вопросы (риски, оплата, расторжение). Подключите GROQ_API_KEY для полноценного AI-чата.";
  })();

  // Стримим по словам для эффекта реального ответа
  for (const word of reply.split(/(\s+)/)) {
    if (word) {
      yield word;
      await new Promise((r) => setTimeout(r, 25));
    }
  }
}

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
      // Mock-режим: эвристические ответы по тексту документа.
      // Не такой умный как LLM, но даёт пользователю что-то осмысленное.
      yield* mockReply(input);
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

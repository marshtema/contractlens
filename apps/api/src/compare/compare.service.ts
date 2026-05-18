import { Injectable, Logger } from "@nestjs/common";
import { diffWords } from "diff";
import Groq from "groq-sdk";

export interface DiffChunk {
  type: "added" | "removed" | "context";
  text: string;
}

export interface CompareResult {
  diff: DiffChunk[];
  changes_count: { added: number; removed: number };
  ai_summary: string;
  ai_changes: Array<{
    title: string;
    impact: "positive" | "negative" | "neutral";
    explanation: string;
  }>;
}

const SYSTEM_PROMPT = `Ты — юрист, оцениваешь изменения между двумя версиями договора с точки зрения слабой стороны (исполнитель/арендатор/работник).

На входе — diff между старой и новой версией. Тебе нужно:
1. Дать общее резюме (1-3 предложения): кто выиграл от правок и стало ли в целом лучше или хуже.
2. Перечислить значимые изменения (3-7 пунктов), каждое с оценкой impact:
   - positive: правка в пользу слабой стороны
   - negative: правка в пользу сильной стороны
   - neutral: формальность

Не упоминай каждую запятую — только значимые правки.

Ответ — строго валидный JSON:
{
  "ai_summary": "...",
  "ai_changes": [
    { "title": "Срок оплаты сокращён с 90 до 30 дней", "impact": "positive", "explanation": "..." }
  ]
}`;

@Injectable()
export class CompareService {
  private readonly logger = new Logger(CompareService.name);
  private readonly client: Groq | null;
  private readonly model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  constructor() {
    const key = process.env.GROQ_API_KEY;
    this.client = key ? new Groq({ apiKey: key }) : null;
  }

  async compare(oldText: string, newText: string): Promise<CompareResult> {
    const rawDiff = diffWords(oldText, newText);
    const chunks: DiffChunk[] = rawDiff.map((p) => ({
      type: p.added ? "added" : p.removed ? "removed" : "context",
      text: p.value,
    }));
    const added = chunks.filter((c) => c.type === "added").length;
    const removed = chunks.filter((c) => c.type === "removed").length;

    let aiSummary = "Анализ изменений недоступен: AI не подключён.";
    let aiChanges: CompareResult["ai_changes"] = [];

    if (this.client) {
      try {
        const diffForAi = chunks
          .map((c) =>
            c.type === "added"
              ? `[+] ${c.text}`
              : c.type === "removed"
                ? `[-] ${c.text}`
                : c.text.slice(0, 200),
          )
          .join("");

        const userMsg = `Diff между старой и новой версией договора (фрагменты помечены [+] добавлено и [-] удалено):

${diffForAi.slice(0, 30_000)}

Дай резюме и список значимых изменений по правилам system. Только JSON.`;

        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMsg },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 2000,
        });

        const raw = completion.choices[0]?.message?.content;
        if (raw) {
          const parsed = JSON.parse(raw) as {
            ai_summary?: string;
            ai_changes?: CompareResult["ai_changes"];
          };
          if (parsed.ai_summary) aiSummary = parsed.ai_summary;
          if (Array.isArray(parsed.ai_changes)) {
            aiChanges = parsed.ai_changes.filter((c) => c && c.title);
          }
        }
      } catch (err) {
        this.logger.error(
          `AI compare failed: ${err instanceof Error ? err.message : err}`,
        );
        aiSummary = `Ошибка AI: ${
          err instanceof Error ? err.message.slice(0, 200) : "неизвестная ошибка"
        }`;
      }
    }

    return {
      diff: chunks,
      changes_count: { added, removed },
      ai_summary: aiSummary,
      ai_changes: aiChanges,
    };
  }
}

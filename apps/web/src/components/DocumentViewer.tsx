"use client";

import { useMemo, useState } from "react";
import { FileText, ZoomIn, ZoomOut } from "lucide-react";
import type { RiskItem, RiskLevel } from "@contractlens/shared";
import { cn } from "@/lib/cn";

type Highlight = {
  start: number;
  end: number;
  index: number;
  level: RiskLevel;
};

const LEVEL_BG: Record<RiskLevel, string> = {
  critical: "bg-risk-critical/25 hover:bg-risk-critical/40 ring-risk-critical/40",
  warning: "bg-risk-warning/25 hover:bg-risk-warning/40 ring-risk-warning/40",
  info: "bg-risk-info/25 hover:bg-risk-info/40 ring-risk-info/40",
};

export function DocumentViewer({
  text,
  risks,
  activeRiskIndex,
  onRiskClick,
}: {
  text: string;
  risks: RiskItem[];
  activeRiskIndex: number | null;
  onRiskClick: (index: number) => void;
}) {
  const [fontSize, setFontSize] = useState(14);

  const segments = useMemo(() => {
    const highlights: Highlight[] = [];
    risks.forEach((r, i) => {
      if (!r.clause_text) return;
      const idx = findApproximate(text, r.clause_text);
      if (idx >= 0) {
        highlights.push({
          start: idx,
          end: idx + r.clause_text.length,
          index: i,
          level: r.risk_level,
        });
      }
    });
    highlights.sort((a, b) => a.start - b.start);
    // Удалим пересечения — оставляем первый
    const dedup: Highlight[] = [];
    let cursor = 0;
    for (const h of highlights) {
      if (h.start < cursor) continue;
      dedup.push(h);
      cursor = h.end;
    }
    // Сегментируем текст
    const out: Array<
      { type: "text"; content: string } | { type: "mark"; content: string; h: Highlight }
    > = [];
    let pos = 0;
    for (const h of dedup) {
      if (h.start > pos) out.push({ type: "text", content: text.slice(pos, h.start) });
      out.push({
        type: "mark",
        content: text.slice(h.start, h.end),
        h,
      });
      pos = h.end;
    }
    if (pos < text.length) out.push({ type: "text", content: text.slice(pos) });
    return out;
  }, [text, risks]);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-bg-card">
      <div className="flex items-center justify-between border-b border-line/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <FileText className="h-4 w-4" />
          Текст документа с подсветкой рисков
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.max(10, s - 1))}
            className="rounded p-1 text-ink-dim hover:bg-bg-hover hover:text-ink"
            aria-label="Уменьшить"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setFontSize((s) => Math.min(20, s + 1))}
            className="rounded p-1 text-ink-dim hover:bg-bg-hover hover:text-ink"
            aria-label="Увеличить"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-5">
        <pre
          className="whitespace-pre-wrap break-words font-sans leading-relaxed text-ink"
          style={{ fontSize: `${fontSize}px` }}
        >
          {segments.map((s, i) =>
            s.type === "text" ? (
              <span key={i}>{s.content}</span>
            ) : (
              <button
                key={i}
                type="button"
                id={`mark-${s.h.index}`}
                onClick={() => onRiskClick(s.h.index)}
                className={cn(
                  "cursor-pointer rounded px-0.5 ring-1 transition",
                  LEVEL_BG[s.h.level],
                  activeRiskIndex === s.h.index &&
                    "ring-2 ring-offset-2 ring-offset-bg-card",
                )}
                title={`Риск #${s.h.index + 1} — нажмите для деталей`}
              >
                {s.content}
              </button>
            ),
          )}
        </pre>
      </div>
    </div>
  );
}

/**
 * Ищет точную или приблизительную позицию цитаты в тексте.
 * AI иногда обрезает/нормализует пробелы — пробуем точное, потом по словам.
 */
function findApproximate(text: string, quote: string): number {
  if (!quote) return -1;
  const direct = text.indexOf(quote);
  if (direct >= 0) return direct;
  // Нормализуем пробелы и пробуем
  const normQuote = quote.replace(/\s+/g, " ").trim();
  const normText = text.replace(/\s+/g, " ");
  const idx = normText.indexOf(normQuote);
  if (idx >= 0) {
    // Маппим обратно — приблизительно
    return Math.min(idx, text.length - normQuote.length);
  }
  // По первым 40 символам
  const head = normQuote.slice(0, Math.min(40, normQuote.length));
  if (head.length >= 15) {
    const idx2 = normText.indexOf(head);
    if (idx2 >= 0) return Math.min(idx2, text.length - 1);
  }
  return -1;
}

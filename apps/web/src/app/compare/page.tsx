"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  GitCompare,
  Loader2,
  Minus,
  Plus,
  ShieldAlert,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";

type DiffChunk = { type: "added" | "removed" | "context"; text: string };
type ChangeImpact = "positive" | "negative" | "neutral";
type CompareResponse = {
  old_filename: string;
  new_filename: string;
  diff: DiffChunk[];
  changes_count: { added: number; removed: number };
  ai_summary: string;
  ai_changes: Array<{
    title: string;
    impact: ChangeImpact;
    explanation: string;
  }>;
};

const ACCEPT = ".pdf,.docx,.txt";

export default function ComparePage() {
  const [oldFile, setOldFile] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!oldFile || !newFile) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("files", oldFile);
      fd.append("files", newFile);
      const res = await fetch("/api/compare", { method: "POST", body: fd });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = (await res.json()) as CompareResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сравнить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-bg-elevated px-3 py-1 text-xs text-ink-muted">
          <GitCompare className="h-3 w-3 text-brand-400" />
          Сравнение версий
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
          Что изменилось между версиями договора?
        </h1>
        <p className="mt-3 text-ink-muted">
          Загрузите старую и новую версии — AI найдёт значимые правки и
          подскажет, в чью пользу каждая.
        </p>
      </div>

      {/* UPLOAD */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <FileSlot
          label="Старая версия"
          file={oldFile}
          onChange={setOldFile}
          color="text-risk-warning"
        />
        <FileSlot
          label="Новая версия"
          file={newFile}
          onChange={setNewFile}
          color="text-brand-400"
        />
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => void run()}
          disabled={!oldFile || !newFile || busy}
          className="btn-primary disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Сравниваем…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Сравнить версии
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-risk-critical/30 bg-risk-critical-bg p-3 text-sm text-risk-critical">
          {error}
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="mt-10 space-y-6">
          {/* SUMMARY */}
          <div className="rounded-2xl border border-line bg-bg-card p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-dim">
              <Sparkles className="h-3 w-3 text-brand-400" />
              AI-резюме
            </div>
            <p className="mt-2 text-ink">{result.ai_summary}</p>
            <div className="mt-4 flex gap-4 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-risk-good-bg px-2 py-1 text-risk-good">
                <Plus className="h-3 w-3" /> {result.changes_count.added} добавлений
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-risk-critical-bg px-2 py-1 text-risk-critical">
                <Minus className="h-3 w-3" /> {result.changes_count.removed} удалений
              </span>
            </div>
          </div>

          {/* CHANGES */}
          {result.ai_changes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
                Значимые правки
              </h2>
              <ul className="space-y-2">
                {result.ai_changes.map((c, i) => (
                  <ChangeRow key={i} change={c} />
                ))}
              </ul>
            </div>
          )}

          {/* DIFF */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-muted">
              Полный diff
            </h2>
            <div className="overflow-hidden rounded-2xl border border-line bg-bg-card">
              <div className="border-b border-line/60 px-4 py-2 text-xs text-ink-dim">
                {result.old_filename}{" "}
                <ArrowRight className="inline h-3 w-3" /> {result.new_filename}
              </div>
              <pre className="max-h-[600px] overflow-auto p-4 text-xs leading-relaxed text-ink">
                {result.diff.map((c, i) =>
                  c.type === "added" ? (
                    <span
                      key={i}
                      className="bg-risk-good-bg text-risk-good"
                    >
                      {c.text}
                    </span>
                  ) : c.type === "removed" ? (
                    <span
                      key={i}
                      className="bg-risk-critical-bg text-risk-critical line-through decoration-1"
                    >
                      {c.text}
                    </span>
                  ) : (
                    <span key={i} className="text-ink-muted">
                      {c.text}
                    </span>
                  ),
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileSlot({
  label,
  file,
  onChange,
  color,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  color: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition",
        file
          ? "border-line-strong bg-bg-card"
          : "border-line bg-bg-card/60 hover:border-line-strong",
      )}
    >
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          color,
        )}
      >
        {label}
      </div>
      <div className="mt-2 text-sm text-ink">
        {file ? file.name : "Перетащите или нажмите"}
      </div>
      {file && (
        <div className="mt-1 text-xs text-ink-dim">
          {(file.size / 1024).toFixed(1)} КБ
        </div>
      )}
      <input
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function ChangeRow({
  change,
}: {
  change: CompareResponse["ai_changes"][number];
}) {
  const meta =
    change.impact === "positive"
      ? {
          icon: CheckCircle2,
          tone: "text-risk-good",
          border: "border-risk-good/30",
          bg: "bg-risk-good-bg",
        }
      : change.impact === "negative"
        ? {
            icon: XCircle,
            tone: "text-risk-critical",
            border: "border-risk-critical/30",
            bg: "bg-risk-critical-bg",
          }
        : {
            icon: ShieldAlert,
            tone: "text-ink-dim",
            border: "border-line",
            bg: "bg-bg-card",
          };
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        meta.border,
        meta.bg,
      )}
    >
      <meta.icon className={cn("mt-0.5 h-5 w-5 shrink-0", meta.tone)} />
      <div>
        <div className="font-medium text-ink">{change.title}</div>
        <div className="mt-1 text-sm text-ink-muted">{change.explanation}</div>
      </div>
    </li>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { ArrowRight, FileUp, Loader2, ShieldAlert } from "lucide-react";
import { uploadDocument } from "@/lib/api";
import { cn } from "@/lib/cn";

const ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg";

export function UploadForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const doc = await uploadDocument(file);
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить файл");
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="w-full">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
          compact ? "p-8" : "p-12",
          dragOver
            ? "border-brand-400 bg-brand-500/10"
            : "border-line bg-bg-card/60 hover:border-line-strong hover:bg-bg-card",
          busy && "pointer-events-none opacity-70",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(14,165,233,0.06), transparent 40%)",
          }}
        />

        <div
          className={cn(
            "relative flex h-12 w-12 items-center justify-center rounded-full",
            dragOver
              ? "bg-brand-500/20 text-brand-400"
              : "bg-bg-elevated text-ink-muted group-hover:text-brand-400",
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileUp className="h-5 w-5" />
          )}
        </div>

        <div className="relative mt-4 text-center">
          <div className="text-base font-medium text-ink">
            {busy
              ? "Загружаем и анализируем…"
              : dragOver
                ? "Отпустите — начнём анализ"
                : "Перетащите файл сюда"}
          </div>
          <div className="mt-1 text-sm text-ink-muted">
            или нажмите для выбора · PDF, DOCX, TXT, JPG, PNG · до 10 МБ
          </div>
        </div>

        {!busy && !compact && (
          <div className="relative mt-6 inline-flex items-center gap-2 text-xs text-ink-dim">
            <ShieldAlert className="h-3.5 w-3.5" />
            Документ обрабатывается локально, без передачи третьим лицам
            кроме AI-провайдера
          </div>
        )}

        <input
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </label>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-risk-critical/30 bg-risk-critical-bg p-3 text-sm text-risk-critical">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {compact && !busy && (
        <button
          type="button"
          onClick={() => {
            const input = document.querySelector<HTMLInputElement>(
              'input[type="file"]',
            );
            input?.click();
          }}
          className="btn-primary mt-3 w-full"
        >
          Выбрать файл <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

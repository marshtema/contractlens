"use client";

import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { uploadDocument } from "@/lib/api";

const ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg";

export function UploadForm() {
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
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors",
          dragOver
            ? "border-neutral-900 bg-neutral-100"
            : "border-neutral-300 bg-white hover:bg-neutral-50",
          busy ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <div className="text-base font-medium text-neutral-900">
          {busy ? "Загружаем и анализируем…" : "Перетащите файл сюда"}
        </div>
        <div className="mt-1 text-sm text-neutral-500">
          или нажмите, чтобы выбрать (PDF, DOCX, TXT, JPG, PNG — до 10 МБ)
        </div>
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
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

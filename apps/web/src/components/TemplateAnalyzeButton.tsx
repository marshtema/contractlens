"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ApiError, uploadDocument } from "@/lib/api";
import {
  LimitReachedDialog,
  type LimitInfo,
} from "./LimitReachedDialog";
import { useToast } from "./Toast";

export function TemplateAnalyzeButton({
  filename,
  content,
}: {
  filename: string;
  content: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState<LimitInfo | null>(null);

  async function run() {
    setBusy(true);
    try {
      const file = new File([content], filename, { type: "text/plain" });
      const doc = await uploadDocument(file);
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        const body = err.body as {
          current_plan?: string;
          documents_used?: number;
          documents_limit?: number;
        };
        setLimit({
          currentPlan: body.current_plan ?? "free",
          documentsUsed: body.documents_used ?? 0,
          documentsLimit: body.documents_limit ?? 3,
        });
      } else {
        toast.push(
          "error",
          "Не удалось проанализировать шаблон",
          err instanceof Error ? err.message : "неизвестная ошибка",
        );
      }
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="btn-primary mt-5 w-full disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Анализируем…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Проанализировать шаблон
          </>
        )}
      </button>
      <LimitReachedDialog info={limit} onClose={() => setLimit(null)} />
    </>
  );
}

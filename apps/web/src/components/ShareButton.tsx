"use client";

import { Check, Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "./Toast";

export function ShareButton({ documentId }: { documentId: string }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  async function shareIt() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { token: string };
      const url = `${window.location.origin}/share/${data.token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.push(
        "success",
        "Ссылка скопирована",
        "Любой по этой ссылке увидит отчёт (без авторизации).",
      );
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.push(
        "error",
        "Не получилось создать ссылку",
        err instanceof Error ? err.message : "неизвестная ошибка",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void shareIt()}
      disabled={busy}
      className="btn-ghost"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4 text-risk-good" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {copied ? "Скопировано" : "Поделиться"}
    </button>
  );
}

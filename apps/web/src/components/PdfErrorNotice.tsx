"use client";

import { useEffect, useRef } from "react";
import { useToast } from "./Toast";

export function PdfErrorNotice({ status }: { status: string }) {
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    const msg =
      status === "403"
        ? "Доступ к PDF ограничен — документ принадлежит другому пользователю."
        : status === "404"
          ? "Отчёт ещё не сгенерирован. Дождитесь окончания анализа."
          : `Не удалось скачать PDF (код ${status}).`;
    toast.push("error", "PDF недоступен", msg);
  }, [status, toast]);

  return null;
}

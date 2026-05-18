"use client";

import { motion } from "framer-motion";
import { Brain, FileSearch, ListChecks, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  { icon: FileSearch, label: "Извлекаем текст" },
  { icon: Brain, label: "AI анализирует пункты" },
  { icon: ListChecks, label: "Проверяем 50+ красных флагов" },
  { icon: ShieldCheck, label: "Готовим отчёт" },
];

export function ProcessingPoller({ id }: { id: string }) {
  const router = useRouter();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, 3500);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/documents/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const doc = await res.json();
        if (doc.status !== "processing") {
          router.refresh();
        }
      } catch {
        /* keep polling */
      }
    }, 1500);

    return () => {
      clearInterval(stageInterval);
      clearInterval(pollInterval);
    };
  }, [id, router]);

  return (
    <div className="rounded-2xl border border-line bg-bg-card p-8">
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-400">
          <Brain className="h-5 w-5" />
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
        </div>
        <div>
          <div className="font-medium text-ink">Анализируем документ…</div>
          <div className="text-sm text-ink-muted">
            Обычно 5–30 секунд. Страница обновится сама.
          </div>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {STAGES.map((s, i) => {
          const active = i === stage;
          const done = i < stage;
          return (
            <motion.li
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 text-sm"
            >
              <s.icon
                className={
                  done
                    ? "h-4 w-4 text-risk-good"
                    : active
                      ? "h-4 w-4 animate-pulse text-brand-400"
                      : "h-4 w-4 text-ink-dim"
                }
              />
              <span
                className={
                  done
                    ? "text-ink-muted line-through decoration-ink-dim/40"
                    : active
                      ? "text-ink"
                      : "text-ink-dim"
                }
              >
                {s.label}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

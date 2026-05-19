"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Loader2,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { useToast } from "./Toast";

export interface LimitInfo {
  currentPlan: string;
  documentsUsed: number;
  documentsLimit: number;
}

const PLANS = [
  {
    id: "pro" as const,
    name: "Pro",
    price: "₽890",
    period: "/мес",
    docs: 20,
    pages: 50,
    bullets: [
      "20 документов в месяц",
      "До 50 страниц на документ",
      "Сравнение версий",
      "PDF-отчёты без водяного знака",
    ],
    featured: true,
  },
  {
    id: "business" as const,
    name: "Business",
    price: "₽2 890",
    period: "/мес",
    docs: 1000,
    pages: 200,
    bullets: [
      "Безлимит документов",
      "До 200 страниц",
      "API доступ",
      "Командный доступ + приоритет",
    ],
    featured: false,
  },
];

export function LimitReachedDialog({
  info,
  onClose,
}: {
  info: LimitInfo | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upgrade(plan: "pro" | "business") {
    setBusyPlan(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        mode: "stripe" | "dev_mock" | "instant" | "contact_sales";
        url?: string;
      };
      if (data.mode === "stripe" && data.url) {
        window.location.href = data.url;
        return;
      }
      toast.push(
        "success",
        `Тариф ${plan.toUpperCase()} активирован`,
        "Лимит обновлён — можете загружать дальше.",
      );
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось переключить тариф");
      setBusyPlan(null);
    }
  }

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-bg-card shadow-2xl"
          >
            {/* HEADER */}
            <div className="relative overflow-hidden border-b border-line/60 px-6 py-6">
              <div className="absolute inset-0 bg-brand-glow opacity-50" aria-hidden />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-md p-1 text-ink-dim transition hover:bg-bg-hover hover:text-ink"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-risk-warning-bg text-risk-warning">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-ink">
                    Лимит плана достигнут
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    На тарифе{" "}
                    <span className="font-semibold text-ink">
                      {info.currentPlan.toUpperCase()}
                    </span>{" "}
                    доступно{" "}
                    <span className="font-semibold text-ink">
                      {info.documentsUsed} / {info.documentsLimit}
                    </span>{" "}
                    документов в месяц. Чтобы загрузить ещё — выберите тариф
                    повыше.
                  </p>
                </div>
              </div>

              {/* PROGRESS */}
              <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-bg-elevated">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, (info.documentsUsed / Math.max(info.documentsLimit, 1)) * 100)}%`,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-risk-warning"
                />
              </div>
            </div>

            {/* PLANS */}
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "relative overflow-hidden rounded-xl border p-5 transition",
                    p.featured
                      ? "border-brand-500/50 bg-gradient-to-b from-brand-500/[0.08] to-transparent shadow-lg shadow-brand-glow"
                      : "border-line bg-bg-elevated hover:border-line-strong",
                  )}
                >
                  {p.featured && (
                    <div className="absolute -top-2 right-3 rounded-full border border-brand-500/50 bg-bg px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-400">
                      Популярный
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {p.featured ? (
                      <Sparkles className="h-4 w-4 text-brand-400" />
                    ) : (
                      <Zap className="h-4 w-4 text-ink-dim" />
                    )}
                    <span className="text-sm font-semibold text-ink">
                      {p.name}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-ink">{p.price}</span>
                    <span className="text-xs text-ink-dim">{p.period}</span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs">
                    {p.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-1.5 text-ink-muted"
                      >
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-risk-good" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => void upgrade(p.id)}
                    disabled={busyPlan !== null}
                    className={cn(
                      "mt-4 w-full",
                      p.featured ? "btn-primary" : "btn-ghost",
                      busyPlan !== null && "opacity-60",
                    )}
                  >
                    {busyPlan === p.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Переключиться на {p.name}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div className="mx-6 mb-4 rounded-lg border border-risk-critical/30 bg-risk-critical-bg p-3 text-sm text-risk-critical">
                {error}
              </div>
            )}

            <div className="border-t border-line/60 bg-bg-elevated/40 px-6 py-3 text-center text-xs text-ink-dim">
              Test-mode: переключение тарифа происходит мгновенно, без оплаты.
              Stripe-интеграция включится при добавлении STRIPE_SECRET_KEY.
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

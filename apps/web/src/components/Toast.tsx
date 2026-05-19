"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertOctagon,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
  ttl: number;
}

interface ToastCtx {
  push: (kind: ToastKind, title: string, description?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, kind, title, description, ttl: 4000 }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col-reverse gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              toast={t}
              onClose={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
            />
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Тихий no-op чтобы компоненты не падали вне Provider'a
    return {
      push: (kind, title) => {
        // eslint-disable-next-line no-console
        console.log(`[toast:${kind}]`, title);
      },
    };
  }
  return ctx;
}

const META: Record<
  ToastKind,
  { icon: LucideIcon; border: string; text: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    border: "border-risk-good/40",
    text: "text-risk-good",
    bg: "bg-risk-good-bg",
  },
  error: {
    icon: AlertOctagon,
    border: "border-risk-critical/40",
    text: "text-risk-critical",
    bg: "bg-risk-critical-bg",
  },
  info: {
    icon: Info,
    border: "border-brand-500/40",
    text: "text-brand-400",
    bg: "bg-brand-500/10",
  },
};

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const m = META[toast.kind];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border bg-bg-card p-3 pr-2 shadow-2xl backdrop-blur",
        m.border,
      )}
    >
      <div className={cn("mt-0.5 shrink-0", m.text)}>
        <m.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 text-xs text-ink-muted">
            {toast.description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-ink-dim hover:bg-bg-hover hover:text-ink"
        aria-label="Закрыть"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

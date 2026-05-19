"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  FileText,
  GitCompare,
  Home,
  LogIn,
  Scroll,
  Search,
  Sparkles,
  Upload,
  User,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  action: () => void | Promise<void>;
  keywords: string;
  section: "Навигация" | "Действия";
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const items: CommandItem[] = useMemo(
    () => [
      {
        id: "home",
        label: "Главная — загрузить документ",
        icon: Upload,
        keywords: "главная upload загрузить новый анализ home",
        section: "Навигация",
        action: () => router.push("/"),
      },
      {
        id: "history",
        label: "История документов",
        icon: FileText,
        keywords: "история документы history list",
        section: "Навигация",
        action: () => router.push("/documents"),
      },
      {
        id: "compare",
        label: "Сравнить две версии",
        icon: GitCompare,
        keywords: "сравнение compare diff версии",
        section: "Навигация",
        action: () => router.push("/compare"),
      },
      {
        id: "calendar",
        label: "Календарь договоров",
        icon: CalendarDays,
        keywords: "календарь calendar дедлайны renewal",
        section: "Навигация",
        action: () => router.push("/calendar"),
      },
      {
        id: "templates",
        label: "Библиотека шаблонов",
        icon: Scroll,
        keywords: "шаблоны templates образцы",
        section: "Навигация",
        action: () => router.push("/templates"),
      },
      {
        id: "pricing",
        label: "Тарифы",
        icon: Sparkles,
        hint: "Pro · Business",
        keywords: "тарифы pricing подписка plan",
        section: "Навигация",
        action: () => router.push("/#pricing"),
      },
      {
        id: "login",
        label: "Войти / Аккаунт",
        icon: User,
        keywords: "login войти аккаунт регистрация sign in",
        section: "Действия",
        action: () => router.push("/login"),
      },
    ],
    [router],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.keywords.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [active, filtered.length]);

  function run(item: CommandItem) {
    setOpen(false);
    void item.action();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-bg-card shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line/60 px-4 py-3">
              <Search className="h-4 w-4 text-ink-dim" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, filtered.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const it = filtered[active];
                    if (it) run(it);
                  }
                }}
                placeholder="Куда хотите перейти?"
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
              />
              <kbd className="rounded border border-line bg-bg-elevated px-1.5 py-0.5 text-[10px] text-ink-dim">
                Esc
              </kbd>
            </div>

            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-ink-dim">
                  Ничего не найдено
                </li>
              ) : (
                filtered.map((item, idx) => (
                  <li
                    key={item.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => run(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
                      active === idx
                        ? "bg-brand-500/15 text-ink"
                        : "text-ink-muted",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active === idx ? "text-brand-400" : "text-ink-dim",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.hint && (
                      <span className="text-xs text-ink-dim">{item.hint}</span>
                    )}
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-line/60 px-4 py-2 text-[11px] text-ink-dim">
              <div className="flex gap-3">
                <span>
                  <kbd className="rounded border border-line bg-bg-elevated px-1">↑↓</kbd>{" "}
                  навигация
                </span>
                <span>
                  <kbd className="rounded border border-line bg-bg-elevated px-1">↵</kbd>{" "}
                  выбрать
                </span>
              </div>
              <span>ContractLens AI</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

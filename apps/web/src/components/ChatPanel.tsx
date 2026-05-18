"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Loader2,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Объясни простыми словами что вообще от меня хотят",
  "На что нужно обратить внимание в первую очередь?",
  "Можно ли подписать как есть?",
  "Какие пункты можно смело попросить убрать?",
];

export function ChatPanel({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || streaming) return;
    const userMsg: Msg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(`/api/documents/${documentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl;
        while ((nl = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);

          const dataLine = block
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const payload = dataLine.slice(6);
          try {
            const parsed = JSON.parse(payload) as { token?: string };
            if (parsed.token) {
              assistantText += parsed.token;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return copy;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              content:
                last.content +
                `\n\n[ошибка: ${err instanceof Error ? err.message : "не удалось получить ответ"}]`,
            };
          }
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl shadow-brand-glow transition",
          open
            ? "bg-bg-elevated text-ink"
            : "bg-brand-500 text-white hover:bg-brand-400",
        )}
        aria-label={open ? "Закрыть чат" : "Открыть AI-чат"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[600px] max-h-[80vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-line bg-bg-card shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-line/60 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500/15 text-brand-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">
                    AI-чат с документом
                  </div>
                  <div className="text-xs text-ink-dim">
                    Llama 3.3 · работает с текстом этого договора
                  </div>
                </div>
              </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-ink-muted">
                    Задайте вопрос про этот договор. Например:
                  </div>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="block w-full rounded-lg border border-line bg-bg-elevated px-3 py-2 text-left text-sm text-ink-muted transition hover:border-brand-500/40 hover:bg-bg-hover hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {messages.map((m, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                          m.role === "user"
                            ? "bg-brand-500 text-white"
                            : "border border-line bg-bg-elevated text-ink",
                        )}
                      >
                        {m.content || (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-dim" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* INPUT */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="border-t border-line/60 p-3"
            >
              <div className="flex items-end gap-2 rounded-xl border border-line bg-bg-elevated p-2 focus-within:border-brand-500/50">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder="Задайте вопрос про договор…"
                  disabled={streaming}
                  className="max-h-32 flex-1 resize-none bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={streaming || !input.trim()}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                    streaming || !input.trim()
                      ? "bg-bg-hover text-ink-dim"
                      : "bg-brand-500 text-white hover:bg-brand-400",
                  )}
                  aria-label="Отправить"
                >
                  {streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-1.5 text-center text-[10px] text-ink-dim">
                Shift+Enter — перенос строки
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

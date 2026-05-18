"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ devLink?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { ok: true; dev_link?: string };
      setDone({ devLink: data.dev_link });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось отправить ссылку",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold text-ink">
          Войти в аккаунт
        </h1>
        <p className="mt-2 text-ink-muted">
          Введите email — пришлём ссылку для входа. Без паролей.
        </p>
      </div>

      {done ? (
        <div className="mt-8 rounded-2xl border border-risk-good/30 bg-risk-good-bg p-6 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-risk-good" />
          <div className="mt-3 font-medium text-ink">
            Ссылка отправлена на {email}
          </div>
          <div className="mt-1 text-sm text-ink-muted">
            Откройте письмо и нажмите кнопку — войдёте автоматически.
          </div>
          {done.devLink && (
            <div className="mt-5 rounded-lg border border-line bg-bg-elevated p-3 text-left">
              <div className="text-xs uppercase tracking-wider text-ink-dim">
                Dev-режим: ссылка для входа
              </div>
              <a
                href={done.devLink}
                className="mt-1 block break-all text-xs text-brand-400 hover:underline"
              >
                {done.devLink}
              </a>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              className="w-full rounded-xl border border-line bg-bg-card py-3 pl-10 pr-3 text-ink placeholder:text-ink-dim focus:border-brand-500/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !email}
            className="btn-primary w-full disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Прислать ссылку <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          {error && (
            <div className="rounded-lg border border-risk-critical/30 bg-risk-critical-bg p-3 text-sm text-risk-critical">
              {error}
            </div>
          )}
          <p className="text-center text-xs text-ink-dim">
            Нажимая, вы соглашаетесь с условиями использования.
          </p>
        </form>
      )}
    </div>
  );
}

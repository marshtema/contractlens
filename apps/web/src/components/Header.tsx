"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, LogOut, Scale, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/cn";

type Me = {
  user: {
    id: string;
    email: string;
    name: string | null;
    subscriptionTier: string;
    documentsUsedThisMonth: number;
    documentsLimit: number;
  } | null;
};

export function Header() {
  const [me, setMe] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ user: null }));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ user: null });
    setMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="container-narrow flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500/15 text-brand-400">
            <Scale className="h-4 w-4" />
          </span>
          <span className="tracking-tight">
            ContractLens<span className="text-ink-dim"> AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/compare"
            className="hidden rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink sm:inline"
          >
            Сравнить версии
          </Link>
          <Link
            href="/templates"
            className="hidden rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink sm:inline"
          >
            Шаблоны
          </Link>
          <Link
            href="/documents"
            className="hidden rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink sm:inline"
          >
            История
          </Link>
          {me?.user && (
            <Link
              href="/calendar"
              className="hidden rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink sm:inline"
            >
              <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
              Календарь
            </Link>
          )}
          <Link
            href="/#pricing"
            className="hidden rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink sm:inline"
          >
            Тарифы
          </Link>

          {me === null ? (
            <span className="ml-2 h-8 w-20 animate-pulse rounded-md bg-bg-elevated" />
          ) : me.user ? (
            <div className="relative ml-2">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md border border-line bg-bg-elevated px-2.5 py-1.5 text-xs text-ink-muted transition hover:border-line-strong hover:text-ink"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-semibold text-brand-400">
                  {initials(me.user.email)}
                </span>
                <span className="hidden sm:inline">
                  {me.user.email.split("@")[0]}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                    planBadge(me.user.subscriptionTier),
                  )}
                >
                  {me.user.subscriptionTier}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-bg-card shadow-xl">
                  <div className="border-b border-line/60 p-3">
                    <div className="truncate text-sm font-medium text-ink">
                      {me.user.email}
                    </div>
                    <div className="mt-1 text-xs text-ink-dim">
                      {me.user.documentsUsedThisMonth} /{" "}
                      {me.user.documentsLimit} документов в этом месяце
                    </div>
                  </div>
                  <Link
                    href="/calendar"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink sm:hidden"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Календарь
                  </Link>
                  <Link
                    href="/#pricing"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
                  >
                    <Sparkles className="h-4 w-4" />
                    Сменить тариф
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2 border-t border-line/60 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-line bg-bg-elevated px-3 py-1.5 text-sm text-ink-muted transition hover:border-brand-500/40 hover:text-ink"
            >
              <User className="h-3.5 w-3.5" />
              Войти
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

function planBadge(tier: string): string {
  switch (tier) {
    case "pro":
      return "bg-brand-500/15 text-brand-400";
    case "business":
      return "bg-risk-good/15 text-risk-good";
    case "enterprise":
      return "bg-risk-warning/15 text-risk-warning";
    default:
      return "bg-bg-hover text-ink-dim";
  }
}

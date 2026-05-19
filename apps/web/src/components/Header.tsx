"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  LogOut,
  Menu,
  Scale,
  Sparkles,
  User,
  X,
} from "lucide-react";
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

interface NavItem {
  href: string;
  label: string;
  authOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/compare", label: "Сравнить" },
  { href: "/templates", label: "Шаблоны" },
  { href: "/documents", label: "История" },
  { href: "/calendar", label: "Календарь", authOnly: true },
  { href: "/#pricing", label: "Тарифы" },
];

export function Header() {
  const [me, setMe] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ user: null }));
  }, []);

  // Закрываем burger при resize >= sm
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setBurgerOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe({ user: null });
    setMenuOpen(false);
    window.location.href = "/";
  }

  const visibleNav = NAV.filter((n) => !n.authOnly || me?.user);

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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm sm:flex">
          {visibleNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink"
            >
              {n.label === "Календарь" && (
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
              )}
              {n.label}
            </Link>
          ))}
          {renderAuthArea(me, menuOpen, setMenuOpen, logout)}
        </nav>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="rounded-md border border-line bg-bg-elevated p-1.5 text-ink-muted sm:hidden"
          onClick={() => setBurgerOpen((o) => !o)}
          aria-label="Меню"
        >
          {burgerOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {burgerOpen && (
        <div className="border-t border-line/60 bg-bg-card sm:hidden">
          <nav className="container-narrow flex flex-col py-2">
            {visibleNav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setBurgerOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
            <div className="my-2 border-t border-line/60" />
            {me?.user ? (
              <>
                <div className="px-3 py-1 text-xs text-ink-dim">
                  {me.user.email}
                </div>
                <div className="px-3 py-1 text-xs text-ink-dim">
                  {me.user.documentsUsedThisMonth}/{me.user.documentsLimit} док · {me.user.subscriptionTier.toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
                >
                  <LogOut className="h-4 w-4" /> Выйти
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setBurgerOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
              >
                <User className="h-4 w-4" /> Войти
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function renderAuthArea(
  me: Me | null,
  menuOpen: boolean,
  setMenuOpen: (v: boolean | ((o: boolean) => boolean)) => void,
  logout: () => void,
) {
  if (me === null) {
    return <span className="ml-2 h-8 w-20 animate-pulse rounded-md bg-bg-elevated" />;
  }
  if (!me.user) {
    return (
      <Link
        href="/login"
        className="ml-2 inline-flex items-center gap-1.5 rounded-md border border-line bg-bg-elevated px-3 py-1.5 text-sm text-ink-muted transition hover:border-brand-500/40 hover:text-ink"
      >
        <User className="h-3.5 w-3.5" /> Войти
      </Link>
    );
  }
  return (
    <div className="relative ml-2">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-line bg-bg-elevated px-2.5 py-1.5 text-xs text-ink-muted transition hover:border-line-strong hover:text-ink"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-[10px] font-semibold text-brand-400">
          {me.user.email.slice(0, 2).toUpperCase()}
        </span>
        <span>{me.user.email.split("@")[0]}</span>
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
              {me.user.documentsUsedThisMonth} / {me.user.documentsLimit}{" "}
              документов в этом месяце
            </div>
          </div>
          <Link
            href="/#pricing"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
          >
            <Sparkles className="h-4 w-4" /> Сменить тариф
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 border-t border-line/60 px-3 py-2 text-sm text-ink-muted hover:bg-bg-hover hover:text-ink"
          >
            <LogOut className="h-4 w-4" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
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

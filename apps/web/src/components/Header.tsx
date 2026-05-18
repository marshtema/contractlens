import Link from "next/link";
import { Scale } from "lucide-react";

export function Header() {
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
            href="/"
            className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink"
          >
            Главная
          </Link>
          <Link
            href="/compare"
            className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink"
          >
            Сравнить версии
          </Link>
          <Link
            href="/documents"
            className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink"
          >
            История
          </Link>
          <Link
            href="/#pricing"
            className="rounded-md px-3 py-1.5 text-ink-muted transition hover:bg-bg-elevated hover:text-ink"
          >
            Тарифы
          </Link>
        </nav>
      </div>
    </header>
  );
}

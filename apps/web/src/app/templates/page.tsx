import Link from "next/link";
import { ArrowRight, Scroll } from "lucide-react";
import { TEMPLATES, type Template } from "@/lib/templates";
import { cn } from "@/lib/cn";

const CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)));

export default function TemplatesPage() {
  return (
    <div className="container-narrow py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-bg-elevated px-3 py-1 text-xs text-ink-muted">
          <Scroll className="h-3 w-3 text-brand-400" />
          Библиотека шаблонов
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
          Демо-шаблоны для тестирования AI
        </h1>
        <p className="mt-3 text-ink-muted">
          10 типовых договоров с намеренно «зашитыми» проблемами — нажмите
          на любой, чтобы посмотреть как AI разбирает риски. Это не
          юридически выверенные образцы, а учебные примеры.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-line bg-bg-card px-3 py-1 text-xs text-ink-muted"
          >
            {c}
          </span>
        ))}
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <li key={t.slug}>
            <TemplateCard t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplateCard({ t }: { t: Template }) {
  return (
    <Link
      href={`/templates/${t.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-bg-card p-5 transition",
        "hover:border-brand-500/50 hover:bg-bg-hover",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
        <t.icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs uppercase tracking-wider text-ink-dim">
        {t.category}
      </div>
      <div className="mt-0.5 font-semibold text-ink">{t.name}</div>
      <p className="mt-2 flex-1 text-sm text-ink-muted">{t.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-dim">
        <span>Демо</span>
        <span className="inline-flex items-center gap-1 text-ink-muted opacity-60 transition group-hover:opacity-100 group-hover:text-brand-400">
          Открыть <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

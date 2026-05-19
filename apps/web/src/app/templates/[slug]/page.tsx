import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTemplate, TEMPLATES } from "@/lib/templates";
import { TemplateAnalyzeButton } from "@/components/TemplateAnalyzeButton";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export default function TemplateDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const t = getTemplate(params.slug);
  if (!t) notFound();

  return (
    <div className="container-narrow py-12">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Ко всем шаблонам
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT: text */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
              <t.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-dim">
                {t.category}
              </div>
              <h1 className="font-display text-2xl font-bold text-ink">
                {t.name}
              </h1>
            </div>
          </div>
          <p className="mt-4 text-ink-muted">{t.description}</p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-bg-card">
            <div className="border-b border-line/60 px-4 py-2 text-xs text-ink-dim">
              Полный текст шаблона
            </div>
            <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap p-4 font-sans text-sm leading-relaxed text-ink">
              {t.content}
            </pre>
          </div>
        </div>

        {/* RIGHT: actions */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-brand-500/40 bg-gradient-to-b from-brand-500/[0.06] to-bg-card p-6">
            <div className="text-sm font-medium text-ink">
              Проанализировать этот пример
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Запустит AI-разбор текста выше. Вы увидите оценку рисков,
              готовые правки и переговорные письма — на демо-данных.
            </p>
            <TemplateAnalyzeButton
              filename={`${t.slug}.txt`}
              content={t.content}
            />
            <div className="mt-4 text-xs text-ink-dim">
              Анализ занимает 5–30 секунд. Шаблон засчитается в ваш
              месячный лимит, если вы авторизованы.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

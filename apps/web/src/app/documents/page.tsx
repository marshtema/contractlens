import Link from "next/link";
import {
  AlertOctagon,
  ArrowRight,
  ArrowUpRight,
  Inbox,
  Loader2,
} from "lucide-react";
import { listDocuments } from "@/lib/api";
import { scoreTone } from "@/lib/risk-tone";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

async function fetchMe(): Promise<{ user: unknown | null }> {
  const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3001";
  const { headers } = await import("next/headers");
  const cookie = headers().get("cookie") ?? "";
  try {
    const res = await fetch(`${apiOrigin}/api/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    });
    return res.ok ? await res.json() : { user: null };
  } catch {
    return { user: null };
  }
}

export default async function DocumentsListPage() {
  const [docs, { user }] = await Promise.all([
    listDocuments().catch(() => []),
    fetchMe(),
  ]);

  if (!user) {
    return (
      <div className="container-narrow py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          Войдите, чтобы увидеть историю
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Загруженные анонимно документы остаются доступны по прямой ссылке,
          но не отображаются в списке.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="container-narrow py-12">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            История документов
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Последние 50 анализов. Хранятся 30 дней, потом удаляются.
          </p>
        </div>
        <Link href="/" className="btn-primary">
          Новый анализ <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {docs.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="mt-8 overflow-hidden rounded-2xl border border-line bg-bg-card">
          {docs.map((d, i) => (
            <li
              key={d.id}
              className={
                i > 0 ? "border-t border-line/60" : undefined
              }
            >
              <Link
                href={`/documents/${d.id}`}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-bg-hover"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-ink">
                    {d.filename}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-dim">
                    <span>
                      {new Date(d.createdAt).toLocaleString("ru-RU")}
                    </span>
                    <span>·</span>
                    <span>{(d.size / 1024).toFixed(1)} КБ</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={d.status} score={d.riskScore} />
                  <ArrowUpRight className="h-4 w-4 text-ink-dim transition group-hover:text-ink" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-line bg-bg-card p-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated text-ink-muted">
        <Inbox className="h-5 w-5" />
      </div>
      <div className="mt-4 text-base font-medium text-ink">
        Пока нет документов
      </div>
      <div className="mt-1 text-sm text-ink-muted">
        Загрузите первый — займёт меньше минуты.
      </div>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Загрузить документ <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function StatusBadge({
  status,
  score,
}: {
  status: string;
  score: number | null;
}) {
  if (status === "analyzed" && score !== null) {
    const t = scoreTone(score);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
          t.text,
          t.border,
        )}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: t.color }}
        />
        Риск {score}
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-elevated px-2.5 py-0.5 text-xs text-ink-muted">
        <Loader2 className="h-3 w-3 animate-spin" />
        Обработка
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-risk-critical/30 bg-risk-critical-bg px-2.5 py-0.5 text-xs text-risk-critical">
        <AlertOctagon className="h-3 w-3" />
        Ошибка
      </span>
    );
  }
  return (
    <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-xs text-ink-dim">
      {status}
    </span>
  );
}

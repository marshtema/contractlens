import Link from "next/link";
import {
  AlertOctagon,
  ArrowUpRight,
  CalendarDays,
  CalendarOff,
} from "lucide-react";
import { cn } from "@/lib/cn";

type CalendarItem = {
  id: string;
  filename: string;
  renewalDate: string | null;
  riskScore: number | null;
  documentType: string | null;
};

export const dynamic = "force-dynamic";

async function fetchCalendar(): Promise<{
  items: CalendarItem[];
  unauthorized: boolean;
}> {
  const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3001";
  const { headers } = await import("next/headers");
  const cookie = headers().get("cookie") ?? "";
  const res = await fetch(`${apiOrigin}/api/documents/calendar`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (res.status === 401) return { items: [], unauthorized: true };
  if (!res.ok) return { items: [], unauthorized: false };
  return { items: (await res.json()) as CalendarItem[], unauthorized: false };
}

const DOC_TYPE_RU: Record<string, string> = {
  lease_agreement: "Аренда",
  employment_contract: "Трудовой",
  nda: "NDA",
  service_agreement: "Услуги",
  purchase_agreement: "Поставка",
  loan_agreement: "Кредит",
  partnership_agreement: "Партнёрство",
  investment_term_sheet: "Term sheet",
  other: "Договор",
};

export default async function CalendarPage() {
  const { items, unauthorized } = await fetchCalendar();

  if (unauthorized) {
    return (
      <div className="container-narrow py-20 text-center">
        <CalendarOff className="mx-auto h-10 w-10 text-ink-dim" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">
          Войдите, чтобы увидеть календарь
        </h1>
        <p className="mt-2 text-ink-muted">
          Календарь напоминает о дедлайнах ваших договоров — авто-продление,
          окончание срока.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Войти
        </Link>
      </div>
    );
  }

  const upcoming = items
    .filter((i) => i.renewalDate)
    .sort(
      (a, b) =>
        new Date(a.renewalDate!).getTime() -
        new Date(b.renewalDate!).getTime(),
    );
  const withoutDate = items.filter((i) => !i.renewalDate);

  return (
    <div className="container-narrow py-12">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <CalendarDays className="h-6 w-6 text-brand-400" />
            Календарь договоров
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Дедлайны вытащены AI из условий каждого договора.
          </p>
        </div>
      </div>

      {upcoming.length === 0 && withoutDate.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-12 text-center">
          <div className="text-base font-medium text-ink">
            Календарь пуст
          </div>
          <div className="mt-1 text-sm text-ink-muted">
            Когда вы загрузите договоры, AI извлечёт сроки и они появятся здесь.
          </div>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            Загрузить договор
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <ul className="mt-8 space-y-2">
              {upcoming.map((d) => (
                <CalendarRow key={d.id} item={d} />
              ))}
            </ul>
          )}

          {withoutDate.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Без определённого срока
              </h2>
              <ul className="space-y-2 opacity-70">
                {withoutDate.map((d) => (
                  <CalendarRow key={d.id} item={d} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CalendarRow({ item }: { item: CalendarItem }) {
  const date = item.renewalDate ? new Date(item.renewalDate) : null;
  const daysLeft = date
    ? Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const tone =
    daysLeft === null
      ? "text-ink-dim"
      : daysLeft < 0
        ? "text-ink-dim line-through"
        : daysLeft <= 14
          ? "text-risk-critical"
          : daysLeft <= 60
            ? "text-risk-warning"
            : "text-ink-muted";

  return (
    <li>
      <Link
        href={`/documents/${item.id}`}
        className="group flex items-center gap-4 rounded-xl border border-line bg-bg-card p-4 transition hover:border-line-strong hover:bg-bg-hover"
      >
        <div className="w-20 shrink-0 text-center">
          {date ? (
            <>
              <div className={cn("font-mono text-lg font-semibold", tone)}>
                {date.getDate().toString().padStart(2, "0")}.
                {(date.getMonth() + 1).toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-ink-dim">{date.getFullYear()}</div>
            </>
          ) : (
            <div className="text-xs text-ink-dim">—</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-ink">{item.filename}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-dim">
            {item.documentType && (
              <span className="rounded bg-bg-elevated px-1.5 py-0.5">
                {DOC_TYPE_RU[item.documentType] ?? item.documentType}
              </span>
            )}
            {item.riskScore !== null && (
              <span>Риск {item.riskScore}/100</span>
            )}
            {daysLeft !== null && (
              <span className={tone}>
                {daysLeft > 0
                  ? `через ${daysLeft} дн.`
                  : daysLeft === 0
                    ? "сегодня"
                    : `${-daysLeft} дн. назад`}
              </span>
            )}
          </div>
        </div>

        {daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && (
          <AlertOctagon className="h-4 w-4 text-risk-critical" />
        )}
        <ArrowUpRight className="h-4 w-4 text-ink-dim transition group-hover:text-ink" />
      </Link>
    </li>
  );
}

import Link from "next/link";
import { listDocuments } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DocumentsListPage() {
  const docs = await listDocuments().catch(() => []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">История документов</h1>
        <Link
          href="/"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          + Загрузить новый
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">
          Пока нет документов.{" "}
          <Link href="/" className="text-neutral-900 underline">
            Загрузить первый
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {docs.map((d) => (
            <li key={d.id}>
              <Link
                href={`/documents/${d.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <div className="font-medium text-neutral-900">{d.filename}</div>
                  <div className="text-xs text-neutral-500">
                    {new Date(d.createdAt).toLocaleString("ru-RU")} ·{" "}
                    {(d.size / 1024).toFixed(1)} КБ
                  </div>
                </div>
                <StatusBadge status={d.status} score={d.riskScore} />
              </Link>
            </li>
          ))}
        </ul>
      )}
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
    const color =
      score >= 60
        ? "bg-red-100 text-red-700"
        : score >= 30
          ? "bg-amber-100 text-amber-800"
          : "bg-green-100 text-green-700";
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        Риск {score}/100
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700">
        Обрабатывается…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
        Ошибка
      </span>
    );
  }
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
      {status}
    </span>
  );
}

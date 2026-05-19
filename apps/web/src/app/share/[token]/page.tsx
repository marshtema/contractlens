import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import type { DocumentDetail } from "@contractlens/shared";
import { ReportView } from "@/components/ReportView";

export const dynamic = "force-dynamic";

async function fetchShared(token: string): Promise<DocumentDetail | null> {
  const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiOrigin}/api/share/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as DocumentDetail;
  } catch {
    return null;
  }
}

export default async function SharedReportPage({
  params,
}: {
  params: { token: string };
}) {
  const doc = await fetchShared(params.token);
  if (!doc || !doc.analysisResult) notFound();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-elevated px-2.5 py-0.5 text-xs text-ink-muted">
            <Eye className="h-3 w-3" />
            Публичный отчёт — режим только для чтения
          </div>
          <h1 className="mt-3 font-display text-xl font-semibold text-ink">
            {doc.filename}
          </h1>
          <div className="mt-1 text-xs text-ink-dim">
            {new Date(doc.createdAt).toLocaleString("ru-RU")}
          </div>
        </div>
        <Link href="/" className="btn-ghost">
          Анализировать свой <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ReportView
        analysis={doc.analysisResult}
        riskScore={doc.riskScore ?? 0}
        extractedText={doc.extractedText}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertOctagon, Download } from "lucide-react";
import { getDocument } from "@/lib/api";
import { ReportView } from "@/components/ReportView";
import { ProcessingPoller } from "@/components/ProcessingPoller";
import { ChatPanel } from "@/components/ChatPanel";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await getDocument(params.id).catch(() => null);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-ink-dim transition hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        К истории
      </Link>

      <div className="mt-5 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {doc.filename}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-dim">
            <span>{new Date(doc.createdAt).toLocaleString("ru-RU")}</span>
            <span>·</span>
            <span>{(doc.size / 1024).toFixed(1)} КБ</span>
            <span>·</span>
            <span className="font-mono">{doc.mimeType}</span>
          </div>
        </div>
        {doc.status === "analyzed" && (
          <a
            href={`/api/documents/${doc.id}/report.pdf`}
            className="btn-ghost"
          >
            <Download className="h-4 w-4" />
            PDF
          </a>
        )}
      </div>

      {doc.status === "processing" && <ProcessingPoller id={doc.id} />}

      {doc.status === "error" && (
        <div className="rounded-2xl border border-risk-critical/30 bg-risk-critical-bg p-5">
          <div className="flex items-start gap-3">
            <AlertOctagon className="mt-0.5 h-5 w-5 text-risk-critical" />
            <div>
              <div className="font-medium text-risk-critical">
                Ошибка анализа
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                {doc.errorMessage ?? "неизвестная ошибка"}
              </div>
            </div>
          </div>
        </div>
      )}

      {doc.status === "analyzed" && doc.analysisResult && (
        <>
          <ReportView
            analysis={doc.analysisResult}
            riskScore={doc.riskScore ?? 0}
            extractedText={doc.extractedText}
          />
          <ChatPanel documentId={doc.id} />
        </>
      )}
    </div>
  );
}

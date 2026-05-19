import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertOctagon, Download } from "lucide-react";
import { getDocument } from "@/lib/api";
import { ReportView } from "@/components/ReportView";
import { ProcessingPoller } from "@/components/ProcessingPoller";
import { ChatPanel } from "@/components/ChatPanel";
import { ShareButton } from "@/components/ShareButton";
import { PdfErrorNotice } from "@/components/PdfErrorNotice";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pdf_error?: string };
}) {
  let doc;
  try {
    doc = await getDocument(params.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("404")) notFound();
    // Forbidden или 500 — покажем понятное сообщение
    return (
      <div className="container-narrow py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">
          {msg.includes("403")
            ? "Документ принадлежит другому пользователю"
            : "Не удалось загрузить документ"}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">{msg}</p>
        <Link href="/documents" className="btn-primary mt-6 inline-flex">
          Назад к истории
        </Link>
      </div>
    );
  }

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
          <div className="flex gap-2">
            <ShareButton documentId={doc.id} />
            <a
              href={`/documents/${doc.id}/report.pdf`}
              className="btn-ghost"
            >
              <Download className="h-4 w-4" />
              PDF
            </a>
          </div>
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
          {searchParams.pdf_error && (
            <PdfErrorNotice status={searchParams.pdf_error} />
          )}
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

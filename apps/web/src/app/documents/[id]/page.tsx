import { notFound } from "next/navigation";
import Link from "next/link";
import { getDocument } from "@/lib/api";
import { ReportView } from "@/components/ReportView";
import { ProcessingPoller } from "@/components/ProcessingPoller";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await getDocument(params.id).catch(() => null);
  if (!doc) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/documents"
        className="text-sm text-neutral-500 hover:text-neutral-900"
      >
        ← К истории
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
        {doc.filename}
      </h1>
      <div className="mt-1 text-sm text-neutral-500">
        {new Date(doc.createdAt).toLocaleString("ru-RU")} ·{" "}
        {(doc.size / 1024).toFixed(1)} КБ · {doc.mimeType}
      </div>

      {doc.status === "processing" && <ProcessingPoller id={doc.id} />}
      {doc.status === "error" && (
        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Ошибка анализа: {doc.errorMessage ?? "неизвестная ошибка"}
        </div>
      )}
      {doc.status === "analyzed" && doc.analysisResult && (
        <ReportView
          analysis={doc.analysisResult}
          riskScore={doc.riskScore ?? 0}
        />
      )}
    </div>
  );
}

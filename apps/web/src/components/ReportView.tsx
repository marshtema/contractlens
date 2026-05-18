import type { AnalysisResult, RiskItem, RiskLevel } from "@contractlens/shared";

const DOC_TYPE_RU: Record<string, string> = {
  lease_agreement: "Договор аренды",
  employment_contract: "Трудовой договор",
  nda: "Соглашение о неразглашении (NDA)",
  service_agreement: "Договор услуг / подряда",
  purchase_agreement: "Договор поставки",
  loan_agreement: "Кредитный договор",
  partnership_agreement: "Договор партнёрства",
  investment_term_sheet: "Term sheet (инвестиции)",
  other: "Иной документ",
};

export function ReportView({
  analysis,
  riskScore,
}: {
  analysis: AnalysisResult;
  riskScore: number;
}) {
  const grouped = groupByLevel(analysis.risks);

  return (
    <div className="mt-8 space-y-8">
      <ScoreCard score={riskScore} summary={analysis.summary} />

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-medium text-neutral-500">Документ</h2>
        <div className="mt-1 text-lg font-semibold text-neutral-900">
          {DOC_TYPE_RU[analysis.document_type] ?? analysis.document_type}
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <KV label="Стороны" value={analysis.parties.join(" · ")} />
          <KV label="Срок" value={analysis.key_terms.duration} />
          <KV label="Оплата" value={analysis.key_terms.payment_terms} />
          <KV label="Расторжение" value={analysis.key_terms.termination} />
        </dl>
      </section>

      {(["critical", "warning", "info"] as RiskLevel[]).map((level) => {
        const items = grouped[level];
        if (!items?.length) return null;
        return (
          <section key={level}>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-neutral-500">
              {levelLabel(level)} · {items.length}
            </h2>
            <ul className="space-y-3">
              {items.map((r, i) => (
                <RiskCard key={`${level}-${i}`} risk={r} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ScoreCard({ score, summary }: { score: number; summary: string }) {
  const tone =
    score >= 60
      ? { ring: "ring-red-200", bg: "bg-red-50", text: "text-red-700", label: "Высокий риск" }
      : score >= 30
        ? { ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-800", label: "Средний риск" }
        : { ring: "ring-green-200", bg: "bg-green-50", text: "text-green-700", label: "Низкий риск" };

  return (
    <section
      className={`rounded-xl border border-neutral-200 bg-white p-6 ring-1 ${tone.ring}`}
    >
      <div className="flex items-start gap-6">
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full ${tone.bg}`}
        >
          <div className={`text-2xl font-bold ${tone.text}`}>{score}</div>
        </div>
        <div>
          <div className={`text-sm font-medium ${tone.text}`}>{tone.label}</div>
          <p className="mt-1 text-neutral-700">{summary}</p>
        </div>
      </div>
    </section>
  );
}

function RiskCard({ risk }: { risk: RiskItem }) {
  const tone =
    risk.risk_level === "critical"
      ? "border-red-200 bg-red-50"
      : risk.risk_level === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-blue-200 bg-blue-50";

  return (
    <li className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-neutral-900">
          Пункт {risk.clause_number || "—"}
        </div>
        <div className="text-xs text-neutral-600">{risk.risk_category}</div>
      </div>
      {risk.clause_text && (
        <blockquote className="mt-2 border-l-2 border-neutral-300 pl-3 text-sm italic text-neutral-700">
          {risk.clause_text}
        </blockquote>
      )}
      <p className="mt-2 text-sm text-neutral-800">{risk.explanation}</p>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Что делать
          </div>
          <div className="text-neutral-800">{risk.recommendation}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Как обычно
          </div>
          <div className="text-neutral-800">{risk.standard_practice}</div>
        </div>
      </div>
    </li>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-neutral-900">{value}</dd>
    </div>
  );
}

function groupByLevel(risks: RiskItem[]) {
  return risks.reduce<Record<RiskLevel, RiskItem[]>>(
    (acc, r) => {
      acc[r.risk_level].push(r);
      return acc;
    },
    { critical: [], warning: [], info: [] },
  );
}

function levelLabel(level: RiskLevel): string {
  switch (level) {
    case "critical":
      return "Критические риски";
    case "warning":
      return "Предупреждения";
    case "info":
      return "Замечания";
  }
}

"use client";

import { motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  Banknote,
  BookOpen,
  CalendarClock,
  Copy,
  Eye,
  EyeOff,
  FileWarning,
  Gavel,
  Info,
  Link2,
  Mail,
  PencilLine,
  Quote,
  ScrollText,
  ShieldOff,
  Sparkles,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import type {
  AnalysisResult,
  PlaybookRole,
  RiskCategory,
  RiskItem,
  RiskLevel,
} from "@contractlens/shared";
import { ScoreGauge } from "./ScoreGauge";
import { scoreTone } from "@/lib/risk-tone";
import { DocumentViewer } from "./DocumentViewer";
import { VerdictBanner } from "./VerdictBanner";
import { cn } from "@/lib/cn";

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

const ROLE_RU: Record<PlaybookRole, string> = {
  service_provider: "исполнителя",
  service_customer: "заказчика",
  tenant: "арендатора",
  landlord: "арендодателя",
  employee: "работника",
  employer: "работодателя",
  borrower: "заёмщика",
  lender: "кредитора",
  founder: "фаундера",
  investor: "инвестора",
  buyer: "покупателя",
  seller: "продавца",
  disclosing_party: "раскрывающей стороны",
  receiving_party: "получающей стороны",
  neutral: "вашей стороны",
};

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; icon: LucideIcon }
> = {
  payment: { label: "Оплата", icon: Banknote },
  termination: { label: "Расторжение", icon: CalendarClock },
  liability: { label: "Ответственность", icon: ShieldOff },
  intellectual_property: { label: "Интеллектуальная собств.", icon: BookOpen },
  confidentiality: { label: "Конфиденциальность", icon: FileWarning },
  competition: { label: "Конкуренция", icon: Swords },
  force_majeure: { label: "Форс-мажор", icon: AlertOctagon },
  dispute_resolution: { label: "Споры", icon: Gavel },
  other: { label: "Прочее", icon: Info },
};

const LEVEL_META: Record<
  RiskLevel,
  {
    label: string;
    short: string;
    icon: LucideIcon;
    border: string;
    accent: string;
    text: string;
    pill: string;
  }
> = {
  critical: {
    label: "Критические риски",
    short: "Критично",
    icon: AlertOctagon,
    border: "border-risk-critical/30",
    accent: "bg-risk-critical",
    text: "text-risk-critical",
    pill: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  },
  warning: {
    label: "Предупреждения",
    short: "Внимание",
    icon: AlertTriangle,
    border: "border-risk-warning/30",
    accent: "bg-risk-warning",
    text: "text-risk-warning",
    pill: "bg-risk-warning/15 text-risk-warning border-risk-warning/30",
  },
  info: {
    label: "Замечания",
    short: "К сведению",
    icon: Info,
    border: "border-risk-info/30",
    accent: "bg-risk-info",
    text: "text-risk-info",
    pill: "bg-risk-info/15 text-risk-info border-risk-info/30",
  },
};

export function ReportView({
  analysis,
  riskScore,
  extractedText,
}: {
  analysis: AnalysisResult;
  riskScore: number;
  extractedText: string | null;
}) {
  const [activeRiskIndex, setActiveRiskIndex] = useState<number | null>(null);
  const [showViewer, setShowViewer] = useState(true);
  const tone = scoreTone(riskScore);
  const grouped = groupByLevel(analysis.risks);
  const counts = {
    critical: grouped.critical.length,
    warning: grouped.warning.length,
    info: grouped.info.length,
  };

  function focusRisk(index: number) {
    setActiveRiskIndex(index);
    const el = document.getElementById(`risk-card-${index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusInViewer(index: number) {
    setActiveRiskIndex(index);
    const el = document.getElementById(`mark-${index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-8">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-bg-card p-8",
          tone.border,
        )}
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${tone.color}60, transparent)`,
          }}
        />
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <ScoreGauge score={riskScore} />
          <div className="flex-1">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                tone.text,
                tone.border,
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: tone.color }}
              />
              {tone.label}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
              {DOC_TYPE_RU[analysis.document_type] ?? analysis.document_type}
            </h1>
            <p className="mt-2 text-xs text-ink-dim">
              Анализ с точки зрения {ROLE_RU[analysis.protected_role]}
            </p>
            <p className="mt-3 max-w-2xl text-ink-muted">{analysis.summary}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <CountPill level="critical" count={counts.critical} />
              <CountPill level="warning" count={counts.warning} />
              <CountPill level="info" count={counts.info} />
            </div>
          </div>
        </div>
      </motion.section>

      {/* VERDICT */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <VerdictBanner analysis={analysis} />
      </motion.div>

      {/* KEY FACTS */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl border border-line bg-bg-card p-6"
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
          <ScrollText className="h-3.5 w-3.5" />
          Ключевые факты
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <KV
            icon={Users}
            label="Стороны"
            value={analysis.parties.join("  ·  ")}
          />
          <KV
            icon={CalendarClock}
            label="Срок"
            value={analysis.key_terms.duration}
          />
          <KV
            icon={Banknote}
            label="Оплата"
            value={analysis.key_terms.payment_terms}
          />
          <KV
            icon={CalendarClock}
            label="Расторжение"
            value={analysis.key_terms.termination}
          />
        </dl>
      </motion.section>

      {/* SPLIT: VIEWER + RISKS */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
            Разбор по пунктам
          </h2>
          {extractedText && (
            <button
              type="button"
              onClick={() => setShowViewer((v) => !v)}
              className="btn-ghost py-1.5 text-xs"
            >
              {showViewer ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Скрыть текст
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Показать текст
                </>
              )}
            </button>
          )}
        </div>

        <div
          className={cn(
            "grid gap-4",
            showViewer && extractedText
              ? "lg:grid-cols-[1.1fr_1fr]"
              : "grid-cols-1",
          )}
        >
          {showViewer && extractedText && (
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
              <DocumentViewer
                text={extractedText}
                risks={analysis.risks}
                activeRiskIndex={activeRiskIndex}
                onRiskClick={focusRisk}
              />
            </div>
          )}

          <div className="space-y-6">
            {(["critical", "warning", "info"] as RiskLevel[]).map((level) => {
              const items = grouped[level];
              if (!items.length) return null;
              const meta = LEVEL_META[level];
              return (
                <div key={level}>
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <meta.icon className={cn("h-4 w-4", meta.text)} />
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                      {meta.label}
                    </h3>
                    <span className="text-sm font-semibold text-ink-dim">
                      · {items.length}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {items.map((r) => {
                      const globalIndex = analysis.risks.indexOf(r);
                      return (
                        <RiskCard
                          key={globalIndex}
                          risk={r}
                          level={level}
                          index={globalIndex}
                          active={activeRiskIndex === globalIndex}
                          onCite={() => focusInViewer(globalIndex)}
                        />
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function CountPill({ level, count }: { level: RiskLevel; count: number }) {
  if (count === 0) return null;
  const m = LEVEL_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
        m.pill,
      )}
    >
      <m.icon className="h-3.5 w-3.5" />
      {count} {m.short}
    </span>
  );
}

function KV({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-elevated text-ink-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wider text-ink-dim">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-ink">{value}</dd>
      </div>
    </div>
  );
}

type Tab = "why" | "fix" | "email";

function RiskCard({
  risk,
  level,
  index,
  active,
  onCite,
}: {
  risk: RiskItem;
  level: RiskLevel;
  index: number;
  active: boolean;
  onCite: () => void;
}) {
  const m = LEVEL_META[level];
  const cat = CATEGORY_META[risk.risk_category] ?? CATEGORY_META.other;
  const CatIcon = cat.icon;
  const [tab, setTab] = useState<Tab>("why");

  const hasFix = !!risk.suggested_fix && risk.suggested_fix.length > 0;
  const hasEmail = !!risk.negotiation_email && risk.negotiation_email.length > 0;

  return (
    <li
      id={`risk-card-${index}`}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-bg-card transition",
        m.border,
        active && "ring-2 ring-brand-500/50",
      )}
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-1", m.accent)}
        aria-hidden
      />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium",
                  m.pill,
                )}
              >
                <m.icon className="h-3 w-3" /> {m.short}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-line bg-bg-elevated px-2 py-0.5 text-ink-muted">
                <CatIcon className="h-3 w-3" /> {cat.label}
              </span>
              {risk.monetary_impact && (
                <span className="inline-flex items-center gap-1 rounded-md border border-line bg-bg-elevated px-2 py-0.5 text-ink-muted">
                  <Banknote className="h-3 w-3" /> {risk.monetary_impact}
                </span>
              )}
            </div>
            <div className="mt-2 font-semibold text-ink">
              Пункт {risk.clause_number || "—"}
            </div>
          </div>
        </div>

        {risk.clause_text && (
          <button
            type="button"
            onClick={onCite}
            className="mt-3 flex w-full gap-2 rounded-lg border border-line bg-bg-elevated/60 p-3 text-left transition hover:border-line-strong hover:bg-bg-elevated"
            title="Показать в тексте документа"
          >
            <Quote className="h-4 w-4 shrink-0 text-ink-dim" />
            <blockquote className="text-sm italic text-ink-muted">
              «{risk.clause_text}»
            </blockquote>
          </button>
        )}

        {/* TABS */}
        <div className="mt-4 flex gap-1 border-b border-line/60">
          <TabBtn active={tab === "why"} onClick={() => setTab("why")}>
            <Info className="h-3.5 w-3.5" />
            Почему плохо
          </TabBtn>
          {hasFix && (
            <TabBtn active={tab === "fix"} onClick={() => setTab("fix")}>
              <PencilLine className="h-3.5 w-3.5" />
              Готовая правка
            </TabBtn>
          )}
          {hasEmail && (
            <TabBtn active={tab === "email"} onClick={() => setTab("email")}>
              <Mail className="h-3.5 w-3.5" />
              Письмо контрагенту
            </TabBtn>
          )}
        </div>

        <div className="mt-4">
          {tab === "why" && (
            <div className="space-y-3">
              <p className="text-sm text-ink">{risk.explanation}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Subblock label="Что делать" tone="text-brand-400">
                  {risk.recommendation}
                </Subblock>
                <Subblock label="Как обычно" tone="text-ink-dim">
                  {risk.standard_practice}
                </Subblock>
              </div>
            </div>
          )}

          {tab === "fix" && risk.suggested_fix && (
            <CopyBlock
              label="Готовый текст пункта"
              text={risk.suggested_fix}
              hint="Скопируйте и отправьте контрагенту вместо текущей формулировки"
            />
          )}

          {tab === "email" && risk.negotiation_email && (
            <CopyBlock
              label="Шаблон письма"
              text={risk.negotiation_email}
              hint="Деловой тон. Адаптируйте имена и реквизиты под себя."
            />
          )}
        </div>
      </div>
    </li>
  );
}

function TabBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition",
        active
          ? "border-brand-400 text-ink"
          : "border-transparent text-ink-dim hover:text-ink-muted",
      )}
    >
      {children}
    </button>
  );
}

function Subblock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          tone,
        )}
      >
        {label}
      </div>
      <div className="mt-1 text-sm text-ink-muted">{children}</div>
    </div>
  );
}

function CopyBlock({
  label,
  text,
  hint,
}: {
  label: string;
  text: string;
  hint: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-ink-dim">
          {label}
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-bg-elevated px-2.5 py-1 text-xs text-ink-muted transition hover:border-brand-500/40 hover:text-ink"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-line bg-bg-elevated p-3 text-sm text-ink">
        {text}
      </pre>
      <div className="text-xs text-ink-dim">{hint}</div>
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

// Re-export for backwards compat
export { Link2, Sparkles };

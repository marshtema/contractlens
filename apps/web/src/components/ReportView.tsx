"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Banknote,
  BookOpen,
  CalendarClock,
  Copy,
  FileWarning,
  Gavel,
  Info,
  Link2,
  Quote,
  ScrollText,
  ShieldOff,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { useState } from "react";
import type {
  AnalysisResult,
  RiskCategory,
  RiskItem,
  RiskLevel,
} from "@contractlens/shared";
import { ScoreGauge, scoreTone } from "./ScoreGauge";
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

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; icon: typeof Banknote }
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
    icon: typeof AlertOctagon;
    border: string;
    accent: string;
    bg: string;
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
    bg: "bg-risk-critical-bg",
    text: "text-risk-critical",
    pill: "bg-risk-critical/15 text-risk-critical border-risk-critical/30",
  },
  warning: {
    label: "Предупреждения",
    short: "Внимание",
    icon: AlertTriangle,
    border: "border-risk-warning/30",
    accent: "bg-risk-warning",
    bg: "bg-risk-warning-bg",
    text: "text-risk-warning",
    pill: "bg-risk-warning/15 text-risk-warning border-risk-warning/30",
  },
  info: {
    label: "Замечания",
    short: "К сведению",
    icon: Info,
    border: "border-risk-info/30",
    accent: "bg-risk-info",
    bg: "bg-risk-info-bg",
    text: "text-risk-info",
    pill: "bg-risk-info/15 text-risk-info border-risk-info/30",
  },
};

export function ReportView({
  analysis,
  riskScore,
}: {
  analysis: AnalysisResult;
  riskScore: number;
}) {
  const grouped = groupByLevel(analysis.risks);
  const tone = scoreTone(riskScore);
  const counts = {
    critical: grouped.critical.length,
    warning: grouped.warning.length,
    info: grouped.info.length,
  };

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
            <p className="mt-3 max-w-2xl text-ink-muted">{analysis.summary}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <CountPill level="critical" count={counts.critical} />
              <CountPill level="warning" count={counts.warning} />
              <CountPill level="info" count={counts.info} />
            </div>
          </div>
        </div>
      </motion.section>

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

      {/* RISKS */}
      {(["critical", "warning", "info"] as RiskLevel[]).map((level, idx) => {
        const items = grouped[level];
        if (!items.length) return null;
        const meta = LEVEL_META[level];
        return (
          <motion.section
            key={level}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + idx * 0.05 }}
          >
            <div className="mb-3 flex items-center gap-2 px-1">
              <meta.icon className={cn("h-4 w-4", meta.text)} />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                {meta.label}
              </h2>
              <span className="text-sm font-semibold text-ink-dim">
                · {items.length}
              </span>
            </div>
            <ul className="space-y-3">
              {items.map((r, i) => (
                <RiskCard key={`${level}-${i}`} risk={r} level={level} />
              ))}
            </ul>
          </motion.section>
        );
      })}

      {/* ACTIONS */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex flex-wrap gap-3 rounded-2xl border border-line bg-bg-card p-6"
      >
        <CopyLinkButton />
        <button
          type="button"
          className="btn-ghost"
          disabled
          title="Скоро: экспорт в PDF"
        >
          <ScrollText className="h-4 w-4" />
          Скачать PDF
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled
          title="Скоро: чат с документом"
        >
          <Sparkles className="h-4 w-4" />
          Спросить у AI
        </button>
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
  icon: typeof Users;
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

function RiskCard({ risk, level }: { risk: RiskItem; level: RiskLevel }) {
  const m = LEVEL_META[level];
  const cat = CATEGORY_META[risk.risk_category] ?? CATEGORY_META.other;
  const CatIcon = cat.icon;

  return (
    <li
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-bg-card transition hover:bg-bg-hover",
        m.border,
      )}
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-1", m.accent)}
        aria-hidden
      />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs">
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
            </div>
            <div className="mt-2 font-semibold text-ink">
              Пункт {risk.clause_number || "—"}
            </div>
          </div>
        </div>

        {risk.clause_text && (
          <div className="mt-3 flex gap-2 rounded-lg border border-line bg-bg-elevated/60 p-3">
            <Quote className="h-4 w-4 shrink-0 text-ink-dim" />
            <blockquote className="text-sm italic text-ink-muted">
              «{risk.clause_text}»
            </blockquote>
          </div>
        )}

        <p className="mt-3 text-sm text-ink">{risk.explanation}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Bullet
            icon={AlertCircle}
            label="Что делать"
            text={risk.recommendation}
            tone="text-brand-400"
          />
          <Bullet
            icon={Info}
            label="Как обычно"
            text={risk.standard_practice}
            tone="text-ink-dim"
          />
        </div>
      </div>
    </li>
  );
}

function Bullet({
  icon: Icon,
  label,
  text,
  tone,
}: {
  icon: typeof AlertCircle;
  label: string;
  text: string;
  tone: string;
}) {
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider",
          tone,
        )}
      >
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm text-ink-muted">{text}</div>
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="btn-primary"
    >
      {copied ? (
        <>
          <Copy className="h-4 w-4" /> Скопировано
        </>
      ) : (
        <>
          <Link2 className="h-4 w-4" /> Поделиться отчётом
        </>
      )}
    </button>
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

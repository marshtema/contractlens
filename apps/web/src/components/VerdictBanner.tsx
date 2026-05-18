import {
  AlertOctagon,
  CheckCircle2,
  HandHelping,
  type LucideIcon,
} from "lucide-react";
import type { AnalysisResult } from "@contractlens/shared";
import { cn } from "@/lib/cn";

const META: Record<
  AnalysisResult["verdict"],
  {
    title: string;
    icon: LucideIcon;
    text: string;
    border: string;
    bg: string;
    dot: string;
  }
> = {
  sign_as_is: {
    title: "Можно подписывать",
    icon: CheckCircle2,
    text: "text-risk-good",
    border: "border-risk-good/40",
    bg: "bg-risk-good-bg",
    dot: "#10b981",
  },
  negotiate: {
    title: "Стоит договориться",
    icon: HandHelping,
    text: "text-risk-warning",
    border: "border-risk-warning/40",
    bg: "bg-risk-warning-bg",
    dot: "#f59e0b",
  },
  do_not_sign: {
    title: "Не подписывать как есть",
    icon: AlertOctagon,
    text: "text-risk-critical",
    border: "border-risk-critical/40",
    bg: "bg-risk-critical-bg",
    dot: "#ef4444",
  },
};

export function VerdictBanner({ analysis }: { analysis: AnalysisResult }) {
  const m = META[analysis.verdict];
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-5",
        m.border,
        m.bg,
      )}
    >
      <div className={cn("mt-0.5 shrink-0", m.text)}>
        <m.icon className="h-6 w-6" />
      </div>
      <div>
        <div className={cn("text-xs font-semibold uppercase tracking-wider", m.text)}>
          Вердикт
        </div>
        <div className="mt-0.5 text-lg font-semibold text-ink">{m.title}</div>
        <div className="mt-1 text-sm text-ink-muted">
          {analysis.verdict_explanation}
        </div>
      </div>
    </div>
  );
}

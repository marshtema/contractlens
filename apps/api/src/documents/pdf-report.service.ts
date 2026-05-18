import { Injectable } from "@nestjs/common";
import * as React from "react";
import type { AnalysisResult, RiskItem } from "@contractlens/shared";

const COLORS = {
  ink: "#0f172a",
  muted: "#475569",
  dim: "#94a3b8",
  line: "#e2e8f0",
  bg: "#f8fafc",
  brand: "#0284c7",
  critical: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
  good: "#16a34a",
};

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

const VERDICT_RU: Record<AnalysisResult["verdict"], string> = {
  sign_as_is: "Можно подписывать",
  negotiate: "Стоит договориться",
  do_not_sign: "Не подписывать как есть",
};

interface ReportProps {
  filename: string;
  analysis: AnalysisResult;
  riskScore: number;
  generatedAt: string;
}

function levelColor(level: RiskItem["risk_level"]) {
  return level === "critical"
    ? COLORS.critical
    : level === "warning"
      ? COLORS.warning
      : COLORS.info;
}

function scoreColor(score: number) {
  return score >= 60 ? COLORS.critical : score >= 30 ? COLORS.warning : COLORS.good;
}

// Эти типы переопределяем локально, чтобы не тянуть ESM-only типы напрямую.
type PdfModule = typeof import("@react-pdf/renderer");

let cached: PdfModule | null = null;

async function getPdf(): Promise<PdfModule> {
  if (cached) return cached;
  // dynamic import работает с ESM-only пакетами из CJS
  cached = (await import("@react-pdf/renderer")) as unknown as PdfModule;
  return cached;
}

function buildStyles(pdf: PdfModule) {
  const { StyleSheet } = pdf;
  return StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      color: COLORS.ink,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: 12,
      marginBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
    },
    brand: { fontSize: 12, fontWeight: 700, color: COLORS.brand },
    date: { fontSize: 9, color: COLORS.dim },
    h1: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
    meta: { fontSize: 9, color: COLORS.muted, marginBottom: 16 },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 14,
    },
    scoreNum: { fontSize: 28, fontWeight: 700, marginRight: 16 },
    summary: { fontSize: 10, lineHeight: 1.4, color: COLORS.muted, flex: 1 },
    section: { marginTop: 14, marginBottom: 8 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: "uppercase",
      color: COLORS.muted,
      marginBottom: 6,
    },
    kvRow: { flexDirection: "row", marginBottom: 4 },
    kvLabel: {
      width: 90,
      color: COLORS.dim,
      fontSize: 9,
      textTransform: "uppercase",
    },
    kvValue: { flex: 1, fontSize: 10 },
    verdict: {
      padding: 10,
      borderRadius: 6,
      marginBottom: 12,
      borderWidth: 1,
    },
    verdictTitle: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
    verdictText: { fontSize: 10, color: COLORS.muted, lineHeight: 1.4 },
    riskCard: {
      padding: 10,
      borderWidth: 1,
      borderRadius: 6,
      marginBottom: 8,
    },
    riskHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    riskTitle: { fontSize: 11, fontWeight: 700 },
    riskLevel: {
      fontSize: 8,
      fontWeight: 700,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      color: "white",
    },
    quote: {
      fontSize: 9,
      fontStyle: "italic",
      color: COLORS.muted,
      paddingLeft: 8,
      borderLeftWidth: 2,
      borderLeftColor: COLORS.line,
      marginVertical: 6,
    },
    riskBody: { fontSize: 10, lineHeight: 1.45, marginBottom: 4 },
    riskField: { flexDirection: "row", marginTop: 4 },
    riskFieldLabel: {
      width: 90,
      fontSize: 8,
      fontWeight: 700,
      textTransform: "uppercase",
      color: COLORS.dim,
    },
    riskFieldValue: {
      flex: 1,
      fontSize: 10,
      color: COLORS.ink,
      lineHeight: 1.45,
    },
    fixBlock: {
      marginTop: 6,
      padding: 8,
      backgroundColor: COLORS.bg,
      borderRadius: 4,
      fontSize: 9,
      color: COLORS.ink,
      lineHeight: 1.4,
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 40,
      right: 40,
      fontSize: 8,
      color: COLORS.dim,
      textAlign: "center",
    },
  });
}

async function buildDocument(props: ReportProps) {
  const pdf = await getPdf();
  const { Document, Page, Text, View } = pdf;
  const styles = buildStyles(pdf);
  const { filename, analysis, riskScore, generatedAt } = props;

  const verdictColor =
    analysis.verdict === "do_not_sign"
      ? COLORS.critical
      : analysis.verdict === "negotiate"
        ? COLORS.warning
        : COLORS.good;

  return React.createElement(
    Document as React.ComponentType<Record<string, unknown>>,
    {},
    React.createElement(
      Page as React.ComponentType<Record<string, unknown>>,
      { size: "A4", style: styles.page },
      React.createElement(
        View as React.ComponentType<Record<string, unknown>>,
        { style: styles.header },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: styles.brand },
          "ContractLens AI",
        ),
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: styles.date },
          generatedAt,
        ),
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { style: styles.h1 },
        filename,
      ),
      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        { style: styles.meta },
        DOC_TYPE_RU[analysis.document_type] ?? analysis.document_type,
      ),

      React.createElement(
        View as React.ComponentType<Record<string, unknown>>,
        {
          style: [styles.scoreRow, { borderColor: scoreColor(riskScore) }],
        },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: [styles.scoreNum, { color: scoreColor(riskScore) }] },
          `${riskScore}/100`,
        ),
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: styles.summary },
          analysis.summary,
        ),
      ),

      React.createElement(
        View as React.ComponentType<Record<string, unknown>>,
        { style: [styles.verdict, { borderColor: verdictColor }] },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: [styles.verdictTitle, { color: verdictColor }] },
          VERDICT_RU[analysis.verdict],
        ),
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: styles.verdictText },
          analysis.verdict_explanation,
        ),
      ),

      React.createElement(
        View as React.ComponentType<Record<string, unknown>>,
        { style: styles.section },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: styles.sectionTitle },
          "Ключевые факты",
        ),
        ...[
          ["Стороны", analysis.parties.join(" · ")],
          ["Срок", analysis.key_terms.duration],
          ["Оплата", analysis.key_terms.payment_terms],
          ["Расторжение", analysis.key_terms.termination],
        ].map(([label, value]) =>
          React.createElement(
            View as React.ComponentType<Record<string, unknown>>,
            { key: label, style: styles.kvRow },
            React.createElement(
              Text as React.ComponentType<Record<string, unknown>>,
              { style: styles.kvLabel },
              label,
            ),
            React.createElement(
              Text as React.ComponentType<Record<string, unknown>>,
              { style: styles.kvValue },
              value,
            ),
          ),
        ),
      ),

      React.createElement(
        View as React.ComponentType<Record<string, unknown>>,
        { style: styles.section },
        React.createElement(
          Text as React.ComponentType<Record<string, unknown>>,
          { style: styles.sectionTitle },
          `Риски (${analysis.risks.length})`,
        ),
        ...analysis.risks.map((r, i) =>
          React.createElement(
            View as React.ComponentType<Record<string, unknown>>,
            {
              key: i,
              wrap: false,
              style: [styles.riskCard, { borderColor: levelColor(r.risk_level) }],
            },
            React.createElement(
              View as React.ComponentType<Record<string, unknown>>,
              { style: styles.riskHeader },
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { style: styles.riskTitle },
                `Пункт ${r.clause_number}`,
              ),
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                {
                  style: [
                    styles.riskLevel,
                    { backgroundColor: levelColor(r.risk_level) },
                  ],
                },
                r.risk_level.toUpperCase(),
              ),
            ),
            r.clause_text
              ? React.createElement(
                  Text as React.ComponentType<Record<string, unknown>>,
                  { style: styles.quote },
                  `«${r.clause_text}»`,
                )
              : null,
            React.createElement(
              Text as React.ComponentType<Record<string, unknown>>,
              { style: styles.riskBody },
              r.explanation,
            ),
            React.createElement(
              View as React.ComponentType<Record<string, unknown>>,
              { style: styles.riskField },
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { style: styles.riskFieldLabel },
                "Что делать",
              ),
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { style: styles.riskFieldValue },
                r.recommendation,
              ),
            ),
            React.createElement(
              View as React.ComponentType<Record<string, unknown>>,
              { style: styles.riskField },
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { style: styles.riskFieldLabel },
                "Как обычно",
              ),
              React.createElement(
                Text as React.ComponentType<Record<string, unknown>>,
                { style: styles.riskFieldValue },
                r.standard_practice,
              ),
            ),
            r.monetary_impact
              ? React.createElement(
                  View as React.ComponentType<Record<string, unknown>>,
                  { style: styles.riskField },
                  React.createElement(
                    Text as React.ComponentType<Record<string, unknown>>,
                    { style: styles.riskFieldLabel },
                    "Риск, ₽",
                  ),
                  React.createElement(
                    Text as React.ComponentType<Record<string, unknown>>,
                    { style: styles.riskFieldValue },
                    r.monetary_impact,
                  ),
                )
              : null,
            r.suggested_fix
              ? React.createElement(
                  View as React.ComponentType<Record<string, unknown>>,
                  {},
                  React.createElement(
                    Text as React.ComponentType<Record<string, unknown>>,
                    {
                      style: [
                        styles.riskFieldLabel,
                        { marginTop: 6, marginBottom: 2 },
                      ],
                    },
                    "Готовая правка",
                  ),
                  React.createElement(
                    Text as React.ComponentType<Record<string, unknown>>,
                    { style: styles.fixBlock },
                    r.suggested_fix,
                  ),
                )
              : null,
          ),
        ),
      ),

      React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        {
          style: styles.footer,
          fixed: true,
          render: ({
            pageNumber,
            totalPages,
          }: {
            pageNumber: number;
            totalPages: number;
          }) =>
            `ContractLens AI · Не является юридической консультацией · ${pageNumber} / ${totalPages}`,
        },
      ),
    ),
  );
}

@Injectable()
export class PdfReportService {
  async render(props: ReportProps): Promise<Buffer> {
    const pdf = await getPdf();
    const element = await buildDocument(props);
    return pdf.renderToBuffer(element as never);
  }
}

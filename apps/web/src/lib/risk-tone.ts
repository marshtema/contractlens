export function scoreTone(score: number) {
  if (score >= 60) {
    return {
      color: "#ef4444",
      label: "Высокий риск",
      bg: "bg-risk-critical-bg",
      text: "text-risk-critical",
      border: "border-risk-critical/40",
    };
  }
  if (score >= 30) {
    return {
      color: "#f59e0b",
      label: "Средний риск",
      bg: "bg-risk-warning-bg",
      text: "text-risk-warning",
      border: "border-risk-warning/40",
    };
  }
  return {
    color: "#10b981",
    label: "Низкий риск",
    bg: "bg-risk-good-bg",
    text: "text-risk-good",
    border: "border-risk-good/40",
  };
}

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line/60 bg-bg-elevated/40">
      <div className="container-narrow flex flex-col gap-2 py-6 text-xs text-ink-dim sm:flex-row sm:items-center sm:justify-between">
        <div>
          © 2026 ContractLens AI · Это не юридическая консультация, а
          инструмент анализа документа.
        </div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-ink-muted">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink-muted">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

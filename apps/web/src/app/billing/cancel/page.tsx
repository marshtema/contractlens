import Link from "next/link";
import { XCircle } from "lucide-react";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-elevated text-ink-dim">
        <XCircle className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-ink">
        Оплата отменена
      </h1>
      <p className="mt-2 text-ink-muted">
        Подписка не оформлена. Можете попробовать ещё раз когда захотите.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        На главную
      </Link>
    </div>
  );
}

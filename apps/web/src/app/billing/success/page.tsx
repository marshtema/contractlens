import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BillingSuccessPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-risk-good-bg text-risk-good">
        <CheckCircle2 className="h-7 w-7" />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-ink">
        Подписка активирована
      </h1>
      <p className="mt-2 text-ink-muted">
        Спасибо. Лимиты вашего нового тарифа уже применены — можно загружать
        больше документов.
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Загрузить документ
      </Link>
    </div>
  );
}

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Политика конфиденциальности — ContractLens AI",
};

export default function PrivacyPage() {
  return (
    <article className="container-narrow prose prose-invert py-12">
      <div className="not-prose mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Политика конфиденциальности
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>
        </div>
      </div>

      <Section title="1. Какие данные мы храним">
        <p>
          Когда вы загружаете договор, мы храним: имя файла, размер, тип,
          извлечённый текст и результат AI-анализа. Если вы вошли в аккаунт —
          email и привязку документов к вашему ID.
        </p>
        <p>
          Сами файлы хранятся зашифрованными до <strong>30 дней</strong>,
          после чего автоматически удаляются. Текст и анализ хранятся
          столько же.
        </p>
      </Section>

      <Section title="2. Кому передаются данные">
        <p>
          Текст документа отправляется AI-провайдеру (Groq, Anthropic или
          Google) — только для анализа. Эти провайдеры не используют
          переданные данные для обучения моделей (zero-retention режим).
        </p>
        <p>
          Платёжная информация обрабатывается Stripe; мы не храним номера
          карт.
        </p>
      </Section>

      <Section title="3. Безопасность">
        <ul>
          <li>HTTPS (TLS 1.3) для всех соединений</li>
          <li>Шифрование at-rest для файлов и токенов сессий</li>
          <li>Сессии в httpOnly cookie, защита от XSS</li>
          <li>Регулярные обновления зависимостей и аудит безопасности</li>
        </ul>
      </Section>

      <Section title="4. Ваши права">
        <p>В соответствии с GDPR и 152-ФЗ вы имеете право:</p>
        <ul>
          <li>Запросить копию всех своих данных</li>
          <li>Удалить аккаунт и все связанные документы немедленно</li>
          <li>
            Запретить использование своих данных для улучшения сервиса (по
            умолчанию мы их и не используем)
          </li>
        </ul>
        <p>
          Для реализации этих прав напишите на{" "}
          <a href="mailto:privacy@contractlens.ai" className="text-brand-400">
            privacy@contractlens.ai
          </a>
          .
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          Используем только функциональные cookies (сессия авторизации).
          Аналитические/маркетинговые cookies не установлены.
        </p>
      </Section>

      <Section title="6. Изменения">
        <p>
          Об изменениях этой политики мы уведомим за 30 дней по email и
          уведомлением в интерфейсе.
        </p>
      </Section>

      <div className="not-prose mt-12 text-sm text-ink-muted">
        <Link href="/" className="text-brand-400 hover:underline">
          ← На главную
        </Link>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="not-prose mb-8">
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-muted [&_a]:text-brand-400 [&_a]:underline [&_li]:list-disc [&_li]:ml-5 [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}

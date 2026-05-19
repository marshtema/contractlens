import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Условия использования — ContractLens AI",
};

export default function TermsPage() {
  return (
    <article className="container-narrow py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Условия использования
          </h1>
          <p className="mt-1 text-sm text-ink-dim">
            Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
          </p>
        </div>
      </div>

      <Section title="1. Что такое ContractLens AI">
        <p>
          ContractLens AI — инструмент автоматического анализа юридических
          документов. Мы показываем потенциальные риски и предлагаем
          формулировки, но не заменяем юриста.
        </p>
      </Section>

      <Section title="2. Это НЕ юридическая консультация" critical>
        <p>
          Результаты анализа носят справочный характер. Для важных сделок,
          судебных споров и сложных вопросов обращайтесь к
          квалифицированному юристу. Мы не несём ответственности за решения,
          принятые на основе нашего анализа.
        </p>
      </Section>

      <Section title="3. Ваши обязательства">
        <ul>
          <li>
            Загружать только те документы, на которые у вас есть законное
            право
          </li>
          <li>Не использовать сервис для незаконной деятельности</li>
          <li>
            Не пытаться нарушить безопасность сервиса или обойти лимиты
            тарифа
          </li>
        </ul>
      </Section>

      <Section title="4. Лимиты и тарифы">
        <p>
          Бесплатный план — 3 документа в месяц. Платные планы — 20 и более.
          Лимиты сбрасываются раз в 30 дней. Превышение блокирует загрузку
          до апгрейда или сброса.
        </p>
      </Section>

      <Section title="5. Ограничение ответственности">
        <p>
          Совокупная ответственность ContractLens AI перед пользователем
          ограничена суммой, фактически уплаченной за последние 12 месяцев,
          но не более 10 000 ₽. Косвенные убытки и упущенная выгода
          исключаются.
        </p>
      </Section>

      <Section title="6. Расторжение">
        <p>
          Вы можете удалить аккаунт в любой момент — все ваши документы
          удаляются немедленно. Мы вправе заблокировать аккаунт за
          нарушение этих условий, уведомив вас по email.
        </p>
      </Section>

      <Section title="7. Применимое право">
        <p>
          Эти условия регулируются законодательством Российской Федерации.
          Споры — в досудебном порядке; при недостижении соглашения — в
          суде по месту нахождения сервиса.
        </p>
      </Section>

      <div className="mt-12 text-sm text-ink-muted">
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
  critical,
}: {
  title: string;
  children: React.ReactNode;
  critical?: boolean;
}) {
  return (
    <section
      className={
        critical
          ? "mb-8 rounded-2xl border border-risk-warning/40 bg-risk-warning-bg p-5"
          : "mb-8"
      }
    >
      <h2 className="mb-3 font-display text-lg font-semibold text-ink">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-muted [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}

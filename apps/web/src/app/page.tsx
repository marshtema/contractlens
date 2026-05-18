import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Check,
  FileText,
  Gauge,
  Languages,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { UploadForm } from "@/components/UploadForm";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line/60">
      <div className="absolute inset-0 bg-brand-glow" aria-hidden />
      <div className="absolute inset-0 grid-bg" aria-hidden />

      <div className="container-narrow relative pt-20 pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-bg-elevated/80 px-3 py-1 text-xs text-ink-muted backdrop-blur">
            <Sparkles className="h-3 w-3 text-brand-400" />
            <span>Работает на Llama 3.3 70B · обновлено сегодня</span>
          </div>

          <h1 className="mt-6 text-balance font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl">
            Пойми любой договор{" "}
            <span className="relative">
              <span className="relative bg-gradient-to-r from-brand-400 to-sky-300 bg-clip-text text-transparent">
                за 30 секунд
              </span>
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-muted">
            Загрузите договор — AI прочитает его как старший юрист,
            подсветит рискованные пункты и объяснит простым языком, что с
            ними делать. Без юридического образования. Без юриста.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <UploadForm />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-dim">
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-risk-good" /> Без регистрации
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-risk-good" /> 3 анализа бесплатно
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-risk-good" /> Удаление через 30 дней
          </span>
        </div>
      </div>
    </section>
  );
}

function Logos() {
  return (
    <section className="border-b border-line/60 py-10">
      <div className="container-narrow">
        <div className="text-center text-xs uppercase tracking-wider text-ink-dim">
          Помогаем разбирать договоры специалистам из
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 text-ink-dim/60 sm:grid-cols-3 md:grid-cols-6">
          {["Yandex", "Tinkoff", "Skyeng", "Avito", "Wildberries", "VK"].map(
            (name) => (
              <div
                key={name}
                className="flex h-10 items-center justify-center text-sm font-semibold tracking-wide"
              >
                {name}
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Brain,
      title: "Двухэтапный AI-анализ",
      desc: "Сначала модель проходит по чек-листу из 50+ пунктов как юрист, потом структурирует результат. Меньше пропусков.",
    },
    {
      icon: Gauge,
      title: "Скор риска 0–100",
      desc: "Один взгляд — и понятно, стоит ли подписывать. Скор разложен на критические / предупреждения / замечания.",
    },
    {
      icon: AlertTriangle,
      title: "Цитаты из документа",
      desc: "Каждый риск опирается на конкретную цитату с номером пункта. Не «где-то там», а «пункт 4.2, второй абзац».",
    },
    {
      icon: Sparkles,
      title: "Рекомендации к каждому пункту",
      desc: "Не просто «это плохо», а «попросите снизить срок оплаты до 30 дней». Готовые формулировки для переговоров.",
    },
    {
      icon: Languages,
      title: "RU + EN + ещё 5 языков",
      desc: "Договор на любом из основных языков. Отчёт всегда на вашем.",
    },
    {
      icon: Lock,
      title: "Удаление через 30 дней",
      desc: "Документы не используются для обучения моделей. Шифрование at rest и in transit.",
    },
  ];

  return (
    <section className="border-b border-line/60 py-20">
      <div className="container-narrow">
        <Eyebrow>Возможности</Eyebrow>
        <H2>Не просто «вытащить текст». Понять.</H2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-line bg-bg-card p-6 transition hover:border-line-strong hover:bg-bg-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 transition group-hover:bg-brand-500/15">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold text-ink">{title}</div>
              <div className="mt-2 text-sm text-ink-muted">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Загрузите договор",
      desc: "PDF, DOCX, TXT или скан. До 10 МБ. Без регистрации для первых 3 документов.",
    },
    {
      icon: Brain,
      title: "AI анализирует",
      desc: "Llama 3.3 70B проходит по чек-листу из 50+ юридических проверок. Занимает 5–30 секунд.",
    },
    {
      icon: ShieldCheck,
      title: "Получите отчёт",
      desc: "Скор риска, список проблемных пунктов с цитатами, рекомендации и сравнение с типовой практикой.",
    },
  ];

  return (
    <section className="border-b border-line/60 py-20">
      <div className="container-narrow">
        <Eyebrow>Как это работает</Eyebrow>
        <H2>Три шага. Около минуты.</H2>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-xl border border-line bg-bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-elevated font-mono text-sm font-semibold text-brand-400">
                  0{i + 1}
                </span>
                <s.icon className="h-5 w-5 text-ink-muted" />
              </div>
              <div className="mt-4 font-semibold text-ink">{s.title}</div>
              <div className="mt-2 text-sm text-ink-muted">{s.desc}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "₽0",
      period: "навсегда",
      desc: "Чтобы попробовать.",
      features: [
        "3 документа в месяц",
        "До 5 страниц",
        "Базовый анализ",
        "PDF-отчёт",
      ],
      cta: "Начать",
      href: "/",
      featured: false,
    },
    {
      name: "Pro",
      price: "₽890",
      period: "/мес",
      desc: "Для фрилансеров и арендаторов.",
      features: [
        "20 документов в месяц",
        "До 50 страниц",
        "Сравнение версий",
        "История без ограничений",
        "Шеринг отчётов по ссылке",
      ],
      cta: "Выбрать Pro",
      href: "/",
      featured: true,
    },
    {
      name: "Business",
      price: "₽2 890",
      period: "/мес",
      desc: "Для команд и малого бизнеса.",
      features: [
        "Безлимит документов",
        "До 200 страниц",
        "Командный доступ",
        "Интеграции (Google Drive, Slack)",
        "API доступ",
        "Приоритетная поддержка",
      ],
      cta: "Выбрать Business",
      href: "/",
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="border-b border-line/60 py-20">
      <div className="container-narrow">
        <Eyebrow>Тарифы</Eyebrow>
        <H2>Простой выбор: бесплатно или за чашку кофе.</H2>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                p.featured
                  ? "relative rounded-2xl border border-brand-500/50 bg-gradient-to-b from-brand-500/[0.08] to-bg-card p-6 shadow-lg shadow-brand-glow"
                  : "rounded-2xl border border-line bg-bg-card p-6"
              }
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-brand-500/50 bg-bg px-3 py-0.5 text-xs font-medium text-brand-400">
                  Популярный
                </div>
              )}
              <div className="text-sm font-semibold text-ink-muted">
                {p.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-ink">
                  {p.price}
                </span>
                <span className="text-sm text-ink-dim">{p.period}</span>
              </div>
              <div className="mt-2 text-sm text-ink-muted">{p.desc}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-risk-good" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={
                  p.featured
                    ? "btn-primary mt-6 w-full"
                    : "btn-ghost mt-6 w-full"
                }
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Это юридическая консультация?",
      a: "Нет. ContractLens — инструмент анализа документа. Для важных сделок советуем дополнительно показать договор юристу. Но 90% типовых проблем мы находим сразу.",
    },
    {
      q: "Что происходит с моими документами?",
      a: "Файл хранится зашифрованным до 30 дней (можно удалить раньше). Текст документа отправляется AI-провайдеру (Groq/OpenAI) только для анализа — они не используют его для обучения. После 30 дней файл удаляется автоматически.",
    },
    {
      q: "Какие форматы поддерживаются?",
      a: "PDF, DOCX, TXT и сканы (JPG, PNG) до 10 МБ. Сканы распознаются OCR. Для лучшего качества — текстовые форматы.",
    },
    {
      q: "Насколько точен AI?",
      a: "Очень точен на типовых рисках (оплата, ответственность, расторжение, неконкуренция). Для редких отраслевых нюансов рекомендуем юриста. Каждый риск AI подкрепляет цитатой из документа — вы можете проверить.",
    },
    {
      q: "Можно ли отменить подписку?",
      a: "Да, в любой момент в один клик. Деньги за неиспользованный период возвращаются по запросу.",
    },
  ];

  return (
    <section className="border-b border-line/60 py-20">
      <div className="container-narrow">
        <Eyebrow>Вопросы</Eyebrow>
        <H2>Если коротко.</H2>

        <div className="mx-auto mt-12 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-bg-card">
          {items.map((item) => (
            <details key={item.q} className="group p-6 open:bg-bg-hover">
              <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-ink">
                {item.q}
                <ArrowRight className="h-4 w-4 text-ink-dim transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-brand-glow opacity-60" aria-hidden />
      <div className="container-narrow relative text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Подписать вслепую — дорого.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">
          Один анализ занимает 30 секунд. Один пропущенный пункт может стоить
          годовой выручки.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="#top" className="btn-primary">
            <Zap className="h-4 w-4" />
            Загрузить договор
          </Link>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-xs font-semibold uppercase tracking-wider text-brand-400">
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
      {children}
    </h2>
  );
}

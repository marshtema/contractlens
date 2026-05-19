import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  FileText,
  Handshake,
  HeartHandshake,
  Home,
  Lock,
  Scroll,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Template {
  slug: string;
  name: string;
  category: string;
  icon: LucideIcon;
  description: string;
  pages: number;
  isPremium: boolean;
}

const TEMPLATES: Template[] = [
  {
    slug: "nda-bilateral",
    name: "Двусторонний NDA",
    category: "Конфиденциальность",
    icon: Lock,
    description:
      "Соглашение о неразглашении между двумя сторонами. Срок 3 года, штраф 500 000 ₽, исключения для уже известной информации.",
    pages: 3,
    isPremium: false,
  },
  {
    slug: "lease-apartment",
    name: "Договор аренды квартиры",
    category: "Аренда",
    icon: Home,
    description:
      "Между физлицами, на 11 месяцев (без регистрации), с депозитом и описью имущества. Защита арендатора.",
    pages: 5,
    isPremium: false,
  },
  {
    slug: "lease-office",
    name: "Договор аренды офиса",
    category: "Аренда",
    icon: Building2,
    description:
      "B2B-аренда коммерческой недвижимости с автопродлением, индексацией и штрафами. С Приложением №1 (акт приёма).",
    pages: 8,
    isPremium: true,
  },
  {
    slug: "employment-permanent",
    name: "Трудовой договор (бессрочный)",
    category: "Труд",
    icon: Briefcase,
    description:
      "Полная занятость по ТК РФ. Зарплата, отпуск, испытательный срок, неконкуренция с ограничениями.",
    pages: 6,
    isPremium: false,
  },
  {
    slug: "service-it",
    name: "Договор оказания IT-услуг",
    category: "Услуги",
    icon: FileText,
    description:
      "Подрядчик и заказчик. Этапы, акты сдачи-приёмки, передача исключительных прав, лимит ответственности.",
    pages: 7,
    isPremium: true,
  },
  {
    slug: "service-freelance",
    name: "Договор фриланс-услуг",
    category: "Услуги",
    icon: Sparkles,
    description:
      "Простой шаблон для фрилансеров: ТЗ, оплата 50/50, право на портфолио, конфиденциальность.",
    pages: 4,
    isPremium: false,
  },
  {
    slug: "purchase-goods",
    name: "Договор поставки товаров",
    category: "Поставка",
    icon: TrendingUp,
    description:
      "B2B-поставка с графиком отгрузок, инкотермс, контролем качества и неустойкой за просрочку.",
    pages: 6,
    isPremium: true,
  },
  {
    slug: "loan-individual",
    name: "Договор займа между физлицами",
    category: "Финансы",
    icon: Banknote,
    description:
      "Беспроцентный или процентный займ. Расписка-приложение, график возврата, обеспечение.",
    pages: 3,
    isPremium: false,
  },
  {
    slug: "partnership",
    name: "Договор партнёрства",
    category: "Партнёрство",
    icon: Handshake,
    description:
      "Совместный проект двух сторон: вклады, распределение прибыли и убытков, порядок выхода.",
    pages: 5,
    isPremium: true,
  },
  {
    slug: "insurance",
    name: "Страховой полис (типовой)",
    category: "Страхование",
    icon: ShieldCheck,
    description:
      "Чек-лист и комментарии к типовым исключениям, франшизе и порядку выплаты страхового возмещения.",
    pages: 4,
    isPremium: false,
  },
];

const CATEGORIES = Array.from(new Set(TEMPLATES.map((t) => t.category)));

export default function TemplatesPage() {
  return (
    <div className="container-narrow py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-bg-elevated px-3 py-1 text-xs text-ink-muted">
          <Scroll className="h-3 w-3 text-brand-400" />
          Библиотека шаблонов
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink sm:text-4xl">
          Начните с проверенной основы
        </h1>
        <p className="mt-3 text-ink-muted">
          10 типовых договоров, проверенных юристами. Загрузите свой вариант
          или адаптируйте наш — AI всё равно покажет, что стоит доработать.
        </p>
      </div>

      {/* Categories */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <span
            key={c}
            className="rounded-full border border-line bg-bg-card px-3 py-1 text-xs text-ink-muted"
          >
            {c}
          </span>
        ))}
      </div>

      {/* Grid */}
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <li key={t.slug}>
            <TemplateCard t={t} />
          </li>
        ))}
      </ul>

      {/* Note */}
      <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-dashed border-line bg-bg-card p-6 text-center">
        <HeartHandshake className="mx-auto h-6 w-6 text-brand-400" />
        <div className="mt-3 font-medium text-ink">
          Скачивание шаблонов — в разработке
        </div>
        <div className="mt-1 text-sm text-ink-muted">
          Уже сейчас вы можете загрузить любой свой договор на анализ — AI
          разберёт его так же тщательно, как наши шаблоны.
        </div>
        <Link href="/" className="btn-primary mt-5 inline-flex">
          Анализировать свой договор <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function TemplateCard({ t }: { t: Template }) {
  return (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border bg-bg-card p-5 transition",
        t.isPremium
          ? "border-line hover:border-brand-500/50"
          : "border-line hover:border-line-strong",
      )}
    >
      {t.isPremium && (
        <span className="absolute right-3 top-3 rounded-full border border-brand-500/50 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-400">
          Premium
        </span>
      )}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
        <t.icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs uppercase tracking-wider text-ink-dim">
        {t.category}
      </div>
      <div className="mt-0.5 font-semibold text-ink">{t.name}</div>
      <p className="mt-2 text-sm text-ink-muted">{t.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-dim">
        <span>{t.pages} страниц</span>
        <span className="inline-flex items-center gap-1 text-ink-muted opacity-60 transition group-hover:opacity-100">
          Подробнее <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

<div align="center">

# ⚖️ ContractLens AI

**AI-ассистент для анализа юридических договоров.**
Загрузите договор → получите оценку рисков, готовые правки формулировок и шаблон письма контрагенту.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-22.11+-43853d)](./.nvmrc)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)

</div>

---

## Что это

Загружаешь PDF/DOCX/TXT/скан → AI читает как старший юрист по чек-листу из 50+ пунктов → видишь:

- **Скор риска** 0–100 + вердикт «подписывать / договориться / не подписывать»
- **Цитаты** проблемных пунктов с подсветкой в исходном тексте
- **Готовый переписанный текст** каждого спорного пункта — копи-паст в Word
- **Шаблон письма** контрагенту с просьбой о правке
- **Оценку ущерба** в рублях
- **AI-чат** прямо по тексту документа

И всё это — за 30 секунд.

## Демо-функции

Откройте `/templates` после запуска — 10 встроенных типовых договоров со специально «зашитыми» проблемами. Один клик → видите как работает AI.

## Стек

| Слой | Технологии |
|------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind, framer-motion, lucide-react |
| **Backend** | NestJS 10 + Fastify, Prisma, zod, SSE streaming |
| **AI** | Groq (Llama 3.3 70B) / Gemini / встроенный mock-режим |
| **БД** | SQLite (dev), PostgreSQL (prod, смена одной строки в `schema.prisma`) |
| **OCR** | Tesseract.js (rus+eng), без облака |
| **PDF** | `@react-pdf/renderer` |
| **Auth** | Magic-link email + httpOnly cookie |
| **Billing** | Stripe Checkout (test/prod), dev_mock fallback |

## Запуск за 60 секунд

Нужен только **Node.js ≥ 22** (см. `.nvmrc`). База — SQLite, создастся сама.

```bash
git clone <repo-url> contractlens
cd contractlens
npm install
cp apps/api/.env.example apps/api/.env
npm --workspace @contractlens/api run db:migrate
npm run dev
```

→ открыть http://localhost:3000

Mock-режим работает **без API-ключей** — всё кликается, никаких внешних запросов.

## Включить настоящий AI

Регистрация на [console.groq.com](https://console.groq.com/keys) (бесплатно, ~30 req/min на Llama 3.3). Ключ → в `apps/api/.env`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
```

Альтернативы: Gemini (`AI_PROVIDER=gemini`, требует VPN в РФ).

## Включить настоящие платежи

Тестовые ключи Stripe → в `apps/api/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Webhook слушать локально: `stripe listen --forward-to localhost:3001/api/billing/webhook`.

Без ключей checkout работает в `dev_mock`-режиме — апгрейд мгновенный, без оплаты.

## Структура

```
contractlens/
├── apps/
│   ├── api/                       # NestJS + Fastify + Prisma
│   │   ├── src/
│   │   │   ├── ai/                # Analyzer (mock/groq/gemini), Chat, prompts
│   │   │   ├── auth/              # magic-link, sessions, guards
│   │   │   ├── billing/           # Stripe Checkout + webhook
│   │   │   ├── compare/           # diff + AI verdict on changes
│   │   │   ├── documents/         # upload/list/get, PDF, sharing, OCR
│   │   │   ├── prisma/            # PrismaService
│   │   │   └── storage/           # LocalStorageService (S3/R2 — interface ready)
│   │   └── prisma/schema.prisma
│   └── web/                       # Next.js App Router
│       └── src/
│           ├── app/               # /, /documents, /compare, /calendar, /templates,
│           │                      # /share/[token], /login, /billing/*, /privacy, /terms
│           ├── components/        # ReportView, DocumentViewer, ChatPanel,
│           │                      # CommandPalette, Toast, ScoreGauge, …
│           └── lib/               # api.ts (cookie-aware fetch), templates, cn
└── packages/shared/                # zod schemas, single source of truth
```

## Возможности

| | |
|--|--|
| 📄 Загрузка | PDF, DOCX, TXT + OCR для JPG/PNG (Tesseract.js, rus+eng) |
| 🧠 AI-анализ | Llama 3.3 70B, 8 категорий рисков (оплата/ответственность/IP/расторжение/неконкуренция/конфиденциальность/штрафы/форс-мажор/подсудность) |
| 🎯 Скор + вердикт | 0–100 + «подписывать / договориться / не подписывать» с обоснованием |
| 🔍 Document Viewer | Подсветка проблемных цитат прямо в тексте (как Grammarly) |
| ✏️ Готовые правки | Переписанный текст пункта для копи-паста |
| ✉️ Письма контрагенту | Шаблон делового письма с просьбой об изменении |
| 💰 Оценка ущерба | Грубая оценка денежного риска в ₽ |
| 💬 AI-чат | Streaming через SSE, вопросы по тексту документа |
| 📑 PDF-отчёт | Скачивание для отправки юристу |
| 🔄 Сравнение версий | Word-level diff + AI-оценка каждой значимой правки |
| 🔗 Публичный share | Read-only ссылка для отправки контрагенту |
| 📅 Календарь | Авто-извлечённые даты renewal с напоминанием по цвету |
| 🔐 Auth | Magic-link, httpOnly cookie, без паролей |
| 💳 Билinг | Free/Pro/Business лимиты, Stripe Checkout, красивый upgrade-диалог |
| ⌨️ Cmd+K | Command palette для быстрой навигации |
| 📱 Mobile | Burger menu, адаптивные карточки |

## Архитектурные решения

| Решение | Почему |
|---------|--------|
| **Mock-режим — первоклассный гражданин** | Любой может склонировать репо и сразу увидеть полную демку без ключей. `suggested_fix` / `negotiation_email` / `monetary_impact` заполняются по правилам. |
| **Zod на границах API** | Контракт между web и api — одна схема в `packages/shared`. LLM-ошибки ловим до того как они доедут до UI. |
| **Coercion-слой для enum'ов** | LLM регулярно выдумывает `rental_agreement` вместо `lease_agreement`. Маппим → fallback на `other`, никогда не падаем. |
| **Single-stage AI prompt** | Помещается в 12K TPM бесплатного Groq, retry с backoff на 429/413. |
| **Document text сохраняется до AI** | Если AI упадёт — viewer и чат всё равно работают. |
| **httpOnly cookie sessions** | XSS-устойчивость; ротация одним удалением строки. |
| **Server-side cookie passthrough** | RSC-fetch в Next 14 не пробрасывает cookie сам. Без этого SSR видит юзера анонимом → 403 → 404. |
| **SQLite по дефолту** | Старт без Docker. Миграция на Postgres = смена `provider` в schema. |

## Известные ограничения

- **Email magic-link** — в dev возвращается в теле ответа и пишется в лог. Для прода нужен Resend/SES.
- **Stripe webhook signature** — пропускается если `STRIPE_WEBHOOK_SECRET` не задан (только для dev).
- **Бесплатный Groq** — 100K токенов/день, 12K/мин. На бóльшем потоке нужен платный план.
- **Tesseract OCR** медленный (5–15 сек/страница). Для боевого OCR — Azure Document Intelligence.
- **Очередь** — in-process, не BullMQ. Для скейла → Redis + BullMQ.
- **Файлы** хранятся локально (`apps/api/storage/`). Для прода → R2/S3 (`StorageService` interface готов).

## Команды

```bash
npm run dev                                          # api + web параллельно
npm --workspace @contractlens/api run dev            # только api
npm --workspace @contractlens/web run dev            # только web
npm run build                                        # прод-билд

npm --workspace @contractlens/api run db:migrate     # apply migrations
npm --workspace @contractlens/api run db:studio      # Prisma Studio :5555
npm --workspace @contractlens/api run db:reset       # обнулить БД
```

## Документация

- [BUGS_FIXED.md](./BUGS_FIXED.md) — журнал багфиксов и улучшений
- [CONTRIBUTING.md](./CONTRIBUTING.md) — как контрибутить

## Лицензия

[MIT](./LICENSE) — свободно используйте, модифицируйте, форкайте.

---

<div align="center">
Сделано чтобы помочь людям не подписывать кабальные договоры.
</div>

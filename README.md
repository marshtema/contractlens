<div align="center">

<h1>
  ⚖️ ContractLens AI
</h1>

<p>
  <strong>Прочитай любой договор как старший юрист — за 30 секунд.</strong><br/>
  AI-разбор юридических документов: подсветка рисков, готовые правки, AI-чат, переговорные письма.
</p>

<p>
  <a href="https://github.com/marshtema/contractlens/actions/workflows/ci.yml">
    <img src="https://github.com/marshtema/contractlens/actions/workflows/ci.yml/badge.svg" alt="CI"/>
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT"/>
  </a>
  <a href="./.nvmrc">
    <img src="https://img.shields.io/badge/node-22.11+-43853d?logo=node.js&logoColor=white" alt="Node"/>
  </a>
  <a href="https://github.com/marshtema/contractlens/stargazers">
    <img src="https://img.shields.io/github/stars/marshtema/contractlens?style=flat&logo=github" alt="Stars"/>
  </a>
  <a href="https://github.com/marshtema/contractlens/commits/main">
    <img src="https://img.shields.io/github/last-commit/marshtema/contractlens?logo=git&logoColor=white" alt="Last commit"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs" alt="Next.js"/>
  <img src="https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white" alt="NestJS"/>
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" alt="TS"/>
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Tailwind-CSS-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Groq-Llama%203.3-orange" alt="Groq"/>
</p>

<br/>

<img src="docs/screens/01-landing.png" alt="ContractLens landing — пойми любой договор за 30 секунд" width="100%"/>

<sub><em>📸 Скриншоты добавляются после первого деплоя — см. <a href="./docs/SCREENSHOTS.md">инструкцию</a></em></sub>

</div>

---

## ✨ Что это

Загружаешь договор → AI читает как старший юрист по чек-листу из 50+ пунктов → видишь:

- 🎯 **Скор риска** 0–100 + вердикт «подписывать / договориться / не подписывать»
- 🔍 **Цитаты** проблемных пунктов с подсветкой в исходном тексте (как Grammarly)
- ✏️ **Готовый переписанный текст** каждого спорного пункта — копи-паст в Word
- ✉️ **Шаблон письма** контрагенту с просьбой о правке
- 💰 **Оценку ущерба** в рублях
- 💬 **AI-чат** прямо по тексту документа

Всё это — **за 30 секунд** и **без юриста**.

> **Демо:** клонируйте репо → `npm run dev` → откройте `/templates` → нажмите любой шаблон → «Проанализировать». Никаких API-ключей не нужно — встроенный mock-режим показывает полную функциональность.

---

## 🚀 Быстрый старт (60 секунд)

```bash
git clone https://github.com/marshtema/contractlens
cd contractlens
npm install
cp apps/api/.env.example apps/api/.env
npm --workspace @contractlens/api run db:migrate
npm run dev
```

→ http://localhost:3000

**Системные требования:** Node.js ≥ 22 (см. [`.nvmrc`](./.nvmrc)). Больше ничего.

---

## 🎬 Превью

<table>
<tr>
<td width="50%"><img src="docs/screens/02-report.png" alt="Отчёт с подсветкой рисков"/></td>
<td width="50%"><img src="docs/screens/03-risk-card.png" alt="Risk card с готовой правкой и письмом"/></td>
</tr>
<tr>
<td align="center"><strong>Отчёт со split-view</strong><br/><sub>подсветка цитат в исходном тексте</sub></td>
<td align="center"><strong>Risk-карточка с табами</strong><br/><sub>готовая правка + переговорное письмо</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screens/04-chat.png" alt="AI-чат"/></td>
<td width="50%"><img src="docs/screens/05-compare.png" alt="Сравнение версий"/></td>
</tr>
<tr>
<td align="center"><strong>AI-чат</strong><br/><sub>SSE streaming, ground в тексте документа</sub></td>
<td align="center"><strong>Сравнение версий</strong><br/><sub>word-level diff + AI-оценка правок</sub></td>
</tr>
</table>

<sub>Скриншоты сделают свой первый push после <a href="./docs/SCREENSHOTS.md">этой инструкции</a>.</sub>

---

## 🧩 Возможности

| | Фича | Где |
|--|------|-----|
| 📄 | Загрузка PDF / DOCX / TXT + **OCR** (JPG/PNG через Tesseract.js, rus+eng) | `/` |
| 🧠 | AI-анализ по 8 категориям рисков (Llama 3.3 70B / Gemini / mock) | автоматически |
| 🎯 | Скор риска 0–100 + вердикт с обоснованием | страница документа |
| 🔍 | Document viewer с подсветкой цитат | страница документа |
| ✏️ | Готовый переписанный текст пункта | табы в risk-карточке |
| ✉️ | Шаблон письма контрагенту | табы в risk-карточке |
| 💬 | AI-чат с документом (SSE streaming) | floating-кнопка |
| 📑 | PDF-отчёт на скачивание | кнопка в шапке отчёта |
| 🔗 | Публичная read-only ссылка | кнопка «Поделиться» |
| 🔄 | Сравнение версий с AI-оценкой каждой правки | `/compare` |
| 📅 | Контрактный календарь с авто-извлечёнными датами renewal | `/calendar` |
| 📚 | Библиотека из 10 типовых шаблонов с зашитыми проблемами | `/templates` |
| 🔐 | Auth: email magic-link + httpOnly cookie | `/login` |
| 💳 | Биллинг Free/Pro/Business + Stripe (test+prod) | `/api/billing/checkout` |
| ⌨️ | Command palette (⌘/Ctrl + K) | везде |
| 📱 | Mobile burger menu | везде |

---

## 🛠 Технологии

<table>
<tr>
<td>

**Frontend**
- Next.js 14 (App Router, RSC)
- React 18 + TypeScript strict
- Tailwind CSS + кастомная палитра
- framer-motion, lucide-react

</td>
<td>

**Backend**
- NestJS 10 + Fastify
- Prisma ORM
- Zod на границах
- SSE через нативный Fastify

</td>
<td>

**AI / Data**
- Groq (Llama 3.3 70B)
- Gemini 2.0 Flash (optional)
- Tesseract.js (OCR, rus+eng)
- `@react-pdf/renderer`

</td>
<td>

**Инфра**
- SQLite (dev) / PostgreSQL (prod)
- Stripe (test+prod)
- npm workspaces (monorepo)
- GitHub Actions CI

</td>
</tr>
</table>

---

## 🗂 Структура

```
contractlens/
├── apps/
│   ├── api/                       # NestJS + Fastify + Prisma
│   │   ├── src/
│   │   │   ├── ai/                # Analyzer (mock/groq/gemini), Chat
│   │   │   ├── auth/              # magic-link, sessions, guards
│   │   │   ├── billing/           # Stripe Checkout + webhook
│   │   │   ├── compare/           # diff + AI verdict
│   │   │   ├── documents/         # upload/list/get, PDF, share, OCR
│   │   │   ├── prisma/
│   │   │   └── storage/
│   │   └── prisma/schema.prisma
│   └── web/                       # Next.js App Router
│       └── src/
│           ├── app/               # /, /documents, /compare, /calendar,
│           │                      # /templates, /share/[token], /login,
│           │                      # /billing/*, /privacy, /terms
│           ├── components/        # ReportView, DocumentViewer, ChatPanel,
│           │                      # CommandPalette, Toast, ScoreGauge, …
│           └── lib/               # api.ts, templates, cn
└── packages/shared/                # zod schemas, single source of truth
```

---

## 🎯 Roadmap

- [x] **v0.1** — MVP: upload, AI-анализ, viewer, risk-карточки
- [x] **v0.2** — Auth, биллинг, лимиты, календарь
- [x] **v0.3** — AI-чат (SSE), PDF, шеринг, сравнение версий
- [x] **v0.4** — OCR, шаблоны, command palette, mobile
- [ ] **v0.5** — реальный SMTP для magic-link (Resend / SES)
- [ ] **v0.6** — email-напоминания о renewal через cron
- [ ] **v0.7** — Drafting: генерация договора с нуля по чек-листу
- [ ] **v0.8** — Browser extension (Gmail / Notion)
- [ ] **v1.0** — i18n (en + ru), Azure Document Intelligence OCR, PostgreSQL по умолчанию

---

## 🧠 Архитектурные решения

| Решение | Почему |
|---------|--------|
| **Mock-режим — первоклассный гражданин** | Любой может склонировать и сразу увидеть полную демку без ключей |
| **Zod на границах API** | Один контракт между web и api, LLM-ошибки ловим до UI |
| **Coercion-слой для enum'ов** | LLM выдумывает `rental_agreement` → маппим → fallback `other`, никогда не падаем |
| **Single-stage AI prompt** | Помещается в 12K TPM Groq free tier, retry с backoff на 429/413 |
| **Document text сохраняется до AI** | Если AI упадёт — viewer и чат всё равно работают |
| **httpOnly cookie sessions** | XSS-устойчивость, ротация одним delete |
| **Server-side cookie passthrough** | RSC-fetch в Next 14 не пробрасывает cookie сам — иначе 403→404 |
| **SQLite по дефолту** | Старт без Docker, миграция на Postgres = одна строка в schema |

---

## ⚠️ Известные ограничения

- **Email magic-link** — в dev возвращается в теле и пишется в лог. Прод нуждается в Resend/SES.
- **Stripe webhook signature** — пропускается без `STRIPE_WEBHOOK_SECRET` (только для dev).
- **Бесплатный Groq** — 100K токенов/день, 12K/мин. На бóльшем потоке нужен платный план.
- **Tesseract OCR** медленный (5–15 сек/страница). Для боевого OCR — Azure Document Intelligence.
- **Очередь** — in-process, не BullMQ. Для скейла → Redis + BullMQ (структура готова).
- **Файлы** хранятся локально (`apps/api/storage/`). Для прода — переключите `StorageService` на R2/S3.

---

## 🎛 Включить настоящий AI / Stripe

<details>
<summary><strong>Groq (Llama 3.3) — бесплатно, без VPN из РФ</strong></summary>

1. https://console.groq.com/keys → Create API Key (бесплатно)
2. В `apps/api/.env`:
   ```env
   AI_PROVIDER=groq
   GROQ_API_KEY=gsk_...
   ```
3. Перезапустить `npm run dev`
</details>

<details>
<summary><strong>Gemini — 1500 req/day, требует VPN в РФ</strong></summary>

1. https://aistudio.google.com/apikey → Create
2. В `apps/api/.env`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=AIza...
   GEMINI_MODEL=gemini-2.0-flash
   ```
</details>

<details>
<summary><strong>Stripe — test или prod, real billing</strong></summary>

1. https://dashboard.stripe.com/test/apikeys
2. В `apps/api/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # из `stripe listen --forward-to localhost:3001/api/billing/webhook`
   ```
3. Test-карта: `4242 4242 4242 4242`, любая будущая дата, любой CVV
</details>

---

## 📜 Команды

```bash
npm run dev                                          # api + web параллельно
npm --workspace @contractlens/api run dev            # только api
npm --workspace @contractlens/web run dev            # только web
npm run build                                        # прод-билд

npm --workspace @contractlens/api run db:migrate     # apply migrations
npm --workspace @contractlens/api run db:studio      # Prisma Studio :5555
npm --workspace @contractlens/api run db:reset       # обнулить БД
```

---

## 📚 Документация

- 📖 [BUGS_FIXED.md](./BUGS_FIXED.md) — журнал багфиксов и улучшений (22+ пункта)
- 🤝 [CONTRIBUTING.md](./CONTRIBUTING.md) — как контрибутить
- 🔒 [SECURITY.md](./SECURITY.md) — как сообщить об уязвимости
- 📸 [docs/SCREENSHOTS.md](./docs/SCREENSHOTS.md) — как сделать скриншоты для README

---

## 📄 Лицензия

[MIT](./LICENSE) — свободно используйте, модифицируйте, форкайте.

---

<div align="center">

**Сделано чтобы помочь людям не подписывать кабальные договоры.**

<sub>Если проект помог — поставьте ⭐, это правда мотивирует развивать дальше.</sub>

</div>

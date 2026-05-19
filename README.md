# ContractLens AI

AI-ассистент для анализа юридических договоров. Загружаете договор — получаете отчёт с подсветкой рисков, готовыми правками формулировок, шаблоном письма контрагенту и AI-чатом по тексту.

«Пойми любой договор за 30 секунд. Без юриста. Без юридического образования.»

---

## Что работает

| Фича | Где |
|------|-----|
| Загрузка PDF/DOCX/TXT + **OCR** для JPG/PNG (Tesseract.js, rus+eng) | `/` |
| AI-анализ с 8+ категориями рисков (оплата, ответственность, IP, расторжение, неконкуренция и др.) | автоматически после upload |
| Скор риска 0–100 + цветной вердикт «подписывать / договориться / не подписывать» | страница документа |
| Подсветка рисковых цитат в исходном тексте (Grammarly-style) | страница документа, split-view |
| Готовый переписанный текст пункта + готовое письмо контрагенту + оценка ущерба в ₽ | табы внутри каждой risk-карточки |
| AI-чат с документом (SSE streaming) | floating-кнопка справа внизу |
| Скачивание PDF-отчёта | кнопка «PDF» сверху отчёта |
| Сравнение версий с AI-оценкой каждой правки | `/compare` |
| Публичная read-only ссылка на отчёт | кнопка «Поделиться» |
| Контрактный календарь с авто-извлечёнными датами renewal | `/calendar` |
| Auth: email magic-link, httpOnly cookie, без паролей | `/login` |
| Биллинг: Free/Pro/Business лимиты + красивый upgrade-диалог при превышении | автоматически |
| Stripe Checkout (test-mode, если задан `STRIPE_SECRET_KEY`) | `/api/billing/checkout` |
| Библиотека шаблонов (10 типовых договоров) | `/templates` |
| Command palette ⌘/Ctrl + K | везде |
| Toast-уведомления, мобильное burger-меню, анимированная статистика, отзывы на лендинге | везде |

---

## Технический стек

**Бэкенд** (`apps/api`)
- NestJS 10 + Fastify
- Prisma ORM + SQLite (на проде → PostgreSQL менять только `provider` в schema.prisma)
- Groq (Llama 3.3 70B) как основной LLM; Gemini как опция; встроенный mock с полноценными ответами (заполняет `suggested_fix` / `negotiation_email` / `monetary_impact`)
- Tesseract.js для OCR (rus+eng), `@react-pdf/renderer` для PDF, `mammoth` для DOCX, `pdf-parse` для PDF
- SSE streaming через нативный Fastify raw response

**Фронтенд** (`apps/web`)
- Next.js 14 (App Router) + React 18
- Tailwind CSS, тёмная тема, кастомная палитра (`risk-critical/warning/info/good`)
- framer-motion для анимаций, lucide-react для иконок
- Динамический `cookie`-passthrough в server components чтобы SSR-fetch'и работали с auth

**Общее** (`packages/shared`)
- Zod-схемы для `AnalysisResult`, `DocumentDetail`, enum'ов — единая правда между api и web

---

## Локальный запуск

### Требования
- **Node.js ≥ 20** (рекомендую 22 LTS через nvm-windows)
- npm 10+
- (опционально) Docker для запуска PostgreSQL/Redis на проде

### Установка
```bash
# В корне репозитория
npm install
```

### База
```bash
# Применить миграции (SQLite, файл apps/api/prisma/dev.db создастся автоматически)
npm --workspace @contractlens/api run db:migrate
```

### .env (только в `apps/api`)
Скопируйте `apps/api/.env.example` → `apps/api/.env`. Минимум для работы — ничего менять не нужно, всё работает в mock-режиме:

```env
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
NODE_ENV=development
AI_PROVIDER=mock        # mock | groq | gemini
WEB_ORIGIN=http://localhost:3000
STORAGE_DRIVER=local
STORAGE_LOCAL_DIR=./storage
```

Чтобы включить настоящий AI:
```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...   # https://console.groq.com/keys, бесплатно
GROQ_MODEL=llama-3.3-70b-versatile
```

Чтобы включить настоящие платежи (test-mode):
```env
STRIPE_SECRET_KEY=sk_test_...    # https://dashboard.stripe.com/test/apikeys
STRIPE_WEBHOOK_SECRET=whsec_...  # из `stripe listen --forward-to localhost:3001/api/billing/webhook`
# Опционально:
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
```

### Запуск
```bash
npm run dev
```
- API: http://localhost:3001
- Web: http://localhost:3000

---

## Структура

```
contractlens/
├── apps/
│   ├── api/                       # NestJS бэкенд
│   │   ├── src/
│   │   │   ├── ai/                # AnalyzerService + Mock/Groq/Gemini, ChatService
│   │   │   ├── auth/              # magic-link, sessions, guards
│   │   │   ├── billing/           # Stripe + dev-mock checkout, webhook
│   │   │   ├── compare/           # /api/compare двух договоров
│   │   │   ├── documents/         # upload/list/get/PDF/share, text extraction (PDF/DOCX/TXT/OCR)
│   │   │   ├── prisma/            # PrismaService
│   │   │   └── storage/           # LocalStorageService (под R2/S3 — interface готов)
│   │   └── prisma/schema.prisma   # users, documents, document_risks, share tokens, …
│   └── web/                       # Next.js фронт
│       └── src/
│           ├── app/               # /, /documents, /compare, /calendar, /templates, /share/[token], /login, /billing/*
│           ├── components/        # ReportView, DocumentViewer, ChatPanel, CommandPalette, Toast, LimitReachedDialog, …
│           └── lib/               # api.ts (server-side cookie passthrough), cn, risk-tone
└── packages/shared/                # zod-схемы для AnalysisResult, DocumentDetail
```

---

## Архитектурные решения и почему

| Решение | Почему |
|---------|--------|
| **TypeScript строгий** во всём, zod на границах | Контракт между web и api валидируется одной схемой; ошибки от модели ловим тут же |
| **Mock-режим как первоклассный гражданин** (не заглушка) | Можно показать полную демку любого user-сценария без API-ключей. `suggested_fix` / `negotiation_email` / `monetary_impact` заполняются по правилам |
| **Single-stage AI-промпт** вместо 2-stage | Помещается в 12K TPM бесплатного Groq, не падает по rate-limit на обычных договорах |
| **Coercion-слой** для enum'ов | LLM выдумывает варианты типа `rental_agreement` вместо `lease_agreement` — нормализуем перед zod, фоллбэк на `other` чтобы никогда не падать |
| **SQLite по дефолту** | Запуск без Docker. Миграция на PostgreSQL = смена `provider` в schema.prisma + переменная окружения |
| **Document text extracted сразу, до AI** | Если AI упадёт по rate-limit — текст уже в БД, viewer и chat работают |
| **httpOnly cookie sessions** вместо JWT | XSS-устойчивость; ротация одним удалением строки из `sessions` |
| **Сервер-сайд cookie passthrough в `lib/api.ts`** | RSC-fetch'и в Next 14 не пробрасывают cookie сами — иначе SSR видит юзера анонимом → 403 → 404 |

---

## Известные ограничения

- **Email magic-link только в dev-режиме**: ссылка пишется в консоль API и возвращается в теле ответа. Для прода нужно подключить Resend/SES/SMTP — сейчас стоит заглушка в `AuthService.requestMagicLink`.
- **Stripe webhook без signature verification**, если `STRIPE_WEBHOOK_SECRET` не задан (для dev). На проде задайте секрет.
- **Бесплатный Groq лимит**: 100K токенов/день и 12K токенов/минуту. На большом потоке упрётесь. Платный план снимает оба.
- **Gemini требует VPN в РФ** (Google API geo-блок). Groq — нет.
- **Tesseract OCR медленный** на сканах (5-15 сек на страницу). Тяжёлые сканы лучше пропускать через Azure Document Intelligence.
- **Очередь — in-process**, не BullMQ. Для горизонтального скейла нужен Redis + BullMQ (структура `DocumentsService.runAnalysis` готова к этому — просто заверните в job).
- **Хранение файлов — локальный диск** (`apps/api/storage/`). На проде переключите `StorageService` на `R2StorageService` (interface уже описан).
- **Real Stripe** требует своего dashboard. В dev — `mode: "dev_mock"`: апгрейд мгновенный, без оплаты.

---

## Команды

```bash
# Разработка (api + web параллельно)
npm run dev

# Только API
npm --workspace @contractlens/api run dev

# Только web
npm --workspace @contractlens/web run dev

# Билд для прода
npm run build

# Prisma
npm --workspace @contractlens/api run db:migrate      # применить миграции
npm --workspace @contractlens/api run db:studio       # Prisma Studio GUI на :5555
npm --workspace @contractlens/api run db:reset        # обнулить БД
```

---

## Лицензия

Закрытая разработка. Все права защищены.

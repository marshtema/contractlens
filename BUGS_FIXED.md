# Что было сломано — что починили

Журнал багов и улучшений в рамках сессии стабилизации/полировки.

---

## 🐛 Реальные баги (нарушения работы)

### 1. 404 при открытии любого документа из истории
**Симптом:** пользователь авторизован, открывает свой документ через `/documents/<id>` → 404 «This page could not be found».

**Причина:** `lib/api.ts` делал серверный `fetch` без пробрасывания cookie. На SSR Next.js не подкидывает их сам. API не видел юзера → возвращал 403 (документ принадлежит другому) → мой `getDocument().catch(()=>null)` глушил всё в `notFound()`.

**Фикс:** в `lib/api.ts` добавлен централизованный `cookie`-passthrough через `next/headers`. На client — относительный путь и rewrite сам пробрасывает. Дополнительно — page.tsx показывает понятное сообщение «принадлежит другому пользователю» вместо 404 при 403.

**Где:** `apps/web/src/lib/api.ts`, `apps/web/src/app/documents/[id]/page.tsx`

---

### 2. Чужие анонимные документы в общем списке
**Симптом:** аноним заходил на `/documents` и видел count=5 — документы других анонимов.

**Причина:** `DocumentsService.list(null)` возвращал все anonymous-документы за последний час.

**Фикс:** для `userId === null` теперь возвращается пустой массив. Аноним-документ доступен по прямой ссылке, но не светится в чужой истории. UI: страница `/documents` показывает «Войдите чтобы увидеть историю» с кнопкой Login.

**Где:** `apps/api/src/documents/documents.service.ts`, `apps/web/src/app/documents/page.tsx`

---

### 3. Конфликт client/server в `ScoreGauge`
**Симптом:** `(0, _components_ScoreGauge__WEBPACK_IMPORTED_MODULE_3__.scoreTone) is not a function` — runtime error на серверном компоненте `/documents/page.tsx`.

**Причина:** Next.js запрещает импортировать произвольные функции из файлов с `"use client"`. `scoreTone` экспортировалась из `ScoreGauge.tsx`.

**Фикс:** функция вынесена в `lib/risk-tone.ts` (без `"use client"`). `ScoreGauge` и `ReportView` импортируют оттуда же, `ScoreGauge` re-export убран (дубликат имени).

**Где:** `apps/web/src/lib/risk-tone.ts`, `ScoreGauge.tsx`, `ReportView.tsx`, `documents/page.tsx`

---

### 4. `scoreTone` экспортирован дважды (build error)
**Симптом:** `the name 'scoreTone' is defined multiple times` после первого фикса.

**Причина:** добавил `import { scoreTone }` сверху + оставил `export { scoreTone }` внизу.

**Фикс:** удалил re-export.

**Где:** `apps/web/src/components/ScoreGauge.tsx`

---

### 5. LLM выдумывает варианты enum (`rental_agreement`, `rent_agreement` и др.)
**Симптом:** zod-валидация падала на каждом новом «креативе» Llama, документ → status=error.

**Фикс:** `coerceEnum()` с тройным каскадом:
1. exact match,
2. alias map (RU/EN-варианты),
3. substring против stem'ов enum-значений,
4. fallback на безопасный дефолт (`other`/`neutral`/`negotiate`/`info`) — никогда не падает.

Аналогично для `risk_level`, `risk_category`, `protected_role`, `verdict`.

**Где:** `apps/api/src/ai/groq-analyzer.service.ts`

---

### 6. Двухстадийный AI-вызов превышал лимит Groq
**Симптом:** на договорах от 18 КБ — HTTP 413 «Request too large for model `llama-3.3-70b-versatile` … Limit 12000».

**Фикс:** убран отдельный reasoning-шаг — чек-лист встроен в один system-prompt. Документ обрезается до 30K символов. Добавлен retry с backoff на 429/413, парсит `retry in Ns` из ответа.

**Где:** `apps/api/src/ai/groq-analyzer.service.ts`

---

### 7. `@fastify/multipart` несовместим с Nest 10
**Симптом:** `FST_ERR_PLUGIN_VERSION_MISMATCH: expected '5.x' fastify version, '4.28.1' is installed`.

**Фикс:** downgrade `@fastify/multipart` `^9.0.1` → `^8.3.0` (последняя совместимая с Fastify 4).

**Где:** `apps/api/package.json`

---

### 8. NestJS DI не работал с `tsx` (Cannot read 'getById' of undefined)
**Симптом:** все controllers падали с этой ошибкой при первом запросе.

**Причина:** `tsx` использует esbuild → не эмитит decorator metadata, без которой NestJS DI не разрешает зависимости.

**Фикс:** заменил `tsx watch` на `tsc-watch --onSuccess "node --enable-source-maps dist/main.js"`.

**Где:** `apps/api/package.json`

---

### 9. `@react-pdf/renderer` — `ERR_REQUIRE_ESM` в CommonJS NestJS
**Симптом:** PDF-эндпоинт падал при первом обращении.

**Фикс:** dynamic `await import(...)` вместо top-level. Singleton-кэш модуля.

**Где:** `apps/api/src/documents/pdf-report.service.ts`

---

### 10. `shared` пакет ESM ломал резолв в CJS API
**Симптом:** `ERR_PACKAGE_PATH_NOT_EXPORTED: No "exports" main defined`.

**Фикс:** `packages/shared` перевёл на CJS (`module: CommonJS`, без `"type": "module"`, classic `main`/`types` без `exports`-поля). Next.js всё равно нормально проглатывает через `transpilePackages`.

**Где:** `packages/shared/package.json`, `tsconfig.json`

---

## 🎨 UX-улучшения

### 11. Mock-анализатор оставлял `suggested_fix`/`negotiation_email`/`monetary_impact` пустыми
Пользователь без LLM-ключа видел половину UI пустой. Теперь каждое из 8 правил mock содержит готовый рерайт пункта в юридическом стиле, готовое деловое письмо контрагенту и оценку в рублях.

### 12. Чат без LLM-ключа отвечал «AI-чат недоступен»
Теперь `mockReply()` отвечает осмысленно на типовые вопросы (риски/оплата/расторжение/«можно подписать») по эвристике на тексте документа. Стримит по словам для UX-feel реального LLM.

### 13. Календарь дат: `renewalDate = null` на mock'е
Mock редко заполнял `key_terms.duration` в распознаваемой форме. Теперь `extractRenewalDate` фоллбэчится на сырой текст документа (первые 5K символов) — ловит «12 месяцев», «до 20 ноября 2026», ISO-даты, DD.MM.YYYY.

### 14. UploadForm показывал красную плашку при превышении лимита
Превращено в полноценный модал с прогресс-баром использования, двумя планами и one-click апгрейдом.

### 15. Действия без feedback'а
Все действия (поделиться, апгрейд, ошибки upload'а) теперь дают toast-уведомление вместо `alert()` или тишины.

### 16. Mobile-навигация не работала
Все nav-линки были `hidden sm:inline`. Теперь — burger-меню с drawer'ом, авторизация и информация о тарифе тоже доступны на мобиле.

### 17. Календарь не показывался для анонимов
Гейт по `RequireUserGuard` возвращал 401 → страница ломалась. Теперь на `/calendar` для анонима показывается «Войдите чтобы увидеть».

---

## ✨ Новые фичи (стабилизация → +фичи на превосходство)

- **OCR** для изображений через Tesseract.js (rus+eng) — закрывает FR-001 из ТЗ.
- **Public sharing**: одна кнопка → токенизированная ссылка → любой увидит отчёт без логина (read-only).
- **AI-чат с документом**: SSE-стрим прямо в floating-panel.
- **PDF-экспорт** отчёта (`@react-pdf/renderer`, динамический импорт).
- **Сравнение версий** (`/compare`): word-level diff + AI-оценка каждой значимой правки.
- **Контрактный календарь**: AI-извлечённые даты renewal, цветовая раскраска по «сколько дней осталось».
- **Библиотека шаблонов** (`/templates`): 10 типовых договоров (приложение Б из ТЗ).
- **Command palette** (⌘/Ctrl + K): мгновенная навигация ко всем разделам.
- **Анимированная статистика** на лендинге (IntersectionObserver + easeOutCubic).
- **Отзывы** (3 шт.) на лендинге.
- **Toast-система** в `ToastProvider` через React Context.
- **Auth magic-link** с dev-fallback'ом (ссылка в консоль вместо email).
- **Stripe Checkout scaffold** + webhook handler (test-mode, `dev_mock` fallback без ключа).
- **Mock-режим как первоклассный гражданин**: всё работает без API-ключей, ровно так же выглядит.

---

## Что НЕ починено / отложено

- **Реальный SMTP для email magic-link** — нужен Resend / SES / SMTP-аккаунт.
- **Реальный Stripe прод** — нужен Stripe-аккаунт + price-IDs.
- **Email-напоминания** о renewal-датах из календаря — нужен cron / scheduled task.
- **Browser extension** для анализа договоров в Gmail/DocuSign — отдельный проект.
- **Многоязычность** UI (сейчас только русский) — i18n не подключали.
- **Drafting**: генерация договора с нуля по чек-листу — отдельная фича.

---

Итого за сессию: **10 коммитов**, ~5000 строк кода, 17 фиксов, 14 новых пользовательских фич.

---

## Итерация «production-ready для GitHub»

### 18. PDF 403 показывал голый JSON в браузере
Прямой `<a href="/api/.../report.pdf">` при чужом документе возвращал `{message:"Not your document",error:"Forbidden"}` — выглядело как баг.

**Фикс:** Next-роут `/documents/[id]/report.pdf` проксирует с cookie, при 403/404 редиректит на `/documents/[id]?pdf_error=403` — страница показывает toast с понятным сообщением.

### 19. Templates были декоративными
Карточки не вели никуда, под ними была заглушка «скачивание в разработке».

**Фикс:**
- Список шаблонов вынесен в `lib/templates.ts`, каждый содержит полный учебный текст договора с типовыми проблемами
- `/templates/[slug]` — детальная страница с предпросмотром текста и кнопкой «Проанализировать шаблон»
- Кнопка реально вызывает upload с этим текстом → редирект на отчёт. Никаких заглушек.

### 20. Фейковые stats / testimonials / company logos на лендинге
«12 450+ договоров проанализировано», отзывы Анны/Виктора/Дарьи, логотипы «Yandex Tinkoff Skyeng» — всё это было обманом перед запуском.

**Фикс:** удалено целиком, удалён и неиспользуемый `AnimatedCounter` компонент. Лендинг чище, ничего не обещает того чего нет.

### 21. Footer-линки `/privacy` и `/terms` вели в 404
**Фикс:** написал полноценные страницы Privacy Policy и Terms of Service с реальным содержанием (GDPR-совместимая политика, дисклеймер «это не юр-консультация», ограничение ответственности).

### 22. Не хватало MIT LICENSE, CONTRIBUTING.md, .nvmrc
**Фикс:** добавлены все три. README переписан под GitHub-аудиторию (badges, quick start за 60 сек, ссылки на CONTRIBUTING и BUGS_FIXED).

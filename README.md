# ContractLens AI

AI-ассистент для анализа юридических документов. Загружаешь договор — получаешь отчёт с рисками, объяснениями простым языком и скор-картой 0–100.

## Структура

```
apps/
  api/      — NestJS бэкенд (Prisma + SQLite на старте, PostgreSQL на проде)
  web/      — Next.js 14 фронтенд (Tailwind + shadcn/ui)
packages/
  shared/   — общие типы и схемы (TypeScript + zod)
```

## Быстрый старт

```bash
npm install
npm run db:migrate
npm run dev
```

- API: http://localhost:3001
- Web: http://localhost:3000

## Текущий статус (MVP)

- [x] Скелет монорепо
- [ ] Загрузка документов (PDF/DOCX/TXT)
- [ ] AI-анализ (mock → Claude)
- [ ] Отчёт с рисками
- [ ] Auth (NextAuth)
- [ ] Биллинг (Stripe)

См. [ТЗ v1.0](../Users/Arteik/Downloads/ContractLens_AI_TZ_v1.md).

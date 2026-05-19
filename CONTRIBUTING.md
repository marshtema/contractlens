# Contributing to ContractLens AI

Спасибо за интерес. Любой PR приветствуется, особенно по этим направлениям:

- Улучшение AI-промптов (расширение чек-листа в `apps/api/src/ai/groq-analyzer.service.ts`)
- Новые правила для mock-анализатора в `apps/api/src/ai/mock-ai-analyzer.service.ts`
- Дополнительные шаблоны в `apps/web/src/lib/templates.ts`
- UI-полировка, доступность, мобильная адаптация
- Реальные интеграции: SMTP для magic-link, Stripe webhook signing, Azure Document Intelligence для OCR

## Quick start

```bash
git clone <repo-url>
cd contractlens
npm install
cp apps/api/.env.example apps/api/.env   # значения по умолчанию работают
npm --workspace @contractlens/api run db:migrate
npm run dev
```

Откройте http://localhost:3000.

## Структура коммитов

Используем conventional-commits-стиль:

- `feat:` новая фича
- `fix:` исправление бага
- `docs:` документация
- `refactor:` рефакторинг без изменения поведения
- `chore:` инфраструктурные / зависимостные правки

## Перед PR

1. `npm run build` — проходит без ошибок
2. `npx tsc --noEmit -p apps/api/tsconfig.json` — type-clean
3. `npx tsc --noEmit -p apps/web/tsconfig.json` — type-clean
4. Если меняли prisma/schema.prisma — добавлен `prisma db push` или migration

## Архитектура

См. секцию «Архитектурные решения» в [README.md](./README.md).

Ключевая идея: всё, что зависит от внешних сервисов (LLM, payments, email),
имеет mock-реализацию первым классом. PR не должен ломать запуск без
API-ключей.

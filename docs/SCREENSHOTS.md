# Как сделать скриншоты для README

Чтобы README на GitHub выглядел как настоящий продукт — нужны живые скриншоты или GIF. Здесь — инструкция как их сделать руками за 5 минут.

## Список нужных кадров

| Файл | Что показать | Размер |
|------|--------------|--------|
| `docs/screens/01-landing.png` | главная страница (hero + drag-and-drop) | 1600×900 |
| `docs/screens/02-report.png` | отчёт с подсветкой рисков (split-view) | 1600×900 |
| `docs/screens/03-risk-card.png` | развёрнутая риск-карточка с табами «Готовая правка» / «Письмо» | 1600×800 |
| `docs/screens/04-chat.png` | открытый AI-чат | 1600×900 |
| `docs/screens/05-compare.png` | страница сравнения версий с цветным diff | 1600×900 |
| `docs/screens/06-templates.png` | библиотека шаблонов | 1600×900 |
| `docs/screens/07-calendar.png` | контрактный календарь с подсветкой дедлайнов | 1600×900 |

## Как делать

1. Запустите проект: `npm run dev`
2. Откройте http://localhost:3000 в Chrome
3. Загрузите тестовый договор (через UI или возьмите готовый шаблон с `/templates/nda-bilateral` → «Проанализировать»)
4. F12 → «Toggle device toolbar» → задайте 1600×900
5. F12 → ⋮ → «Capture screenshot» / «Capture full size screenshot»
6. Сохраните в `docs/screens/` под соответствующим именем
7. Commit + push:
   ```
   git add docs/screens/
   git commit -m "docs: add screenshots"
   git push
   ```

## Как сделать GIF

Бесплатно через [ScreenToGif](https://www.screentogif.com/) (Windows) или [Kap](https://getkap.co/) (mac).

1. Запишите 5–10 сек: drag-and-drop файла → появление отчёта
2. Сохраните в `docs/screens/demo.gif`
3. Замените в README placeholder на:
   ```markdown
   ![demo](docs/screens/demo.gif)
   ```

Цельтесь в **<3 МБ** для GIF — иначе долго грузится в README.

## Проще: одна команда через Playwright (опционально)

Если установите Playwright, можно автоматизировать:

```bash
npm install -D playwright
npx playwright install chromium
```

Дальше — `node docs/take-screenshots.js` (скрипт нужно написать; сейчас не приоритет).

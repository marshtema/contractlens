# Как сделать красивую главную страницу GitHub (марштема.github.io)

GitHub показывает специальный README на главной странице вашего профиля
https://github.com/marshtema если у вас есть **репозиторий с таким же именем
как ваш ник** — `marshtema/marshtema`.

## Шаг 1: создайте репозиторий

1. https://github.com/new
2. **Repository name:** `marshtema` (точно так же как ваш ник)
3. **Public** (важно — на private не работает)
4. ✅ Поставьте галочку «Add a README file»
5. **Create repository**

GitHub автоматически покажет подсказку «🎉 You found a secret! Choose a profile README».

## Шаг 2: вставьте этот README

Откройте созданный файл README.md в репозитории `marshtema/marshtema` → ✏️ Edit → вставьте содержимое из файла [`profile-readme.md`](./profile-readme.md) (в этой же папке) → Commit changes.

Откройте https://github.com/marshtema — увидите красивую главную страницу.

## Шаг 3 (опционально): pin репозиториев

На странице профиля https://github.com/marshtema:
1. Раздел «Popular repositories» справа → **Customize your pins**
2. Выберите `contractlens` и другие — они будут показаны крупными карточками

## Подсказки

- Profile README поддерживает **Markdown + HTML + SVG**
- Можно вставлять [shields.io](https://shields.io) badges
- Можно вставлять [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) для динамики
- На профиле можно видеть зелёные квадратики активности — они автоматически

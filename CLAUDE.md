# OKTTA — инструкция для Claude

Сайт студии OKTTA. Слева сцена с предметами, которые плавают и сталкиваются (Matter.js), справа контент с плавным скроллом (Lenis). Как запускать и что где лежит, описано в README.md.

Пользователь — дизайнер, не разработчик. Объясняй простыми словами и сам выполняй команды.

## Ссылки

- Опубликованный сайт: https://p4rzifalus.github.io/oktta/
- Репозиторий: https://github.com/p4rzifalus/oktta
- Локально: http://localhost:5173 (превью «site» из `.claude/launch.json` или `npm run dev`)

## Устройство

- React + TypeScript + Vite. Сборка: `tsc -b && vite build`, поэтому ошибки типов ломают сборку и публикацию. Перед коммитом проверяй `npm run build`.
- Публикация: после `git push` в `main` GitHub Actions (`.github/workflows/deploy.yml`) запускает `npm run build:pages` и выкладывает `dist` на Pages. Режим `pages` ставит `base: '/oktta/'` в `vite.config.ts`, потому что сайт живёт в подпапке.
- `dist/` и `tsconfig.tsbuildinfo` — результаты сборки, в git не попадают.
- Тонкая настройка сцены — только в `src/physics.config.ts`. Это «пульт» для пользователя: каждое число с пояснением на русском. Новые настройки добавляй туда же и в том же стиле, а не хардкодом в `src/physics/`.
- Тексты, направления и кейсы — в `src/content.ts`. Картинки и ролики — в `public/` (`objects`, `cases`, `clients`, `video`, `icons`), подключаются через `src/assets.ts`.
- Шрифт Pragmatica Next VF лежит в `src/fonts/` и встроен в сайт, установка на компьютер не нужна. У него две оси, насыщенность (`wght`) и ширина (`wdth`), и обе задаются явно через `font-variation-settings`: иначе Safari сжимает буквы. Почему так, объясняют комментарии в `src/styles.css`. Не упрощай эти правила.

## Проверка

- Проверяй в Chrome и Safari: Safari уже ломал шрифт.
- Отладка столкновений: `debug: true` в блоке `VIEW` файла `physics.config.ts` показывает формы поверх картинок. Перед коммитом верни `false`.

# OKTTA

Сайт студии: слева — сцена с предметами, которые плавают и сталкиваются
по-настоящему, справа — содержимое страницы с плавным скроллом.

## Как запустить у себя

```bash
npm install
npm run dev
```

Откроется на http://localhost:5173

Другие команды:

- `npm run build` — собрать сайт в папку `dist`
- `npm run preview` — посмотреть собранный сайт
- `npm run build:pages` — сборка для GitHub Pages (сайт лежит в подпапке)

## Что где лежит

| Файл | За что отвечает |
| --- | --- |
| [`src/physics.config.ts`](src/physics.config.ts) | Все настройки сцены: скорость дрейфа, вес и форма предметов, поведение курсора |
| [`src/content.ts`](src/content.ts) | Тексты, карточки направлений и проекты |
| [`src/styles.css`](src/styles.css) | Вся вёрстка: цвета, отступы, типографика, отклик на наведение |
| [`src/physics/scene.ts`](src/physics/scene.ts) | Физический движок сцены |
| [`src/physics/layout.ts`](src/physics/layout.ts) | Раскладка предметов: размеры, позиции, повороты |
| [`public/objects`](public/objects) | PNG предметов для сцены |
| [`public/cases`](public/cases), [`public/video`](public/video) | Обложки и ролики кейсов |

## Как поменять сцену

Откройте `src/physics.config.ts` — там всё разбито на блоки с пояснениями:
сила дрейфа, упругость, трение, радиус курсора, форма столкновений каждого
предмета. Чтобы увидеть эти формы поверх картинок, поставьте `debug: true`
в блоке `VIEW`.

Чтобы добавить предмет: положите PNG в `public/objects` и допишите блок в
список `OBJECTS`.

## Стек

React + TypeScript + Vite, физика — [Matter.js](https://brm.io/matter-js/),
плавный скролл — [Lenis](https://lenis.darkroom.engineering/),
шрифт — Pragmatica Next VF.

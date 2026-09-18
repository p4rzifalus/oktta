import { asset } from './assets'

/* Тексты и картинки из макета Figma. Правится здесь, без правки разметки. */

export type Case = {
  tag: string
  title: string
  description: string
  /** тёмная карточка — фотография во всю площадь, светлая — отдельной картинкой */
  theme: 'dark' | 'light'
  /** где лежит содержимое: сверху или снизу карточки */
  align: 'top' | 'bottom'
  /** фиксированная высота из макета, px (если не задана — тянется по колонке) */
  height?: number
  cover: string
  /** видео вместо картинки: играет само, без звука, по кругу */
  video?: string
}

export type Project = {
  tag: string
  title: string
  description: string
  /** с какой стороны стоит большая картинка */
  side: 'left' | 'right'
  /** что идёт первым в узкой половине: картинка или текст */
  order: 'image-first' | 'text-first'
  big: string
  small: string
  /** видео вместо большой картинки: играет само, без звука, по кругу */
  bigVideo?: string
}

export const HERO = {
  title: 'Создаём цифровую инфраструктуру для компаний, готовых меняться',
  subtitle:
    'Мы улучшаем клиентский опыт, проводим исследования, проектируем интерфейсы и повышаем бизнес-показатели',
  clientsLabel: 'Наши клиенты',
}

/** Ролик студии в карточке слева внизу.
 *  loop — беззвучная версия, она крутится на странице сама;
 *  full — версия со звуком, включается при развороте на весь экран. */
export const SHOWREEL = {
  loop: asset('/video/showreel-loop.mp4'),
  full: asset('/video/showreel.mp4'),
}

export const BANNER = 'ИИ-поиск для интернет-магазинов'

export const TABS = ['Проекты', 'Статьи']

/** 48 логотипов клиентов, выгруженных из макета */
export const CLIENT_LOGOS = Array.from(
  { length: 48 },
  (_, i) => asset(`/clients/logo-${String(i + 1).padStart(2, '0')}.png`),
)

/** левая колонка сетки направлений */
export const CASES_LEFT: Case[] = [
  {
    tag: 'Исследования',
    title: 'Исследования\nдля решения задач',
    description:
      'Проводим глубокий анализ рынка и пользователей, чтобы создавать эффективные цифровые решения, которые приносят результат',
    theme: 'dark',
    align: 'top',
    height: 610,
    cover: asset('/cases/case-research.jpg'),
  },
  {
    tag: 'Диджитал',
    title: 'Дизайн и продуктовая разработка',
    description:
      'Создаем сайты, онлайн-сервисы, интернет-магазины, мобильные приложения «под ключ»: от идеи до запуска и поддержки',
    theme: 'light',
    align: 'bottom',
    height: 558,
    cover: asset('/cases/case-digital.jpg'),
    video: asset('/video/muzroom.mp4'),
  },
]

/** правая колонка сетки направлений */
export const CASES_RIGHT: Case[] = [
  {
    tag: 'Брендинг',
    title: 'Брендинг в цифровом пространстве',
    description:
      'Разрабатываем уникальные бренды, которые выделяются в онлайн-мире: от стратегии до воплощения и поддержки',
    theme: 'light',
    align: 'top',
    cover: asset('/cases/case-branding.jpg'),
  },
  {
    tag: 'Собственные решения',
    title: 'Собственные цифровые продукты',
    description:
      'Разрабатываем инновационные решения и платформы, которые помогают бизнесам расти и адаптироваться в цифровом мире',
    theme: 'dark',
    align: 'bottom',
    height: 419,
    cover: asset('/cases/case-products.jpg'),
  },
]

/** проекты под переключателем */
export const PROJECTS: Project[] = [
  {
    tag: 'Здоровые продукты',
    title: 'Секреты Природы',
    description:
      'Создаем сайты, онлайн-сервисы, интернет-магазины, мобильные приложения «под ключ»: от идеи до запуска и поддержки',
    side: 'left',
    order: 'image-first',
    big: asset('/cases/p1-secrets-big.jpg'),
    small: asset('/cases/p1-secrets-small.jpg'),
  },
  {
    tag: 'Духовые инструменты',
    title: 'Ателье Гончарова',
    description:
      'Создаем сайты, онлайн-сервисы, интернет-магазины, мобильные приложения «под ключ»: от идеи до запуска и поддержки',
    side: 'right',
    order: 'text-first',
    big: asset('/cases/p2-atelier-big.jpg'),
    small: asset('/cases/p2-atelier-small.jpg'),
    bigVideo: asset('/video/atelier.mp4'),
  },
  {
    tag: 'Музыкальные инструменты',
    title: 'Музрум',
    description:
      'Музрум – интернет-магазин клавишных и ударных инструментов с по-настоящему человеческим подходом',
    side: 'left',
    order: 'text-first',
    big: asset('/cases/p3-muzroom-big.jpg'),
    small: asset('/cases/p3-muzroom-small.jpg'),
    bigVideo: asset('/video/muzroom.mp4'),
  },
  {
    tag: 'ИИ-поиск',
    title: 'Реком+',
    description:
      'Повышайте конверсию и средний чек с помощью интеллектуального поиска и рекомендаций, работающих как живой консультант',
    side: 'right',
    order: 'image-first',
    big: asset('/cases/p4-rekom-big.jpg'),
    small: asset('/cases/p4-rekom-small.jpg'),
  },
  {
    tag: 'Ювелирная студия',
    title: 'Diamondlake',
    description: 'Форма как отражение – типографика как опора',
    side: 'left',
    order: 'image-first',
    big: asset('/cases/p5-diamond-big.jpg'),
    small: asset('/cases/p5-diamond-small.jpg'),
  },
]

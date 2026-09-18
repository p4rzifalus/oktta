import { useEffect, useRef, useState } from 'react'
import { asset } from './assets'
import PhysicsStage, { INTRO_HOLD, INTRO_SHRINK } from './PhysicsStage'
import { useLenis } from './useLenis'
import { useReveal } from './useReveal'
import {
  BANNER, CASES_LEFT, CASES_RIGHT, CLIENT_LOGOS, HERO, PROJECTS, SHOWREEL, TABS,
  type Case, type Project,
} from './content'

/**
 * Содержимое слота: если задано видео — оно, иначе картинка.
 * Видео в карточках играет само, без звука и по кругу — как фоновая анимация.
 */
function Media({ src, video }: { src: string; video?: string }) {
  if (video) {
    return (
      <video
        className="media"
        src={video}
        poster={src}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    )
  }
  return <img className="media" src={src} alt="" />
}

/**
 * Ролик студии в левом нижнем углу: крутится сам по себе без звука,
 * по клику раскрывается на весь экран и включает звук.
 *
 * Разворот сделан своими силами, а не через нативный полноэкранный режим:
 * его запрещают встроенные окна предпросмотра, и тогда клик не делал бы ничего.
 */
function Showreel() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [expanded, setExpanded] = useState(false)

  // ролик всегда должен крутиться: браузер ставит видео на паузу,
  // пока вкладка в фоне, поэтому при возвращении запускаем его снова
  useEffect(() => {
    const resume = () => {
      const video = videoRef.current
      if (!document.hidden && video?.paused) void video.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('focus', resume)
    return () => {
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('focus', resume)
    }
  }, [])

  // выход по Escape
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  // на весь экран — звук и полная версия; обратно — снова беззвучная
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const at = video.currentTime
    video.src = expanded ? SHOWREEL.full : SHOWREEL.loop
    video.muted = !expanded
    video.currentTime = at
    void video.play().catch(() => {})
  }, [expanded])

  return (
    <div className={`showreel ${expanded ? 'showreel--expanded' : ''}`}>
      <button
        className="showreel__screen"
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? 'Свернуть ролик' : 'Развернуть ролик на весь экран'}
      >
        <video
          className="media"
          ref={videoRef}
          src={SHOWREEL.loop}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {!expanded && <img className="showreel__play" src={asset('/icons/play.svg')} alt="" />}
      </button>
    </div>
  )
}

function ProjectCard({ item }: { item: Project }) {
  // узкая половина карточки: картинка и текстовый блок, порядок задан в макете
  const side = (
    <div className="project__side">
      {item.order === 'text-first' && (
        <div className="project__text">
          <span className="pill pill--light">{item.tag}</span>
          <div className="project__meta">
            <h3 className="project__title">{item.title}</h3>
            <p className="project__desc">{item.description}</p>
          </div>
        </div>
      )}
      <div className="project__thumb">
        <Media src={item.small} />
      </div>
      {item.order === 'image-first' && (
        <div className="project__text">
          <span className="pill pill--light">{item.tag}</span>
          <div className="project__meta">
            <h3 className="project__title">{item.title}</h3>
            <p className="project__desc">{item.description}</p>
          </div>
        </div>
      )}
    </div>
  )

  const big = (
    <div className="project__big">
      <Media src={item.big} video={item.bigVideo} />
    </div>
  )

  return (
    <a className="project reveal" href="#project">
      <div className="project__row">
        {item.side === 'left' ? big : side}
        {item.side === 'left' ? side : big}
      </div>
      <span className="project__arrow">
        <img src={asset('/icons/arrow-right-dark.svg')} alt="" />
      </span>
    </a>
  )
}

function CaseCard({ item }: { item: Case }) {
  const dark = item.theme === 'dark'
  const style = item.height ? { height: `${item.height}px`, flex: 'none' as const } : undefined

  return (
    <a
      href="#case"
      className={[
        'card',
        'reveal',
        dark ? 'card--dark' : 'card--light',
        dark ? 'card--cover' : '',
        item.align === 'bottom' ? 'card--bottom' : '',
        item.height ? '' : 'card--grow',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {/* у тёмных карточек фотография лежит фоном под затемнением */}
      {dark && (
        <div className="card__bg">
          <Media src={item.cover} video={item.video} />
        </div>
      )}

      {/* у светлых карточек с содержимым внизу картинка идёт первой */}
      {!dark && item.align === 'bottom' && (
        <div className="card__image">
          <Media src={item.cover} video={item.video} />
        </div>
      )}

      <div className="card__body">
        <div className="card__top">
          <span className={`pill ${dark ? 'pill--glass' : 'pill--light'}`}>{item.tag}</span>
          <span className={`card__arrow ${dark ? 'card__arrow--glass' : 'card__arrow--light'}`}>
            <img src={dark ? asset('/icons/arrow-right-light.svg') : asset('/icons/arrow-right-dark.svg')} alt="" />
          </span>
        </div>
        <div className="card__text">
          <h3 className="card__title">{item.title}</h3>
          <p className="card__desc">{item.description}</p>
        </div>
      </div>

      {!dark && item.align === 'top' && (
        <div className="card__image">
          <Media src={item.cover} video={item.video} />
        </div>
      )}
    </a>
  )
}

export default function App() {
  const wrapperRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)
  // пока идёт вступление, под сценой лежит белый лист — это и есть заставка
  const [intro, setIntro] = useState(true)

  useLenis(wrapperRef, contentRef)
  // список проектов пересобирается при смене вкладки — наблюдение запускаем заново
  useReveal(wrapperRef, [activeTab])

  return (
    <div className="page">
      {intro && (
        <div
          className="intro"
          style={{
            animationDelay: `${INTRO_HOLD}ms`,
            animationDuration: `${Math.round(INTRO_SHRINK * 0.8)}ms`,
          }}
        />
      )}

      <header className="header">
        <a className="header__logo" href="#top">
          <img src={asset('/icons/logo-oktta.svg')} alt="OKTTA" />
        </a>

        <button className="header__menu pill pill--dark" type="button">
          <img className="pill__icon" src={asset('/icons/menu.svg')} alt="" />
          Меню
        </button>

        <div className="header__actions">
          <a className="pill pill--dark" href="#pdf">
            <img className="pill__icon" src={asset('/icons/eye.svg')} alt="" />
            pdf
          </a>
          <a className="pill pill--accent" href="#start">
            Начать проект
          </a>
        </div>
      </header>

      <aside className="stage">
        <PhysicsStage onSettled={() => setIntro(false)} />
        <Showreel />
      </aside>

      <main className="scroller" ref={wrapperRef}>
        <div className="scroller__inner" ref={contentRef}>
          <section className="hero" id="top">
            <div className="hero__text">
              <h1 className="hero__title">{HERO.title}</h1>
              <p className="hero__subtitle">{HERO.subtitle}</p>
            </div>

            <div className="clients">
              <p className="clients__label">{HERO.clientsLabel}</p>
              <div className="clients__track">
                {/* список продублирован — чтобы лента прокручивалась без стыка */}
                <div className="clients__row">
                  {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((src, i) => (
                    <img className="clients__logo" key={`${src}-${i}`} src={src} alt="" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <a className="banner reveal" href="#ai-search">
            {BANNER}
            <span className="banner__arrow">
              <img src={asset('/icons/arrow-right-dark.svg')} alt="" />
            </span>
          </a>

          <div className="cases">
            <div className="cases__col">
              {CASES_LEFT.map((item) => <CaseCard key={item.tag} item={item} />)}
            </div>
            <div className="cases__col">
              {CASES_RIGHT.map((item) => <CaseCard key={item.tag} item={item} />)}
            </div>
          </div>

          <div className="work">
            <div className="tabs">
              {TABS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={`tabs__item ${i === activeTab ? 'tabs__item--active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 0 &&
              PROJECTS.map((item) => <ProjectCard key={item.title} item={item} />)}
          </div>
        </div>
      </main>
    </div>
  )
}

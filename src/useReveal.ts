import { useEffect } from 'react'

/**
 * Плавное появление блоков при прокрутке.
 *
 * Наблюдает за элементами с классом `reveal` внутри правой колонки и, когда
 * они входят в видимую часть, добавляет `is-visible` — дальше всё делает CSS.
 * Каждый элемент появляется один раз и больше не отслеживается.
 */
export function useReveal(scroller: React.RefObject<HTMLElement>, deps: unknown[] = []) {
  useEffect(() => {
    const root = scroller.current
    if (!root) return

    const items = Array.from(root.querySelectorAll<HTMLElement>('.reveal'))
    if (!items.length) return

    const showAll = () => items.forEach((el) => el.classList.add('is-visible'))

    // кому мешает движение — тем сразу всё видно
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof IntersectionObserver === 'undefined') {
      showAll()
      return
    }

    let fired = false
    const observer = new IntersectionObserver(
      (entries) => {
        fired = true
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      },
      {
        // следим внутри правой колонки: прокручивается она, а не страница
        root,
        // блок появляется, когда заходит в кадр чуть выше нижнего края
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.08,
      },
    )

    items.forEach((el) => observer.observe(el))

    // страховка: если наблюдатель почему-то молчит, показываем содержимое
    const safety = window.setTimeout(() => {
      if (!fired) showAll()
    }, 2000)

    return () => {
      window.clearTimeout(safety)
      observer.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Плавный скролл для одного конкретного контейнера (правой колонки).
 *
 * wrapper — элемент, у которого есть свой скролл.
 * content — то, что внутри него двигается.
 * eventsTarget: window — колесо мыши ловится по всему окну,
 * поэтому скролл над левой колонкой тоже крутит правую.
 */
export function useLenis(
  wrapper: React.RefObject<HTMLElement>,
  content: React.RefObject<HTMLElement>,
) {
  useEffect(() => {
    const wrapperEl = wrapper.current
    const contentEl = content.current
    if (!wrapperEl || !contentEl) return

    const lenis = new Lenis({
      wrapper: wrapperEl,
      content: contentEl,
      eventsTarget: window,
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    })

    /* Lenis запоминает высоту содержимого при запуске. Пока грузятся шрифты
       и картинки, высота меняется — и если об этом не сообщить, колесо
       перестаёт прокручивать. Своего наблюдателя размеров здесь мало:
       он молчит, например, в фоновой вкладке, поэтому размеры ещё и
       периодически сверяются в кадре. */
    const refresh = () => lenis.resize()

    window.addEventListener('load', refresh)
    window.addEventListener('resize', refresh)
    document.fonts?.ready.then(refresh)

    let lastHeight = contentEl.scrollHeight
    let sinceCheck = 0
    let lastTime = performance.now()
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)

      sinceCheck += time - lastTime
      lastTime = time
      if (sinceCheck > 400) {
        sinceCheck = 0
        if (contentEl.scrollHeight !== lastHeight) {
          lastHeight = contentEl.scrollHeight
          refresh()
        }
      }

      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('load', refresh)
      window.removeEventListener('resize', refresh)
      lenis.destroy()
    }
  }, [wrapper, content])
}

import { useEffect, useRef, useState } from 'react'
import { asset } from './assets'
import { OBJECTS } from './physics.config'
import { createScene } from './physics/scene'

/** Сколько предметы парят на весь экран, прежде чем сцена сожмётся, мс */
export const INTRO_HOLD = 1100
/** Сколько длится сжатие сцены до левой колонки, мс */
export const INTRO_SHRINK = 1400

/**
 * Левая колонка: картинки из public/objects, которые сталкиваются и плавают.
 * Сами <img> — обычные элементы страницы, физика лишь двигает их transform,
 * поэтому картинки остаются резкими на любом экране.
 *
 * При первой загрузке сцена занимает весь экран — это и есть заставка.
 * Затем её границы съезжаются к левой колонке, и предметы перетекают туда
 * сами: сталкиваясь друг с другом, каждый со своей скоростью.
 */
export default function PhysicsStage({ onSettled }: { onSettled?: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const imageRefs = useRef<(HTMLImageElement | null)[]>([])
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const images = imageRefs.current.filter(Boolean) as HTMLImageElement[]
    let cancelled = false
    let destroy: (() => void) | undefined
    let shrinkTimer = 0
    let endTimer = 0

    // ждём, пока браузер узнает размеры картинок — из них считаются формы
    const loaded = images.map(
      (el) =>
        el.complete && el.naturalWidth
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              el.addEventListener('load', () => resolve(), { once: true })
              el.addEventListener('error', () => resolve(), { once: true })
            }),
    )

    void Promise.all(loaded).then(() => {
      if (cancelled) return
      // масштаб предметов считаем по колонке, даже пока сцена на весь экран
      destroy = createScene(root, images, () => {
        const stage = root.parentElement?.getBoundingClientRect()
        return stage
          ? { width: stage.width, height: stage.height }
          : { width: root.clientWidth, height: root.clientHeight }
      })

      // через паузу сцена съезжается к своему месту в колонке
      shrinkTimer = window.setTimeout(() => {
        if (cancelled) return
        const stage = root.parentElement?.getBoundingClientRect()
        if (stage) {
          root.style.transitionDuration = `${INTRO_SHRINK}ms`
          root.style.left = `${stage.left}px`
          root.style.top = `${stage.top}px`
          root.style.width = `${stage.width}px`
          root.style.height = `${stage.height}px`
        }

        endTimer = window.setTimeout(() => {
          if (cancelled) return
          // сцена на месте — возвращаем её в обычный поток страницы
          root.removeAttribute('style')
          setIntro(false)
          onSettled?.()
        }, INTRO_SHRINK)
      }, INTRO_HOLD)
    })

    return () => {
      cancelled = true
      window.clearTimeout(shrinkTimer)
      window.clearTimeout(endTimer)
      destroy?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`stage__world ${intro ? 'stage__world--intro' : ''}`} ref={rootRef}>
      {OBJECTS.map((object, i) => (
        <img
          key={object.src}
          ref={(el) => {
            imageRefs.current[i] = el
          }}
          className="stage__object"
          src={asset(`/objects/${object.src}`)}
          alt=""
          draggable={false}
        />
      ))}
    </div>
  )
}

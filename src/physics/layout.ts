import { OBJECTS, SPAWN, VIEW } from '../physics.config'

export type Size = { w: number; h: number }
export type Spot = { x: number; y: number }

/**
 * Раскладка предметов в сцене.
 *
 * Считается без случайностей: и заставка, и физическая сцена вызывают эти
 * функции и получают одни и те же точки и размеры. Благодаря этому предметы
 * с заставки перелетают ровно туда, где их подхватит физика.
 */

/** Логотип: он стоит прямо и появляется в середине экрана. */
const UPRIGHT = 'oktta.png'

/** Повторяемый «шум» в диапазоне -1..1: для одного индекса всегда одно число. */
function noise(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return (value - Math.floor(value)) * 2 - 1
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

/** Размер картинок до поправки на размер колонки. */
export function baseSizes(natural: Size[]): Size[] {
  return natural.map((size, i) => {
    const own = VIEW.scale * (OBJECTS[i]?.scale ?? 1)
    return { w: size.w * own, h: size.h * own }
  })
}

/**
 * Общий множитель размера для колонки: на узких экранах всё мельче, а если
 * предметов много и они перестают помещаться — масштаб ужимается ещё.
 */
export function fitScale(sizes: Size[], width: number, height: number) {
  const fit = Math.min(1, width / VIEW.referenceWidth)
  const covered = sizes.reduce((sum, s) => sum + s.w * fit * s.h * fit, 0)
  const room = width * height * VIEW.fill
  return fit * (covered > room ? Math.sqrt(room / covered) : 1)
}

/** Точки, в которых предметы стоят в момент запуска сцены. */
export function planSpots(sizes: Size[], width: number, height: number, scale: number): Spot[] {
  const count = sizes.length
  const columns = Math.max(1, Math.round(Math.sqrt((count * width) / Math.max(height, 1))))
  const rows = Math.ceil(count / columns)

  // ячейки перемешаны, но всегда одинаково
  const cells = Array.from({ length: columns * rows }, (_, n) => ({
    cx: ((n % columns) + 0.5) / columns,
    cy: (Math.floor(n / columns) + 0.5) / rows,
    key: noise(n, 7),
  }))
    .sort((a, b) => a.key - b.key)

  return sizes.map((size, i) => {
    // логотип всегда стартует в середине — и на заставке, и в сцене
    if (OBJECTS[i]?.src === UPRIGHT) {
      return { x: width / 2, y: height / 2 }
    }

    const cell = cells[i]
    const half = (Math.max(size.w, size.h) * scale) / 2 + 4
    return {
      x: clamp(
        width * (cell.cx + (noise(i, 1) * SPAWN.scatter) / columns),
        Math.min(half, width / 2),
        Math.max(width - half, width / 2),
      ),
      y: clamp(
        height * (cell.cy + (noise(i, 2) * SPAWN.scatter) / rows),
        Math.min(half, height / 2),
        Math.max(height - half, height / 2),
      ),
    }
  })
}

/** Начальные повороты предметов, радианы. */
export function planAngles(count: number): number[] {
  return Array.from({ length: count }, (_, i) =>
    OBJECTS[i]?.src === UPRIGHT ? 0 : (noise(i, 5) * SPAWN.angle * Math.PI) / 180,
  )
}

/**
 * Путь к файлу из папки public с учётом того, где лежит сайт.
 *
 * На GitHub Pages сайт живёт в подпапке (например, /oktta/), поэтому
 * абсолютные пути вида «/cases/...» там не работают. Эта функция
 * подставляет нужную основу, заданную в vite.config.ts.
 */
export function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}

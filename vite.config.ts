import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// на GitHub Pages сайт лежит в подпапке репозитория,
// локально — в корне; режим задаётся переменной окружения
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5173 },
  base: mode === 'pages' ? '/oktta/' : '/',
}))

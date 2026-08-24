import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/Miaoli/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        public: resolve(process.cwd(), 'index.html'),
        admin: resolve(process.cwd(), 'admin.html'),
        work: resolve(process.cwd(), 'work.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}))

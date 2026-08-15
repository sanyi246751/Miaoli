import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  base: '/Miaoli/',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        public: resolve(process.cwd(), 'index.html'),
        admin: resolve(process.cwd(), 'admin.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})

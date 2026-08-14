import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 測試 Git 自動偵測變更功能
// https://vitejs.dev/config/
export default defineConfig({
  base: '/Miaoli/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})

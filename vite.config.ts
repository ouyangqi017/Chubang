import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // 为了兼容某些直接使用 process.env 的库
    'process.env': process.env
  }
})
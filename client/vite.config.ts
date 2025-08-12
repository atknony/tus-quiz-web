import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    open: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

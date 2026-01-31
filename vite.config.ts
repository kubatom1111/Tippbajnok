import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Kikapcsoljuk a public mappa másolását, mert az jelenleg hibás (fájlként létezik) és megakasztja a buildet
  publicDir: false,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
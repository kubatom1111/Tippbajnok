import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Kikapcsoljuk a statikus fájlok másolását, mert külső képet használunk, 
  // és így elkerüljük a korábbi mappa-hibákat.
  publicDir: false,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
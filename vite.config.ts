import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // A 'resources' mappát használjuk a statikus fájlokhoz a 'public' helyett
  publicDir: 'resources',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
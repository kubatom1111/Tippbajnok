import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Tippbajnok/', // FONTOS: Ez kell, hogy betöltsön az oldal a GitHub-on!
})
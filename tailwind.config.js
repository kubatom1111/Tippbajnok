/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sport: {
          bg: '#0f111a',
          card: '#1e293b',
          text: '#e2e8f0',
          muted: '#94a3b8',
          primary: '#3b82f6', // blue-500
          secondary: '#10b981', // emerald-500
          accent: '#f97316', // orange-500
        }
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
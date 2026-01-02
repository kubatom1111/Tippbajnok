/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#dcfce7', // Halvány menta háttér
        surface: '#fffbeb', // Pasztell sárga kártyák
        primary: '#0f172a', // Sötétkék/Fekete szöveg és gombok
        secondary: '#14b8a6', // Teal akcentus
        input: '#cffafe', // Halvány kék input mezők
        accent: '#f59e0b', // Narancs/Arany
        muted: '#64748b', // Szürkés szöveg
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#137fec", // Neon Blue
        accent: "#39ff14",  // Neon Green
        background: {
          light: "#f6f7f8",
          dark: "#101922",  // Deep Dark Blue/Black
        },
        surface: {
          dark: "#1a2632",  // Card Background
          darker: "#15202b", // Header Background
        },
        border: {
          dark: "#233648",
        },
        input: {
          dark: "#233648",
        },
        text: {
          muted: "#92adc9",
        }
      },
      fontFamily: {
        sans: ['Spline Sans', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 10px rgba(57, 255, 20, 0.1)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#1B4F72', light: '#2E86C1', dark: '#154360' },
        accent:    { DEFAULT: '#148F77', light: '#1ABC9C' },
        danger:    { DEFAULT: '#E74C3C', light: '#FADBD8' },
        warning:   { DEFAULT: '#F39C12', light: '#FDEBD0' },
        success:   { DEFAULT: '#27AE60', light: '#D5F5E3' },
        sidebar:   { DEFAULT: '#0F2D48', hover: '#1B4F72' },
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF1493', // Pink color
          light: '#FF69B4',
          dark: '#C71585',
        }
      },
    },
  },
  plugins: [],
} 
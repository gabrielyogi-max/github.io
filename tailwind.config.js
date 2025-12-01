/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // Blue 500
        secondary: '#10B981', // Emerald 500
        dark: '#1F2937', // Gray 800
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

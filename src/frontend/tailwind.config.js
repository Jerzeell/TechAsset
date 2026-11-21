/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      colors: {
        darkBg: '#0b0f19',
        glassBg: 'rgba(17, 24, 39, 0.7)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        accent: {
          primary: '#6366f1', // Indigo
          success: '#10b981', // Emerald
          warning: '#f59e0b', // Amber
          danger: '#ef4444',  // Rose
          info: '#3b82f6'      // Blue
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

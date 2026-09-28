/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          slate: '#0f172a',
          navy: '#1e293b',
          blue: '#0284c7',
          lightblue: '#bae6fd',
          teal: '#0d9488',
          accent: '#f59e0b',
          bglight: '#f8fafc',
          card: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}

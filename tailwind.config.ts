// File: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00FF9D',
        dark: {
          100: '#1A1A1A',
          200: '#2A2A2A',
          300: '#3A3A3A',
        }
      }
    },
  },
  plugins: [],
}

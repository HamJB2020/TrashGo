/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bosque: {
          50: '#f0f7f2',
          100: '#d9ecdd',
          200: '#b3d9bb',
          300: '#80bf8c',
          400: '#4da65e',
          500: '#2d8a3e',
          600: '#1f6b2d',
          700: '#1a5324',
          800: '#163b1c',
          900: '#0d2411',
        },
        tierra: {
          50: '#fdf6f0',
          100: '#fae8d9',
          200: '#f4cfb0',
          300: '#ebaa7a',
          400: '#e0854a',
          500: '#d46a2a',
          600: '#b85422',
          700: '#92401c',
          800: '#75341a',
          900: '#5e2b18',
        },
        fondo: '#fcf9f6',
      },
    },
  },
  plugins: [],
};

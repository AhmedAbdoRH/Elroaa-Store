/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f5f6db',    // لون الخلفية الأساسي الكريمي
        secondary: '#4f170c',  // لون النصوص الداكنة
        accent: '#4B5E26',     // اللون الزيتي الأساسي للأزرار والهيدر
        'accent-dark': '#3B4B1B',
        'accent-light': '#f5f6db',
        olive: {
          50: '#f4f6ec',
          100: '#e6ebd4',
          200: '#ced8ad',
          300: '#afbf7e',
          400: '#8fa354',
          500: '#6f8737',
          600: '#586d2a',
          700: '#4B5E26',
          800: '#3B4B1B',
          900: '#2E3B16',
        },
        gold: '#CA8A04',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
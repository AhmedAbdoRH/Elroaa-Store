/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f5f6db',    // اللون الرئيسي
        secondary: '#4f170c',   // لون الكتابة الرئيسي
        accent: '#2d1711',     // لون الكتابة الفرعي
        'accent-light': '#f5f6db', // لون فرعي
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
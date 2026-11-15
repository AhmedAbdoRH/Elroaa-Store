/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F7F3E9',       // الخلفية الكريمية
        secondary: '#2B3318',     // الأخضر الزيتوني الأساسي
        accent: '#2B3318',        // الأخضر الزيتوني الأساسي
        'accent-dark': '#3A4522', // أخضر ثانوي
        'accent-light': '#F7F3E9',
        olive: {
          50: '#F7F3E9',
          100: '#EDE7D4',
          200: '#D9D2B8',
          600: '#3A4522',
          700: '#3A4522',
          800: '#2B3318',
          900: '#1F2610',
        },
        gold: '#D1A94F',          // ذهبي بارز
        'gold-light': '#E3C778',  // ذهبي فاتح للأزرار
        sale: '#B12704',          // أحمر للعروض والأسعار المخفضة
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
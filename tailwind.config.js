/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F4',
        ink: '#1E211F',
        muted: '#5E635F',
        line: '#E7E2D8',
        forest: {
          50: '#EEF4F0',
          100: '#D5E4DB',
          500: '#2F6B52',
          600: '#1F4D3A',
          700: '#173C2D',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(30, 33, 31, 0.04), 0 12px 32px -12px rgba(30, 33, 31, 0.12)',
      },
    },
  },
  plugins: [],
};

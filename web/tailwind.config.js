/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Main light brand
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          dark: '#8B86FF', // Main dark brand
        },
        surface: {
          light: '#FFFFFF',
          'light-subtle': '#F8FAFC',
          'light-border': '#E2E8F0',
          dark: '#0F172A',
          'dark-subtle': '#1E293B',
          'dark-border': '#334155',
        },
        match: {
          high: '#10B981',   // >= 70% Green
          medium: '#F59E0B', // 40-69% Amber
          low: '#EF4444',    // < 40% Red
        }
      },
      borderRadius: {
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};


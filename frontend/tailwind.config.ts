import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1rem',
      },
      colors: {
        brand: {
          DEFAULT: '#0ea5e9',
          dark: '#0369a1',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

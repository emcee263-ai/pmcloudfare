import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000', // page background
        surface: {
          DEFAULT: '#121212', // panels, product frames
          raised: '#1A1A1A', // inputs, hover states
        },
        mute: '#808080', // secondary text
        crimson: '#E50914', // drop and sale badges only
      },
      fontFamily: {
        display: ['var(--font-syne)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

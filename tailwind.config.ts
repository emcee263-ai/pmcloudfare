import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Every colour comes from a CSS variable (see globals.css), so the light and dark themes share one set of class names.
        // "white" means the main text colour and "black" means the page background colour, in either theme.
        white: 'rgb(var(--fg) / <alpha-value>)',
        black: 'rgb(var(--on-fg) / <alpha-value>)',
        ink: 'rgb(var(--bg) / <alpha-value>)', // page background
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)', // panels, product frames
          raised: 'rgb(var(--surface-raised) / <alpha-value>)', // inputs, hover states
        },
        mute: 'rgb(var(--mute) / <alpha-value>)', // secondary text
        crimson: '#E50914', // drop and sale badges only
      },
      fontFamily: {
        display: ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        sans: ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

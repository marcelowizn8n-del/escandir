import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1a365d', light: '#2a4a7f', dark: '#0f2440' },
        gold: { DEFAULT: '#c9a84c', light: '#d4bc6a', dark: '#b08f3a' },
        cream: { DEFAULT: '#faf8f3', dark: '#f5f0e8' },
        warm: '#f5f0e8',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        crimson: ['var(--font-crimson)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;

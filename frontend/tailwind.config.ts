import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      colors: {
        // Physical sampled palette from NutriDaily eco-packaging & fresh ingredients
        tebu: {
          50: '#FDFBF7',
          100: '#F7F4EE',
          200: '#EFEAE0',
          300: '#E5DFD5',
        },
        forest: {
          DEFAULT: '#2C4A3E',
          hover: '#243D33',
          active: '#1C3028',
          subtle: '#E8EFEA',
          border: '#3B6353',
        },
        terracotta: {
          DEFAULT: '#D96B43',
          hover: '#C25A34',
          active: '#AB4D29',
          subtle: '#FAF0EB',
          border: '#E88B68',
        },
        warm: {
          black: '#1A1310',
          dark: '#2A221E',
          neutral: '#453C36',
          muted: '#6E665E',
          stone: '#8C8276',
          border: '#DED8CE',
          surface: '#F4F0E8',
          card: '#FBF9F4',
        },
      },
      boxShadow: {
        // Single light source: overhead subtle natural down-shadow
        natural: '0 1px 3px 0 rgba(26, 19, 16, 0.05), 0 1px 2px -1px rgba(26, 19, 16, 0.05)',
        'natural-md': '0 4px 6px -1px rgba(26, 19, 16, 0.07), 0 2px 4px -2px rgba(26, 19, 16, 0.05)',
        'natural-lg': '0 10px 15px -3px rgba(26, 19, 16, 0.08), 0 4px 6px -4px rgba(26, 19, 16, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;

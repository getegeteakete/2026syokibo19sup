import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0faf4',
          100: '#e8f5ee',
          200: '#d1eadb',
          300: '#a8d5b8',
          400: '#74c69d',
          500: '#52b788',
          600: '#2d6a4f',
          700: '#245a42',
          800: '#1b3a28',
          900: '#122518',
          950: '#0a160e',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
        }
      },
      fontFamily: {
        sans: ['var(--font-noto)', 'Noto Sans JP', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

export default config;

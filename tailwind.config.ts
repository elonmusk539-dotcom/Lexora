import type { Config } from "tailwindcss";

const config: Config = {
  // Use class-based dark mode so toggling the `.dark` class updates Tailwind variants
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Ocean palette
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#0c4a6e',
        },
        coral: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Dark mode backgrounds
        night: {
          50: '#1a2e40',
          100: '#162739',
          200: '#132337',
          300: '#0f2133',
          400: '#0c1929',
          500: '#0a1520',
          600: '#081018',
          700: '#060c12',
          800: '#04080c',
          900: '#020406',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(8, 145, 178, 0.2)',
        'glow-lg': '0 0 30px rgba(8, 145, 178, 0.3)',
        'glow-coral': '0 0 20px rgba(249, 115, 22, 0.25)',
        'glow-dark': '0 0 25px rgba(34, 211, 238, 0.25)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(8, 145, 178, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(8, 145, 178, 0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
};

export default config;

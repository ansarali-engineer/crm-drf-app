/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
          hover: '#1e293b',
          active: '#1e293b',
          border: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px 0 rgb(15 23 42 / 0.04)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        'elevated': '0 10px 30px -5px rgb(15 23 42 / 0.15), 0 4px 10px -3px rgb(15 23 42 / 0.08)',
        'glow': '0 0 20px -2px rgb(37 99 235 / 0.35)',
        'glow-accent': '0 0 20px -2px rgb(16 185 129 / 0.35)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-subtle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f2f7f4',
          100: '#e2ede7',
          200: '#c5dcd0',
          300: '#9ec4b1',
          400: '#73a58e',
          500: '#528972',
          600: '#3d6e5a',
          700: '#325849',
          800: '#2a473c',
          900: '#233b32',
          950: '#11221c',
        },
        eucalyptus: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        warmivory: {
          50: '#fdfcf9',
          100: '#f9f6ef',
          200: '#f3eedf',
          300: '#e9e1c8',
          400: '#d9cbac',
          500: '#c2b08d',
        },
        lavender: {
          50: '#f8f6fc',
          100: '#f0ecf9',
          200: '#e3dcf4',
          300: '#cfc0eb',
          400: '#b49ddf',
          500: '#9877d0',
          600: '#8059bf',
          700: '#6c47a5',
          800: '#5a3d87',
          900: '#4b346e',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -1px rgba(20, 45, 35, 0.04), 0 1px 3px -1px rgba(20, 45, 35, 0.02)',
        'soft-md': '0 8px 24px -4px rgba(20, 45, 35, 0.06), 0 2px 6px -2px rgba(20, 45, 35, 0.03)',
        'soft-lg': '0 16px 36px -6px rgba(20, 45, 35, 0.08), 0 4px 12px -2px rgba(20, 45, 35, 0.03)',
        'soft-xl': '0 24px 48px -12px rgba(20, 45, 35, 0.12), 0 6px 16px -4px rgba(20, 45, 35, 0.04)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.25)',
        'glow-sage': '0 0 25px -4px rgba(61, 110, 90, 0.25)',
      }
    },
  },
  plugins: [],
}

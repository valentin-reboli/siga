/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta institucional ISCR
        navy: {
          50: '#f0f4fa',
          100: '#dde7f3',
          200: '#bccfe6',
          300: '#8eafd2',
          400: '#5d87b8',
          500: '#3d699f',
          600: '#2e5485',
          700: '#26446c',
          800: '#1b3158',
          900: '#0a2855', // azul principal del header del dashboard
          950: '#061a3a',
        },
        cruz: {
          DEFAULT: '#dc2626', // rojo de la cruz roja
          dark: '#b91c1c',
        },
        success: '#16a34a',
        warn:    '#d97706',
        danger:  '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 6px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

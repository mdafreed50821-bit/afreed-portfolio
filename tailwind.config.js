/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Deep night-flight graphite / navy base */
        hull: {
          950: '#05080C',
          900: '#080C12',
          850: '#0B1018',
          800: '#0F1620',
          750: '#141D29',
          700: '#1B2534',
          650: '#223040',
          600: '#27364A',
          500: '#38495F',
        },
        /* Instrument greys */
        steel: {
          500: '#4E6178',
          400: '#6D8098',
          300: '#93A5B8',
          200: '#B9C7D5',
        },
        chalk: {
          DEFAULT: '#E6EDF4',
          dim: '#C3D0DC',
        },
        /* SIGNATURE ACCENT — avionics teal */
        signal: {
          DEFAULT: '#3CC9D6',
          dim: '#1B7C86',
          deep: '#0B3A41',
        },
        /* SECONDARY — caution amber, used sparingly */
        caution: {
          DEFAULT: '#F0A93B',
          dim: '#7E561A',
        },
        alert: '#FF5C3E',
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Barlow', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        widest2: '0.24em',
      },
      transitionTimingFunction: {
        instrument: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'tick-drift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(4px)' },
        },
        'radar-sweep-cpu': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.25', transform: 'scale(0.7)' },
        },
        'scan-drift': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.8s ease-in-out infinite',
        'radar-sweep-cpu': 'radar-sweep-cpu 4s linear infinite',
      },
    },
  },
  plugins: [],
}

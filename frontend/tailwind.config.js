/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'work-sans': ['Work Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'roboto': ['Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'lexend-deca': ['Lexend Deca', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        garamond: ['EB Garamond', 'Georgia', 'serif'],
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        mirror: {
          void: '#000000',
          obsidian: '#0b0b0d',
          graphite: '#14141a',
          surface: '#181820',
          overlay: '#1f2230',
          gold: '#d6af36',
          'gold-soft': '#cba35d',
          'gold-deep': '#9c7c3c',
          ember: '#f06449',
          paradox: '#ae55ff',
          loop: '#f5a623',
          growth: '#4ed4a7',
          regression: '#f35d7f',
          breakthrough: '#ffd700',
          soft: '#3a8bff',
          direct: '#9c7c3c',
          playful: '#ae55ff',
          austere: '#c4c4cf',
          provocative: '#f06449',
          fog: '#e5e5e5',
          mist: '#c4c4cf',
          line: '#30303a',
        },
        gold: {
          DEFAULT: '#d6af36',
          soft: '#cba35d',
          dark: '#9c7c3c',
          deep: '#9c7c3c',
        },
      },
      boxShadow: {
        'mirror-soft': '0 24px 60px rgba(0, 0, 0, 0.65)',
        'mirror-inner': 'inset 0 0 30px rgba(255, 255, 255, 0.03)',
        'mirror-glow': '0 0 40px rgba(203, 163, 93, 0.45)',
        'mirror-glow-intense': '0 0 60px rgba(203, 163, 93, 0.65), 0 0 90px rgba(203, 163, 93, 0.3)',
      },
      animation: {
        shimmer: 'shimmer 8s linear infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        ripple: 'ripple 1s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.05' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.75' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(203, 163, 93, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(203, 163, 93, 0.6)' },
        },
      },
      backdropBlur: {
        mirror: '20px',
      },
      transitionTimingFunction: {
        'mirror': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      transitionDuration: {
        'mirror': '500ms',
        'mirror-fast': '300ms',
      },
    },
  },
  plugins: [],
}


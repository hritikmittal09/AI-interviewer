import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#080810',
          2: '#0f0f1a',
          3: '#161624',
        },
        surface: {
          DEFAULT: '#1a1a2e',
          2: '#21213a',
        },
        accent: {
          DEFAULT: '#7c3aed',
          2: '#8b5cf6',
          3: '#a78bfa',
          4: '#c4b5fd',
        },
        teal: {
          DEFAULT: '#0d9488',
          2: '#2dd4bf',
          3: '#5eead4',
        },
        border: {
          DEFAULT: 'rgba(139,92,246,0.12)',
          2: 'rgba(139,92,246,0.25)',
          3: 'rgba(139,92,246,0.4)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'mic-ring': 'micRing 1.5s ease-in-out infinite',
        'wave': 'wave 1s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        micRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.3)' },
          '50%': { boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
        },
        wave: {
          '0%, 100%': { height: '6px' },
          '50%': { height: '20px' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

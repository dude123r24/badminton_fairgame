import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
        neutral: {
          light: '#F8FAFC',
          DEFAULT: '#64748B',
        },
        primary: {
          DEFAULT: '#16A34A',
          dark: '#15803D',
        },
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'xs': ['clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)', { lineHeight: '1.4' }],
        'sm': ['clamp(0.8125rem, 0.77rem + 0.17vw, 0.875rem)', { lineHeight: '1.45' }],
        'base': ['clamp(0.875rem, 0.83rem + 0.2vw, 1rem)', { lineHeight: '1.5' }],
        'lg': ['clamp(1rem, 0.94rem + 0.25vw, 1.125rem)', { lineHeight: '1.4' }],
        'xl': ['clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)', { lineHeight: '1.35' }],
        '2xl': ['clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)', { lineHeight: '1.3' }],
        '3xl': ['clamp(1.5rem, 1.35rem + 0.6vw, 1.875rem)', { lineHeight: '1.25' }],
      },
      spacing: {
        1: '8px',
        2: '16px',
        3: '24px',
        4: '32px',
        5: '40px',
        6: '48px',
        8: '64px',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config

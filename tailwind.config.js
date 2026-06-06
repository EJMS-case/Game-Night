/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: '#6B2737',
        'burgundy-light': '#8A3447',
        forest: '#1B4332',
        'forest-light': '#2D6A4F',
        gold: '#B8960C',
        'gold-light': '#D4B125',
        'gold-dim': '#8A7109',
        ivory: '#F5F0E8',
        'ivory-dim': '#C9C2B5',
        charcoal: '#1A1A1F',
        'charcoal-light': '#26262E',
        'charcoal-card': '#22222A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.45)',
        'card-lg': '0 12px 48px rgba(0, 0, 0, 0.55)',
        'gold-glow': '0 0 24px rgba(184, 150, 12, 0.35)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'score-flash': {
          '0%': { backgroundColor: 'rgba(184, 150, 12, 0.45)' },
          '100%': { backgroundColor: 'rgba(184, 150, 12, 0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(184, 150, 12, 0.3)' },
          '50%': { boxShadow: '0 0 22px rgba(184, 150, 12, 0.6)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.45s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
        'score-flash': 'score-flash 0.7s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'confetti-fall': 'confetti-fall 3s linear forwards',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

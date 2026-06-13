/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: '#7A2E40',
        'burgundy-light': '#94384E',
        forest: '#1B6A50',
        'forest-light': '#22835F',
        // "gold" kept as the token name to avoid churn, but it is now a clean emerald accent.
        gold: '#147A5C',
        'gold-light': '#18906C',
        'gold-dim': '#0E5D45',
        ivory: '#23272E', // primary ink (dark text on light surfaces)
        'ivory-dim': '#6B7280', // muted text
        charcoal: '#C7CCD4', // light gray used for low-opacity tints (bg-charcoal/xx)
        'charcoal-light': '#F0EFEA',
        'charcoal-card': '#FFFFFF', // solid surfaces: cards, sticky headers, nav
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 8px 24px rgba(16, 24, 40, 0.08)',
        'card-lg': '0 12px 40px rgba(16, 24, 40, 0.16)',
        'gold-glow': '0 6px 20px rgba(20, 122, 92, 0.25)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'score-flash': {
          '0%': { backgroundColor: 'rgba(20, 122, 92, 0.22)' },
          '100%': { backgroundColor: 'rgba(20, 122, 92, 0)' },
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
          '0%, 100%': { boxShadow: '0 0 6px rgba(20, 122, 92, 0.25)' },
          '50%': { boxShadow: '0 0 18px rgba(20, 122, 92, 0.5)' },
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

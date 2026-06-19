/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: '#f7f4ed',
        ink: '#1f1a14',
        'ink-soft': '#4a4238',
        'ink-mute': '#8a8070',
        rule: '#e0d8c8',
        accent: '#7a5c3c',
        'accent-light': '#b8976b',
        moss: '#4a5d45',
        'moss-soft': '#7a9178',
        ochre: '#a67c52',
        'ochre-soft': '#c9a67e',
        night: '#15171a',
        'night-paper': '#1c1f23',
        'night-ink': '#e8e4d8',
        'night-rule': '#2f3338',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Noto Serif SC"', 'serif'],
        serif: ['"EB Garamond"', '"Noto Serif SC"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        cn: ['"Noto Serif SC"', '"EB Garamond"', 'serif'],
      },
      maxWidth: {
        column: '880px',
      },
      letterSpacing: {
        wider2: '0.18em',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
        450: '450ms',
      },
    },
  },
  plugins: [],
}

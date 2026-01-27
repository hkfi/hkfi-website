/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        text: 'var(--color-text)',
        background: 'var(--color-background)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        'notion-blue': 'var(--color-blue)',
        'notion-brown': 'var(--color-brown)',
        'notion-gray': 'var(--color-gray)',
        'notion-green': 'var(--color-green)',
        'notion-orange': 'var(--color-orange)',
        'notion-pink': 'var(--color-pink)',
        'notion-purple': 'var(--color-purple)',
        'notion-red': 'var(--color-red)',
        'notion-yellow': 'var(--color-yellow)',
        'notion-default': 'var(--color-default)'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards'
      }
    }
  },
  plugins: []
}

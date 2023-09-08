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
      }
    }
  },
  plugins: []
}

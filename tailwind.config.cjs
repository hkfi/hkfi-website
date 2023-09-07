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
        blue: 'var(--color-blue)',
        brown: 'var(--color-brown)',
        gray: 'var(--color-gray)',
        green: 'var(--color-green)',
        orange: 'var(--color-orange)',
        pink: 'var(--color-pink)',
        purple: 'var(--color-purple)',
        red: 'var(--color-red)',
        yellow: 'var(--color-yellow)',
        default: 'var(--color-default)'
      }
    }
  },
  plugins: []
}

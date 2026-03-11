import { defineConfig } from 'astro/config'

import tailwind from '@astrojs/tailwind'

import react from '@astrojs/react'

import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
  site: 'https://hkfi.dev',
  adapter: vercel(),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ja'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  redirects: {
    '/blog/1': '/blog'
  },
  integrations: [tailwind(), react()]
})

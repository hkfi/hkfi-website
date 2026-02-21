import { defineConfig } from 'astro/config'

import tailwind from '@astrojs/tailwind'

import react from '@astrojs/react'

import vercel from '@astrojs/vercel'

// https://astro.build/config
export default defineConfig({
  site: 'https://hkfi.dev',
  adapter: vercel(),
  redirects: {
    '/blog': '/blog/1',
    '/blog/tags': '/blog/1'
  },
  integrations: [tailwind(), react()]
})

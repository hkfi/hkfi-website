import { defineConfig } from 'astro/config'

import tailwind from '@astrojs/tailwind'

import react from '@astrojs/react'

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/blog': '/blog/1',
    '/blog/tags': '/blog/1'
  },
  integrations: [tailwind(), react()]
})

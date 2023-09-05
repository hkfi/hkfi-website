import { defineConfig } from 'astro/config'

import tailwind from '@astrojs/tailwind'

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/blog': '/blog/1'
  },
  integrations: [tailwind()]
})

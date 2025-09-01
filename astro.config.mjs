// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  // Site configuration for different deployment environments
  site: process.env.NODE_ENV === 'production'
    ? 'https://freeformathub.com'
    : undefined,

  // Use base path only for GitHub Pages, not for Coolify deployment
  base: process.env.DEPLOY_TARGET === 'github-pages' ? '/freeformathub' : undefined
});

// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Server output mode with Node.js adapter for API endpoints
  // Pages will be prerendered by default using the prerender directive
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),

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

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

  // GitHub Pages configuration
  site: process.env.NODE_ENV === 'production'
    ? 'https://yourusername.github.io/freeformathub'
    : undefined,

  base: '/freeformathub'
});

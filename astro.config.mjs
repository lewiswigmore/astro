// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://lewiswigmore.github.io',
  base: '/astro',
  integrations: [react(), mdx()],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom']
    }
  }
});
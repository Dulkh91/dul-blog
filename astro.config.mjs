// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

import alpinejs from '@astrojs/alpinejs';

// https://astro.build/config
export default defineConfig({
    prefetch: true,
    integrations: [react(), alpinejs()],
    vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    plugins: [tailwindcss()],
  },
});
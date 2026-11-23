// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from "@tailwindcss/vite";

import alpinejs from '@astrojs/alpinejs';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  prefetch: true,
  integrations: [react(), alpinejs()],

  vite: {
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  plugins: [tailwindcss()],

  // បំបែក Library ធំៗទៅជា File តូចៗដាច់ដោយឡែកពីគ្នា (Page ណាត្រូវការទើប Browser ទាញយក Page នោះ)៖
  build: {
      chunkSizeWarningLimit: 1000, // ដំឡើង limit ដល់ 1000 kB
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tiptap')) return 'tiptap';
              if (id.includes('antd')) return 'antd';
              if (id.includes('firebase')) return 'firebase';
              return 'vendor';
            }
          },
        },
      },
    },

},

  adapter: vercel(),
});
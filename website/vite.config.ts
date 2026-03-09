import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/react-gtfs-selector/',
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/sql.js/dist/sql-wasm-browser.wasm',
          dest: '.',
        },
      ],
    }),
  ],
});

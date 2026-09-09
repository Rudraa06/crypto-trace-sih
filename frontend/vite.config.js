import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy API calls to the backend during development so the browser never
    // sees a CORS preflight. The production build would sit behind a reverse
    // proxy doing the same thing.
    proxy: {
      '/api': {
        target: 'http://localhost:4001',
        timeout: 300000,
      },
      '/health': {
        target: 'http://localhost:4001',
        timeout: 300000,
      },
    },
  },
});

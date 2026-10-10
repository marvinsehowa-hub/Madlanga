import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages serves this project under /<repo>/, not at the domain root, so
 * asset URLs need that prefix. Locally it stays at "/" — hardcoding the repo
 * prefix would break `npm run dev`.
 *
 * Set BASE_PATH in CI (the workflow does); leave it unset everywhere else.
 */
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: { port: 5183, open: false },
  build: {
    // The register and video index are a megabyte of JSON by design; the
    // default 500 kB warning is just noise here.
    chunkSizeWarningLimit: 1500,
  },
});

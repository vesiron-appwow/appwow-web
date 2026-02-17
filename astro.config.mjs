// astro.config.mjs
// AppWow — VTL Evosystem Phase 2
// Cloudflare Pages deployment with server-side rendering
// Platform Interface Specification V1 — no direct D1 access from frontend

import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Server-side rendering via Cloudflare Pages Functions
  output: 'server',

  adapter: cloudflare({
    // Cloudflare Pages mode
    platformProxy: {
      enabled: true,
    },
  }),

  // No src/pages/api — all data calls go via vtl-platform-api Worker
  // This project contains zero backend routes

  vite: {
    // Ensure environment variables are correctly handled
    define: {},
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sites } from '@openai/sites-vite-plugin'
import { cloudflare } from '@cloudflare/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    sites(),
    cloudflare({
      inspectorPort: false,
      viteEnvironment: { name: 'server' },
      config: {
        main: './worker/index.js',
        compatibility_date: '2026-05-22',
        compatibility_flags: ['nodejs_compat'],
        assets: {
          binding: 'ASSETS',
          not_found_handling: 'single-page-application',
        },
      },
    })
  ],
})

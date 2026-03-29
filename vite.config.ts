
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  root: "client",
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // In development, proxy /api/* to the local Express server (port 5000)
      // or to wrangler dev (port 8787) when running `npm run wrangler:dev`
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Cloudflare Pages expects the output in dist/client
    outDir: "../dist/client",
    emptyOutDir: true,
  },
  define: {
    // Expose env vars to the client bundle (must be prefixed with VITE_)
    'import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID': JSON.stringify(
      process.env.VITE_GOOGLE_OAUTH_CLIENT_ID || ''
    ),
  },
})

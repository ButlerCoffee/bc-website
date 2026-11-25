import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Dev only: serves netlify/functions/*.mjs at /.netlify/functions/* so the
 * checkout works with `npm run dev` (no Netlify CLI needed). Secrets such as
 * STRIPE_SECRET_KEY come from .env.local (never committed).
 */
function netlifyFunctionsDev() {
  return {
    name: 'netlify-functions-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const m = req.url.match(/^\/\.netlify\/functions\/([a-z0-9-]+)(\?.*)?$/)
        if (!m) return next()
        try {
          const mod = await server.ssrLoadModule(`/netlify/functions/${m[1]}.mjs`)
          const chunks = []
          for await (const c of req) chunks.push(c)
          const request = new Request(`http://${req.headers.host}${req.url}`, {
            method: req.method,
            headers: req.headers,
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          })
          const response = await mod.default(request, {})
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          console.error('[functions]', err)
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'function_not_found' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose non-VITE_ vars (e.g. STRIPE_SECRET_KEY) to the dev functions only
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
  plugins: [
    react(),
    netlifyFunctionsDev(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Butler Coffee',
        short_name: 'Butler',
        description: 'Specialty coffee subscriptions for workspaces',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait',
        categories: ['food', 'shopping'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  }
})

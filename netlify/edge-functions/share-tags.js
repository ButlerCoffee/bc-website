/**
 * Link previews (WhatsApp, iMessage, LinkedIn, Slack…) and basic SEO.
 *
 * The site is a single-page app, so every URL serves the same index.html and
 * link-preview bots don't run JavaScript. This edge function rewrites the
 * <title>, description and Open Graph / Twitter tags in that HTML per page.
 * Product pages read their name, tagline and photo from the admin's
 * "Products" sheet; /og-image/<slug>.jpg serves that photo from our own domain.
 */

const SITE = 'Butler Coffee'
const ORIGIN = 'https://www.butler.coffee'   // canonical host for links and images
const API_FALLBACK = 'https://script.google.com/macros/s/AKfycbxtOnlGpNsZHyV9UeDbhEsoQEo_pooQ76T9q7Dfqazm6iD5Bf_DlnyZg6SRm0nYElAd/exec'
const DEFAULT_IMAGE = '/images/og-default.jpg'
const DEFAULT = {
  title: 'Butler Coffee — Specialty Coffee for Workspaces',
  description: 'Monthly specialty coffee subscriptions for workspaces, teams and armies of one. Delivered to your door.',
}

// Fixed pages. Anything not listed gets DEFAULT.
const PAGES = {
  '/subscriptions': { title: 'Coffee Subscriptions — Butler Coffee', description: 'Four ways to explore specialty coffee, delivered every month. Find the one that feels like you.' },
  '/store/coffee':  { title: 'Coffee by the Bag — Butler Coffee', description: 'Specialty coffee by the bag, no subscription needed.' },
  '/store/machines':      { title: 'Coffee Machines — Butler Coffee', description: 'Coffee machines for offices and workspaces, set up and supported by Butler Coffee.' },
  '/store/machines/jura': { title: 'Jura Professional Line — Butler Coffee', description: 'Jura professional bean-to-cup machines for offices.' },
  '/calculator':    { title: 'Coffee Calculator — Butler Coffee', description: 'How much coffee does your team need each month? Work it out in a few seconds.' },
  '/vs-pods':       { title: 'Specialty Coffee vs Pods — Butler Coffee', description: 'Why specialty beans beat capsules on taste, cost and waste.', image: '/images/vs-pods-hero.jpg' },
  '/about':         { title: 'About Us — Butler Coffee', description: 'Love what you do and have fun doing it. From Madrid, we serve coffee across the Iberian Peninsula and beyond.', image: '/images/about-team.jpg' },
  '/contact':       { title: "Let's talk — Butler Coffee", description: 'Questions about coffee, machines or your office? Get in touch.' },
  '/blog':          { title: 'Blog — Butler Coffee', description: 'Stories and tips from the Butler Coffee team.' },
}

let cache = { at: 0, rows: null }
async function products() {
  if (cache.rows && Date.now() - cache.at < 5 * 60 * 1000) return cache.rows
  const api = Netlify.env.get('VITE_BUTLER_API_URL') || API_FALLBACK
  const res = await fetch(`${api}?sheet=products`, { redirect: 'follow' })
  const json = await res.json()
  const rows = Array.isArray(json?.data) ? json.data : []
  cache = { at: Date.now(), rows }
  return rows
}

async function product(slug) {
  try {
    return (await products()).find(p => p.slug === slug && p.visible !== false) || null
  } catch { return null }
}

function driveId(url) {
  const m = String(url || '').match(/(?:id=|\/d\/)([\w-]{20,})/)
  return m ? m[1] : null
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const plain = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim()
const clip = (s, n = 200) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s)

function tags(meta, url) {
  const img = new URL(meta.image || DEFAULT_IMAGE, ORIGIN).href
  const canonical = ORIGIN + (url.pathname.replace(/\/+$/, '') || '/')
  const t = esc(meta.title), d = esc(meta.description)
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:type" content="${meta.type || 'website'}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta property="og:image:alt" content="${t}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta property="og:locale:alternate" content="es_ES" />`,
    ...(meta.price ? [
      `<meta property="product:price:amount" content="${esc(meta.price)}" />`,
      `<meta property="product:price:currency" content="EUR" />`,
    ] : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
  ].join('\n    ')
}

export default async (request, context) => {
  const url = new URL(request.url)

  // Product share image, served from our own domain.
  const og = url.pathname.match(/^\/og-image\/([a-z0-9-]+)\.jpg$/)
  if (og) {
    const p = await product(og[1])
    const id = driveId(p?.images?.[0])
    if (!id) return Response.redirect(new URL(DEFAULT_IMAGE, url.origin), 302)
    const img = await fetch(`https://drive.google.com/thumbnail?id=${id}&sz=w1200`, { redirect: 'follow' })
    if (!img.ok) return Response.redirect(new URL(DEFAULT_IMAGE, url.origin), 302)
    return new Response(img.body, {
      headers: { 'content-type': img.headers.get('content-type') || 'image/jpeg', 'cache-control': 'public, max-age=3600' },
    })
  }

  const res = await context.next()
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res

  const path = url.pathname.replace(/\/+$/, '') || '/'
  let meta = PAGES[path] || DEFAULT

  const pm = path.match(/^\/store\/product\/([a-z0-9-]+)$/)
  if (pm) {
    const p = await product(pm[1])
    if (p) {
      const name = p.name?.en || p.name?.es || SITE
      meta = {
        title: `${name} — ${SITE}`,
        description: clip(plain(p.tagline?.en) || plain(p.description?.en) || DEFAULT.description),
        image: p.images?.length ? `/og-image/${p.slug}.jpg` : DEFAULT_IMAGE,
        type: 'product',
        price: Number(p.price) > 0 ? Number(p.price).toFixed(2) : null,
      }
    }
  }

  const html = await res.text()
  const out = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace('</head>', `  ${tags(meta, url)}\n  </head>`)
  const headers = new Headers(res.headers)
  headers.delete('content-length')
  return new Response(out, { status: res.status, headers })
}

export const config = {
  path: '/*',
  excludedPath: ['/assets/*', '/images/*', '/icons/*', '/videos/*', '/ducksubs/*', '/*.js', '/*.css', '/*.svg', '/*.png', '/*.ico', '/*.webmanifest', '/.netlify/*'],
}

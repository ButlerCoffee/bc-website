/**
 * Shared checkout logic for the Netlify functions.
 *
 * Prices are never taken from the browser. Each cart line is turned into a
 * Stripe lookup key (bc_<tier>_<size>_<once|sub>) and the real Price is
 * fetched from Stripe, so test and live mode use the same code — only the
 * secret key differs. scripts/stripe-setup.mjs creates/labels those prices.
 */
import Stripe from 'stripe'

export const SHIP_COUNTRIES = ['ES', 'PT', 'AD']
export const FREE_SHIPPING_FROM = 3000       // cents
export const SHIPPING_FEE = 500              // cents
export const SUB_SHIPPING_KEY = 'bc_shipping_monthly'
export const MAX_QTY = 40
export const MAX_LINES = 12

const TIERS = ['base', 'explorer', 'alpine', 'summit', 'decaf']   // decaf: subscriptions only (calculator)
const SIZES = ['200g', '250g', '500g', '1kg']
const GRINDS = ['whole', 'extra-coarse', 'coarse', 'medium-coarse', 'medium', 'medium-fine', 'fine', 'extra-fine']

export const lookupKey = (tier, size, type) => `bc_${tier}_${size}_${type}`

// Stripe tax categories for Store products priced from the Products sheet
const TAX_CODE = { coffee: 'txcd_41050006', goods: 'txcd_99999999' }
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

let _stripe
export function stripe() {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim()
  if (!key) throw new HttpError(500, 'not_configured')
  return (_stripe ||= new Stripe(key))
}

export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code }
}

export const json = (status, body, extraHeaders = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  })

/** Only our own sites may create sessions; the return URL is built from this origin. */
export function allowedOrigin(req) {
  const origin = req.headers.get('origin') || ''
  const extra = (process.env.CHECKOUT_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  const ok =
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^https:\/\/([a-z0-9-]+--)?butler2026\.netlify\.app$/.test(origin) ||
    /^https:\/\/(www\.)?butler\.coffee$/.test(origin) ||
    extra.includes(origin)
  if (!ok) throw new HttpError(403, 'origin_not_allowed')
  return origin
}

/** Validates the cart sent by the browser. One order type per cart. */
export function parseCart(body) {
  const items = Array.isArray(body?.items) ? body.items : null
  if (!items || !items.length) throw new HttpError(400, 'empty_cart')
  if (items.length > MAX_LINES) throw new HttpError(400, 'too_many_items')
  const clean = items.map(i => {
    const qty = Math.floor(Number(i?.qty))
    if (!(qty >= 1 && qty <= MAX_QTY)) throw new HttpError(400, 'invalid_item')
    if (i?.productId) {
      // Store product: one-off only; grind checked against the product later
      if (i.type !== 'once' || !SLUG_RE.test(String(i.productId)) || String(i.productId).length > 60 ||
          (i.grind && !GRINDS.includes(i.grind))) throw new HttpError(400, 'invalid_item')
      return { type: 'once', productId: String(i.productId), grind: i.grind || '', qty }
    }
    if (!['sub', 'once'].includes(i?.type) || !TIERS.includes(i?.tierId) || !SIZES.includes(i?.size) ||
        !GRINDS.includes(i?.grind) || (i.tierId === 'decaf' && i.type !== 'sub')) {
      throw new HttpError(400, 'invalid_item')
    }
    return { type: i.type, tierId: i.tierId, size: i.size, grind: i.grind, qty }
  })
  const type = clean[0].type
  if (clean.some(i => i.type !== type)) throw new HttpError(400, 'mixed_cart')
  const lang = body?.lang === 'es' ? 'es' : 'en'
  return { type, items: clean, lang }
}

async function fetchPrices(keys) {
  const s = stripe()
  const found = new Map()
  for (let i = 0; i < keys.length; i += 10) {
    const res = await s.prices.list({ lookup_keys: keys.slice(i, i + 10), active: true, limit: 100 })
    for (const p of res.data) found.set(p.lookup_key, p)
  }
  return found
}

/**
 * Store products, read from the admin's Products sheet (public view: visible
 * rows only, no cost). This is the price customers pay.
 */
async function fetchProducts() {
  const api = (process.env.BUTLER_API_URL || process.env.VITE_BUTLER_API_URL || '').trim()
  if (!api) throw new HttpError(500, 'not_configured')
  const res = await fetch(`${api}?sheet=products`, { redirect: 'follow' })
  const json = await res.json().catch(() => ({}))
  if (!json.ok || !Array.isArray(json.data)) throw new HttpError(502, 'products_unavailable')
  const map = new Map()
  for (const p of json.data) {
    if (p && SLUG_RE.test(String(p.slug || '')) && p.name && typeof p.name === 'object' && Number(p.price) > 0) map.set(p.slug, p)
  }
  return map
}

/** Builds the Checkout Session parameters for a validated cart. */
export async function buildSessionParams({ type, items, lang }, origin) {
  const tierItems = items.filter(i => !i.productId)
  const productItems = items.filter(i => i.productId)

  const keys = [...new Set(tierItems.map(i => lookupKey(i.tierId, i.size, type)))]
  if (type === 'sub') keys.push(SUB_SHIPPING_KEY)
  const prices = keys.length ? await fetchPrices(keys) : new Map()
  const products = productItems.length ? await fetchProducts() : new Map()

  // Merge identical prices (same coffee+size with different grinds) into one line
  const lines = new Map()
  let subtotal = 0
  for (const i of tierItems) {
    const key = lookupKey(i.tierId, i.size, type)
    const price = prices.get(key)
    if (!price) throw new HttpError(409, 'unavailable')
    lines.set(price.id, (lines.get(price.id) || 0) + i.qty)
    subtotal += price.unit_amount * i.qty
  }
  const line_items = [...lines].map(([price, quantity]) => ({ price, quantity }))

  // Store products: priced inline from the Products sheet (server side)
  const productLines = new Map()
  for (const i of productItems) {
    const p = products.get(i.productId)
    if (!p || p.soldOut === true || String(p.soldOut) === 'true') throw new HttpError(409, 'unavailable')
    if (p.grind && !i.grind) throw new HttpError(400, 'invalid_item')
    const cents = Math.round(Number(p.price) * 100)
    const prev = productLines.get(p.slug)
    productLines.set(p.slug, { p, cents, qty: (prev?.qty || 0) + i.qty })
    subtotal += cents * i.qty
  }
  for (const { p, cents, qty } of productLines.values()) {
    const name = (lang === 'es' && p.name.es) || p.name.en
    line_items.push({
      quantity: qty,
      price_data: {
        currency: 'eur',
        unit_amount: cents,
        tax_behavior: 'inclusive',
        product_data: {
          name: p.size ? `${name} | ${p.size}` : name,
          tax_code: TAX_CODE[p.category] || TAX_CODE.goods,
          metadata: { source: 'store_product', slug: p.slug, category: String(p.category || '') },
        },
      },
    })
  }
  const freeShipping = subtotal >= FREE_SHIPPING_FROM

  // Grind per bag lives in metadata (Stripe line items can't carry it)
  const summary = items.map(i => i.productId
    ? `${i.productId} x${i.qty}${i.grind ? ` (${i.grind})` : ''}`
    : `${i.tierId} ${i.size} x${i.qty} (${i.grind})`).join('; ').slice(0, 500)
  const metadata = { source: 'website_cart', order_type: type, items: summary, lang }

  const params = {
    ui_mode: 'elements',
    // Cards only (Apple Pay / Google Pay still work, they run on cards).
    // No Klarna, Bancontact, EPS or Link — Dave's call, 2026-11-25.
    allowed_payment_method_types: ['card'],
    line_items,
    automatic_tax: { enabled: true },
    shipping_address_collection: { allowed_countries: SHIP_COUNTRIES },
    phone_number_collection: { enabled: true },
    billing_address_collection: 'auto',
    allow_promotion_codes: true,
    locale: lang,
    return_url: `${origin}/order/complete?session_id={CHECKOUT_SESSION_ID}`,
    metadata,
  }

  if (type === 'sub') {
    params.mode = 'subscription'
    // Shipping rates aren't supported in subscription mode, so monthly shipping
    // is its own recurring line (as on the current payment links).
    if (!freeShipping) {
      const ship = prices.get(SUB_SHIPPING_KEY)
      if (!ship) throw new HttpError(409, 'unavailable')
      line_items.push({ price: ship.id, quantity: 1 })
    }
    params.subscription_data = { metadata }
  } else {
    params.mode = 'payment'
    params.customer_creation = 'always'
    params.payment_intent_data = { metadata }
    params.shipping_options = [{
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: freeShipping ? 0 : SHIPPING_FEE, currency: 'eur' },
        display_name: freeShipping
          ? (lang === 'es' ? 'Envío gratis' : 'Free shipping')
          : (lang === 'es' ? 'Envío estándar' : 'Standard shipping'),
        tax_behavior: 'inclusive',
        tax_code: 'txcd_92010001',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 2 },
          maximum: { unit: 'business_day', value: 5 },
        },
      },
    }]
  }
  return params
}

/** Wraps a handler with method check + error → JSON response. */
export const handler = (method, fn) => async (req) => {
  if (req.method !== method) return json(405, { error: 'method_not_allowed' })
  try {
    return await fn(req)
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.code })
    console.error('[checkout]', err?.type || '', err?.message)
    // Error category only (e.g. StripePermissionError) — never the message or key
    return json(502, { error: 'stripe_error', type: err?.type || 'unknown', code: err?.code || null })
  }
}

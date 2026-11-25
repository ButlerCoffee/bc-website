import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

/**
 * Cart — coffee only. One order type per cart: either subscriptions or
 * one-off bags, never both (they check out separately).
 *
 * Items store only what identifies them (type, tier, size, grind, qty).
 * Names and prices are looked up from the live tier data when shown, and the
 * checkout function (Phase 2) resolves real Stripe prices on the server, so a
 * stale or edited browser cart can never change what someone pays.
 *
 * The cart is live in dev and when VITE_CART_ENABLED=true at build time;
 * otherwise the site keeps the existing Stripe payment links.
 */
export const CART_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_CART_ENABLED === 'true'

export const MAX_QTY = 10
export const FREE_SHIPPING_FROM = 30
export const SHIPPING_FEE = 5

// Shipping is limited to these countries for now (Spain, Portugal, Andorra).
// The checkout function passes this list to Stripe as allowed_countries.
export const SHIP_COUNTRIES = ['ES', 'PT', 'AD']

export const GRINDS = [
  { id: 'whole',         en: 'Whole bean',                es: 'Grano entero' },
  { id: 'extra-coarse',  en: 'Extra-coarse (cold brew)',  es: 'Extragruesa (cold brew)' },
  { id: 'coarse',        en: 'Coarse (French press)',     es: 'Gruesa (prensa francesa)' },
  { id: 'medium-coarse', en: 'Medium-coarse (Chemex)',    es: 'Media-gruesa (Chemex)' },
  { id: 'medium',        en: 'Medium (drip)',             es: 'Media (goteo)' },
  { id: 'medium-fine',   en: 'Medium-fine (Moka/V60)',    es: 'Media-fina (moka/V60)' },
  { id: 'fine',          en: 'Fine (espresso)',           es: 'Fina (espresso)' },
  { id: 'extra-fine',    en: 'Extra-fine (cezve)',        es: 'Extrafina (cezve)' },
]

const STORAGE_KEY = 'bc_cart_v1'
const TYPES = ['sub', 'once']

/**
 * Two kinds of line:
 *  - tier coffee:   { type: 'sub'|'once', tierId, size, grind, qty }
 *  - Store product: { type: 'once', productId, grind (or ''), qty }
 */
const itemKey = (i) => i.productId
  ? `once:p:${i.productId}:${i.grind || ''}`
  : `${i.type}:${i.tierId}:${i.size}:${i.grind}`

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const clampQty = (q) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(q)) || 1))

function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(i => {
    if (!i || !TYPES.includes(i.type)) return null
    if (i.productId) {
      if (i.type !== 'once' || !SLUG_RE.test(String(i.productId))) return null
      const grind = GRINDS.some(g => g.id === i.grind) ? i.grind : ''
      return { type: 'once', productId: String(i.productId), grind, qty: clampQty(i.qty) }
    }
    if (!i.tierId || !i.size || !GRINDS.some(g => g.id === i.grind)) return null
    return { type: i.type, tierId: String(i.tierId), size: String(i.size), grind: i.grind, qty: clampQty(i.qty) }
  }).filter(Boolean)
}

// One order type per cart: keep only items matching the first item's type
const singleType = (items) => items.filter(i => i.type === items[0]?.type)

function loadCart() {
  try { return singleType(sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)))) } catch { return [] }
}

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [isOpen, setIsOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e) => { if (e.key === STORAGE_KEY) setItems(loadCart()) }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const cartType = items[0]?.type || null   // 'sub' | 'once' | null

  /**
   * Adds an item. Returns false (and adds nothing) if the cart already holds
   * the other order type, unless { replace: true } — then the cart is emptied first.
   */
  const add = useCallback((item, { replace = false } = {}) => {
    const [clean] = sanitize([item])
    if (!clean) return false
    if (cartType && cartType !== clean.type && !replace) return false
    setItems(prev => {
      if (prev[0] && prev[0].type !== clean.type) prev = []
      const k = itemKey(clean)
      const existing = prev.find(i => itemKey(i) === k)
      if (existing) {
        return prev.map(i => itemKey(i) === k ? { ...i, qty: Math.min(MAX_QTY, i.qty + clean.qty) } : i)
      }
      return [...prev, clean]
    })
    setLastAdded(itemKey(clean))
    setIsOpen(true)
    return true
  }, [cartType])

  const setQty = useCallback((key, qty) => {
    const n = Math.floor(Number(qty))
    setItems(prev => n < 1
      ? prev.filter(i => itemKey(i) !== key)
      : prev.map(i => itemKey(i) === key ? { ...i, qty: Math.min(MAX_QTY, n) } : i))
  }, [])

  const remove = useCallback((key) => setItems(prev => prev.filter(i => itemKey(i) !== key)), [])
  const clear  = useCallback(() => setItems([]), [])
  const open   = useCallback(() => setIsOpen(true), [])
  const close  = useCallback(() => { setIsOpen(false); setLastAdded(null) }, [])

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items])

  const value = useMemo(() => ({
    items, cartType, count, isOpen, lastAdded, add, setQty, remove, clear, open, close, itemKey,
  }), [items, cartType, count, isOpen, lastAdded, add, setQty, remove, clear, open, close])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

/**
 * Joins cart items with live tier + product data → display lines + totals.
 * Each line gets name, image, href and detail for display. Items whose
 * tier/size/product no longer exists (or is sold out) are left out.
 */
export function priceCart(items, tiers, products = [], lang = 'en') {
  const lines = items.map(i => {
    if (i.productId) {
      const p = products.find(x => x.slug === i.productId)
      if (!p || p.soldOut || !(p.price > 0)) return null
      return {
        ...i, key: itemKey(i), product: p, unitPrice: p.price, lineTotal: p.price * i.qty,
        name: p.name[lang] || p.name.en, image: p.images?.[0] || '',
        href: `/store/product/${p.slug}`, sizeLabel: p.size || '',
      }
    }
    const tier = tiers.find(t => t.id === i.tierId)
    const size = tier?.sizes.find(s => s.label === i.size)
    if (!tier || !size) return null
    return {
      ...i, key: itemKey(i), tier, unitPrice: size.price, lineTotal: size.price * i.qty,
      name: tier.name, image: tier.thumb || tier.image,
      href: i.type === 'sub' ? `/subscriptions/${tier.slug}` : `/store/coffee/${tier.slug}`, sizeLabel: i.size,
    }
  }).filter(Boolean)

  const subsTotal = lines.filter(l => l.type === 'sub').reduce((s, l) => s + l.lineTotal, 0)
  const onceTotal = lines.filter(l => l.type === 'once').reduce((s, l) => s + l.lineTotal, 0)
  const firstDelivery = subsTotal + onceTotal
  const shipping = firstDelivery === 0 || firstDelivery >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE

  return { lines, subsTotal, onceTotal, firstDelivery, shipping, total: firstDelivery + shipping }
}

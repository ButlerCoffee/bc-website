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

const itemKey = (i) => `${i.type}:${i.tierId}:${i.size}:${i.grind}`

function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(i => i && TYPES.includes(i.type) && i.tierId && i.size && GRINDS.some(g => g.id === i.grind))
    .map(i => ({
      type: i.type, tierId: String(i.tierId), size: String(i.size), grind: i.grind,
      qty: Math.min(MAX_QTY, Math.max(1, Math.floor(Number(i.qty)) || 1)),
    }))
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
 * Joins cart items with live tier data → display lines + totals.
 * Items whose tier/size no longer exists are left out.
 */
export function priceCart(items, tiers) {
  const lines = items.map(i => {
    const tier = tiers.find(t => t.id === i.tierId)
    const size = tier?.sizes.find(s => s.label === i.size)
    if (!tier || !size) return null
    return { ...i, key: itemKey(i), tier, unitPrice: size.price, lineTotal: size.price * i.qty }
  }).filter(Boolean)

  const subsTotal = lines.filter(l => l.type === 'sub').reduce((s, l) => s + l.lineTotal, 0)
  const onceTotal = lines.filter(l => l.type === 'once').reduce((s, l) => s + l.lineTotal, 0)
  const firstDelivery = subsTotal + onceTotal
  const shipping = firstDelivery === 0 || firstDelivery >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE

  return { lines, subsTotal, onceTotal, firstDelivery, shipping, total: firstDelivery + shipping }
}

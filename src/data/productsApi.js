/**
 * productsApi.js — Store products (special coffees, goods) from the admin's
 * "Products" sheet. Machines and coffee tiers have their own modules.
 *
 * First paint uses the build-time snapshot; then refreshes from the live API.
 * Prices shown here are for display only — checkout re-reads them server side.
 */
import { useState, useEffect } from 'react'
import { fetchSheet, normalizeDriveUrl } from './api'
import SNAPSHOT from './snapshot.json'

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

function adapt(p) {
  if (!p || !SLUG_RE.test(String(p.slug || '')) || !p.name || typeof p.name !== 'object') return null
  const price = Number(p.price)
  if (!(price > 0)) return null
  const L = (o) => ({ en: String(o?.en || ''), es: String(o?.es || o?.en || '') })
  return {
    slug: p.slug,
    category: p.category === 'goods' ? 'goods' : 'coffee',
    order: Number(p.order) || 0,
    name: L(p.name), tagline: L(p.tagline), description: L(p.description), badge: L(p.badge),
    price, size: String(p.size || ''), grind: !!p.grind, soldOut: !!p.soldOut,
    images: (Array.isArray(p.images) ? p.images : []).map(u => normalizeDriveUrl(u, 'w1200')).filter(Boolean),
  }
}

function build(rows) {
  if (!Array.isArray(rows)) return null
  return rows.map(adapt).filter(Boolean).sort((a, b) => a.order - b.order)
}

const INITIAL = build(SNAPSHOT?.products) || []

let _promise = null
function loadData() {
  if (!_promise) {
    _promise = fetchSheet('products').then(rows => build(rows) ?? INITIAL).catch(() => INITIAL)
  }
  return _promise
}

export function useProducts() {
  const [state, setState] = useState({ products: INITIAL, loading: true })
  useEffect(() => {
    let cancelled = false
    loadData().then(products => { if (!cancelled) setState({ products, loading: false }) })
    return () => { cancelled = true }
  }, [])
  return state
}

export const productsIn = (products, category) => products.filter(p => p.category === category)
export const getProduct = (products, slug) => products.find(p => p.slug === slug)

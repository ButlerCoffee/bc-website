/**
 * subsApi.js — loads subscription tiers from the GAS backend.
 *
 * Falls back to the hardcoded TIERS constant when unavailable.
 *
 * Visual-only fields (emoji, color, duck image, pills, featured flag,
 * popularLabel) are kept as hardcoded per-tier metadata here — they
 * don't belong in a spreadsheet and rarely change.
 *
 * GAS field → website shape:
 *   title           → name
 *   eyebrowEN       → tagline (the punchy one-liner)
 *   shortDescEN/ES  → description.en/es  (card body)
 *   longDescEN/ES   → detail.en/es       (full tier page)
 *   feat01-04 EN/ES → features.en/es
 *   compositionEN/ES → composition.en/es
 *   flavorEN/ES     → flavor.en/es
 *   structureEN/ES  → structure.en/es
 *   purposeEN/ES    → purpose.en/es
 *   price250g…      → sizes[].price + base price
 *   link250g…       → stripeLinks
 */
import { useState, useEffect } from 'react'
import { fetchSheet } from './api.js'
import { TIERS as FALLBACK_TIERS } from './tiers.js'
import SNAPSHOT from './snapshot.json'

// ── Per-tier static metadata (visual / display only) ─────────────────────────
// Keyed by the tier `title` value as stored in the sheet.
const TIER_META = {
  'Base Coffee':    { id: 'base',    slug: 'base',    emoji: '🦆', color: '#FFE500', image: '/ducksubs/duck_base_bw.webp', thumb: '/ducksubs/duck_base_bw-sm.webp',     pills: ['Blends', 'Modern Classic'],   featured: false },
  'Explorer Coffee':{ id: 'explorer',slug: 'explorer',emoji: '🧭', color: '#FFE500', image: '/ducksubs/duck_explorer_bw.webp', thumb: '/ducksubs/duck_explorer_bw-sm.webp', pills: ['Single Origin', 'Airy & Expressive'], featured: true,  popularLabel: { en: 'Most Popular', es: 'Más Popular' } },
  'Alpine Coffee':  { id: 'alpine',  slug: 'alpine',  emoji: '⛰️', color: '#a8d8ea', image: '/ducksubs/duck_alpine_bw.webp', thumb: '/ducksubs/duck_alpine_bw-sm.webp',   pills: ['High Altitude', 'Clean & Complex'],  featured: false },
  'Summit Coffee':  { id: 'summit',  slug: 'summit',  emoji: '🏔️', color: '#ffd700', image: '/ducksubs/duck_summit_bw.webp', thumb: '/ducksubs/duck_summit_bw-sm.webp',   pills: ['Private Stock', 'Unique'],    featured: false },
}

// Fallback: match by partial title if exact match fails
function findMeta(title) {
  if (TIER_META[title]) return TIER_META[title]
  const key = Object.keys(TIER_META).find(k => title.toLowerCase().includes(k.split(' ')[0].toLowerCase()))
  return key ? TIER_META[key] : { id: title.toLowerCase().replace(/\s+/g,'-'), slug: title.toLowerCase().replace(/\s+/g,'-'), emoji: '☕', color: '#FFE500', image: '', thumb: '', pills: [], featured: false }
}

// ── Adapter: GAS sub row → website tier shape ─────────────────────────────────
function adaptTier(s) {
  const meta = findMeta(s.title)

  // Build sizes array from whichever price fields are filled
  const sizes = []
  if (Number(s.price200g) > 0) sizes.push({ label: '200g', price: Number(s.price200g) })
  if (Number(s.price250g) > 0) sizes.push({ label: '250g', price: Number(s.price250g) })
  if (Number(s.price500g) > 0) sizes.push({ label: '500g', price: Number(s.price500g) })
  if (Number(s.price1kg)  > 0) sizes.push({ label: '1kg',  price: Number(s.price1kg)  })
  // Fallback if sheet has no prices yet
  if (!sizes.length) {
    const fb = FALLBACK_TIERS.find(t => t.id === meta.id)
    if (fb) fb.sizes.forEach(sz => sizes.push(sz))
  }

  const stripeLinks = {}
  if (s.link200g) stripeLinks['200g'] = s.link200g
  if (s.link250g) stripeLinks['250g'] = s.link250g
  if (s.link500g) stripeLinks['500g'] = s.link500g
  if (s.link1kg)  stripeLinks['1kg']  = s.link1kg

  const featsEN = ['feat01EN','feat02EN','feat03EN','feat04EN'].map(k => s[k]).filter(Boolean)
  const featsES = ['feat01ES','feat02ES','feat03ES','feat04ES'].map(k => s[k]).filter(Boolean)

  return {
    ...meta,
    name:        s.title,
    tier:        s.eyebrowEN ? `Tier ${String(FALLBACK_TIERS.findIndex(t => t.id === meta.id) + 1).padStart(2,'0')}` : '',
    tagline:     s.eyebrowEN || '',
    description: { en: s.shortDescEN || '', es: s.shortDescES || s.shortDescEN || '' },
    detail:      { en: s.longDescEN  || '', es: s.longDescES  || s.longDescEN  || '' },
    features:    { en: featsEN, es: featsES.length ? featsES : featsEN },
    composition: { en: s.compositionEN || '', es: s.compositionES || s.compositionEN || '' },
    flavor:      { en: s.flavorEN     || '', es: s.flavorES     || s.flavorEN     || '' },
    structure:   { en: s.structureEN  || '', es: s.structureES  || s.structureEN  || '' },
    purpose:     { en: s.purposeEN    || '', es: s.purposeES    || s.purposeEN    || '' },
    price:       sizes[0]?.price || 0,
    unit:        sizes[0]?.label || '250g',
    sizes,
    stripeLinks,
  }
}

// ── Build ordered tiers from sheet rows ───────────────────────────────────────
function buildFromRows(rows) {
  if (!rows || !rows.length) return null
  // Preserve the display order defined in TIER_META
  const ordered = Object.values(TIER_META).map(meta =>
    rows.find(r => findMeta(r.title).id === meta.id)
  ).filter(Boolean)
  return ordered.length ? ordered.map(adaptTier) : null
}

// First paint uses the build-time snapshot of the sheet (scripts/snapshot.mjs).
const INITIAL = buildFromRows(SNAPSHOT?.subs) || FALLBACK_TIERS

// ── Module-level cache ────────────────────────────────────────────────────────
let _promise = null

async function loadData() {
  if (_promise) return _promise
  _promise = fetchSheet('subs')
    .then(rows => buildFromRows(rows) || INITIAL)
    .catch(() => INITIAL)
  return _promise
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useTiers() {
  const [tiers,   setTiers]   = useState(INITIAL)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadData().then(data => {
      if (!cancelled) { setTiers(data); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  return { tiers, loading }
}

// ── Convenience selectors ─────────────────────────────────────────────────────
export function getTierBySlug(tiers, slug) {
  return tiers.find(t => t.slug === slug)
}

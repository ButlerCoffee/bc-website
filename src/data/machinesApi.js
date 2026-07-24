/**
 * machinesApi.js — loads machines data from the GAS backend.
 *
 * Falls back to the hardcoded MACHINES / BRANDS constants when the API
 * is unavailable, so the page always renders.
 *
 * GAS field → website shape mapping is done in adaptMachine().
 * Visual-only fields (image placeholder, page copy) remain hardcoded.
 */
import { useState, useEffect } from 'react'
import { fetchSheet, normalizeDriveUrl } from './api.js'
import { MACHINES as FALLBACK_MACHINES, BRANDS as FALLBACK_BRANDS } from './machines.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str = '') {
  return str.toLowerCase()
    .replace(/[àáâãä]/g, 'a').replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseSpecs(raw) {
  try { return JSON.parse(raw || '[]') } catch { return [] }
}

function feats(obj, prefix) {
  return ['01','02','03','04','05','06']
    .map(n => obj[`feat${n}${prefix}`])
    .filter(Boolean)
}

// ── Adapter: GAS row → website machine shape ──────────────────────────────────
function adaptMachine(m) {
  const brandId  = slugify(m.brand || '')
  const featsEN  = feats(m, 'EN')
  const featsES  = feats(m, 'ES')
  const specsEN  = parseSpecs(m.specsEN)
  const specsES  = parseSpecs(m.specsES)
  const derivedSlug = m.slug || slugify(`${m.brand}-${m.name}`)

  // Collect any populated image1-6 fields, normalize Drive share links → thumbnail URLs.
  const images = ['image1','image2','image3','image4','image5','image6']
    .map(k => m[k])
    .filter(Boolean)
    .map(url => normalizeDriveUrl(url, 'w900'))

  // Fallback specs from raw sheet fields when the dedicated specsEN/specsES
  // columns haven't been filled in yet by the admin.
  const fallbackSpecs = [
    m.dailyOutput && { label: 'Daily output', value: `${m.dailyOutput} cups/day` },
    m.juraCoffees && { label: 'Coffee varieties', value: m.juraCoffees },
    m.areas && { label: 'Best for', value: m.areas },
  ].filter(Boolean)

  return {
    id:          m.id,
    slug:        derivedSlug,
    brand:       brandId,
    brandName:   m.brand,
    name:        m.name,
    tagline:     { en: m.taglineEN || m.subtitleEN || '', es: m.taglineES || m.subtitleES || '' },
    tag:         { en: m.tagEN || '', es: m.tagES || m.tagEN || '' },
    tagVariant:  m.tagVariant || 'default',
    price:       Number(m.salePrice) || Number(m.pvpr) || 0,
    description: { en: m.shortDescEN || '', es: m.shortDescES || m.shortDescEN || '' },
    detail:      { en: m.longDescEN  || '', es: m.longDescES  || m.longDescEN  || '' },
    features:    { en: featsEN, es: featsES.length ? featsES : featsEN },
    specs:       {
      en: specsEN.length ? specsEN : fallbackSpecs,
      es: specsES.length ? specsES : (specsEN.length ? specsEN : fallbackSpecs),
    },
    ideal:       { en: m.idealEN || m.areas || '', es: m.idealES || m.idealEN || m.areas || '' },
    stripeLink:  m.stripeLink || '',
    sheetLink:   { en: m.sheetEN || '', es: m.sheetES || m.sheetEN || '' },
    images,
    image1:      m.image1 || '', image2: m.image2 || '', image3: m.image3 || '',
    image4:      m.image4 || '', image5: m.image5 || '', image6: m.image6 || '',
    visible:     m.visible,
    featured:    m.featured,
    areas:       m.areas || '',
    dailyOutput: m.dailyOutput || '',
  }
}

// ── Module-level cache: promise resolved once per session ─────────────────────
let _promise = null

async function loadData() {
  if (_promise) return _promise
  _promise = fetchSheet('machines').then(rows => {
    if (!rows || !rows.length) return { machines: FALLBACK_MACHINES, brands: FALLBACK_BRANDS }

    const machines = rows.filter(m => m.visible).map(adaptMachine)

    // Build brand objects from unique brand IDs, merging with hardcoded fallback data
    const seen = new Set()
    const brands = []
    for (const m of machines) {
      if (seen.has(m.brand)) continue
      seen.add(m.brand)
      const fb = FALLBACK_BRANDS.find(b => b.id === m.brand)
      brands.push(fb || {
        id: m.brand, name: m.brandName,
        tagline: {}, description: {}, badge: {}, logo: '☕',
      })
    }

    return { machines, brands }
  }).catch(() => ({ machines: FALLBACK_MACHINES, brands: FALLBACK_BRANDS }))
  return _promise
}

// ── React hook ────────────────────────────────────────────────────────────────
export function useMachines() {
  const [state, setState] = useState({
    machines: FALLBACK_MACHINES,
    brands:   FALLBACK_BRANDS,
    loading:  true,
  })

  useEffect(() => {
    let cancelled = false
    loadData().then(data => {
      if (!cancelled) setState({ ...data, loading: false })
    })
    return () => { cancelled = true }
  }, [])

  return state
}

// ── Convenience selectors (mirrors hardcoded machines.js API) ─────────────────
export function getMachinesByBrand(machines, brandId) {
  return machines.filter(m => m.brand === brandId)
}

export function getMachineBySlug(machines, slug) {
  return machines.find(m => m.slug === slug)
}

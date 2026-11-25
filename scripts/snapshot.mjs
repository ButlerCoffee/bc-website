/**
 * snapshot.mjs — runs before every build (npm "prebuild").
 *
 * Fetches the machines and subs sheets from the Apps Script API and writes
 * src/data/snapshot.json. The site renders this snapshot on first paint, then
 * refreshes from the live API — so visitors never see stale hardcoded data.
 *
 * Private business fields (cost, margin, profit, provider, VAT) are stripped
 * so they never end up in the public JS bundle.
 *
 * If the API is unreachable, the existing snapshot is kept and the build
 * continues.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(root, 'src/data/snapshot.json')

function apiUrl() {
  if (process.env.VITE_BUTLER_API_URL) return process.env.VITE_BUTLER_API_URL
  for (const f of ['.env.local', '.env']) {
    const p = join(root, f)
    if (!existsSync(p)) continue
    const m = readFileSync(p, 'utf8').match(/^VITE_BUTLER_API_URL=(.+)$/m)
    if (m) return m[1].trim()
  }
  return ''
}

const PRIVATE = /^(cost|margin|profit|provider|vat)/i

function clean(rows) {
  return rows.map(r => Object.fromEntries(Object.entries(r).filter(([k]) => !PRIVATE.test(k))))
}

async function fetchSheet(url, sheet) {
  const res = await fetch(`${url}?sheet=${sheet}`, { redirect: 'follow' })
  const json = await res.json()
  if (!json.ok || !Array.isArray(json.data) || !json.data.length) throw new Error(`${sheet}: empty`)
  return clean(json.data)
}

async function fetchLegal(url) {
  try {
    const res = await fetch(`${url}?sheet=legal`, { redirect: 'follow' })
    const json = await res.json()
    return json.ok && Array.isArray(json.data) ? json.data : []
  } catch { return [] }
}

// Store products (special coffees, goods). Only rows shaped like products are
// kept — an older backend answers ?sheet=products with the coffee list.
async function fetchProducts(url) {
  try {
    const res = await fetch(`${url}?sheet=products`, { redirect: 'follow' })
    const json = await res.json()
    if (!json.ok || !Array.isArray(json.data)) return []
    return clean(json.data.filter(p => p && p.slug && p.name && typeof p.name === 'object' && Number(p.price) > 0))
  } catch { return [] }
}

// Client logos ("Trusted by"); only rows shaped like logos are kept
async function fetchLogos(url) {
  try {
    const res = await fetch(`${url}?sheet=logos`, { redirect: 'follow' })
    const json = await res.json()
    if (!json.ok || !Array.isArray(json.data)) return []
    return json.data.filter(l => l && l.id && l.image && l.name && typeof l.alt === 'object')
  } catch { return [] }
}

async function fetchSettings(url) {
  try {
    const res = await fetch(`${url}?sheet=settings`, { redirect: 'follow' })
    const json = await res.json()
    return json.ok && json.data && !Array.isArray(json.data) ? json.data : null
  } catch { return null }
}

const url = apiUrl()
if (!url) {
  console.warn('[snapshot] No VITE_BUTLER_API_URL — keeping existing snapshot.')
  process.exit(0)
}

try {
  const [machines, subs, settings, legal, products, logos] = await Promise.all([
    fetchSheet(url, 'machines'),
    fetchSheet(url, 'subs'),
    fetchSettings(url),
    fetchLegal(url),
    fetchProducts(url),
    fetchLogos(url),
  ])
  writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), machines, subs, settings, legal, products, logos }, null, 1) + '\n')
  console.log(`[snapshot] Saved ${machines.length} machines, ${subs.length} subs, ${products.length} products.`)
} catch (err) {
  console.warn(`[snapshot] Fetch failed (${err.message}) — keeping existing snapshot.`)
}

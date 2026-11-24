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

const url = apiUrl()
if (!url) {
  console.warn('[snapshot] No VITE_BUTLER_API_URL — keeping existing snapshot.')
  process.exit(0)
}

try {
  const [machines, subs] = await Promise.all([fetchSheet(url, 'machines'), fetchSheet(url, 'subs')])
  writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), machines, subs }, null, 1) + '\n')
  console.log(`[snapshot] Saved ${machines.length} machines, ${subs.length} subs.`)
} catch (err) {
  console.warn(`[snapshot] Fetch failed (${err.message}) — keeping existing snapshot.`)
}

/**
 * settingsApi.js — site-wide settings edited in the admin (Site Settings):
 * contact email, Stripe Customer Portal link, company details for the legal
 * pages and footer. First paint uses the build-time snapshot, then refreshes
 * from the live API.
 */
import { useEffect, useState } from 'react'
import SNAPSHOT from './snapshot.json'

const API_URL = import.meta.env.VITE_BUTLER_API_URL || ''

export const DEFAULT_SETTINGS = {
  contactEmail:   'hola@butler.coffee',
  portalUrl:      '',
  companyName:    'Butler Coffee SL',
  companyAddress: '',
  companyTaxId:   '',
  legalUpdated:   '',
}

// Empty values fall back to defaults only where an empty value makes no sense.
function normalize(s = {}) {
  const out = { ...DEFAULT_SETTINGS, ...s }
  if (!out.contactEmail) out.contactEmail = DEFAULT_SETTINGS.contactEmail
  if (!out.companyName)  out.companyName  = DEFAULT_SETTINGS.companyName
  return out
}

const INITIAL = normalize(SNAPSHOT?.settings)

let _promise = null
function loadSettings() {
  if (_promise) return _promise
  if (!API_URL) return (_promise = Promise.resolve(INITIAL))
  _promise = fetch(`${API_URL}?sheet=settings`, { redirect: 'follow' })
    .then(r => r.json())
    .then(j => (j.ok && j.data && !Array.isArray(j.data) ? normalize(j.data) : INITIAL))
    .catch(() => INITIAL)
  return _promise
}

export function useSettings() {
  const [settings, setSettings] = useState(INITIAL)
  useEffect(() => {
    let cancelled = false
    loadSettings().then(s => { if (!cancelled) setSettings(s) })
    return () => { cancelled = true }
  }, [])
  return settings
}

/**
 * Fill legal-text placeholders:
 *   {company} {address} {taxId} {email}
 *   [[ … ]]  optional segment, dropped if any placeholder inside is empty.
 */
export function fillSettings(text = '', s = INITIAL) {
  const values = { company: s.companyName, address: s.companyAddress, taxId: s.companyTaxId, email: s.contactEmail }
  const sub = t => t.replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] || '' : m))
  return text
    .replace(/\[\[([\s\S]*?)\]\]/g, (m, inner) => {
      const keys = [...inner.matchAll(/\{(\w+)\}/g)].map(x => x[1])
      return keys.every(k => values[k]) ? sub(inner) : ''
    })
    .replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] || '' : m))
}

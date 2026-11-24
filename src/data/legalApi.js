/**
 * legalApi.js — legal pages edited in the admin (Legal Pages), stored in the
 * "Legal" sheet tab. First paint uses the build-time snapshot; falls back to
 * the built-in text in legal.js until the database has pages.
 */
import { useEffect, useState } from 'react'
import SNAPSHOT from './snapshot.json'
import { LEGAL_PAGES as BUILT_IN } from './legal'

const API_URL = import.meta.env.VITE_BUTLER_API_URL || ''

function normalize(rows) {
  if (!Array.isArray(rows) || !rows.length) return null
  const pages = rows
    // Only accept real legal pages (title object + sections list)
    .filter(p => p && p.slug && p.title && typeof p.title === 'object' && Array.isArray(p.sections) && p.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  return pages.length ? pages : null
}

const INITIAL = normalize(SNAPSHOT?.legal) || BUILT_IN

let _promise = null
function loadLegal() {
  if (_promise) return _promise
  if (!API_URL) return (_promise = Promise.resolve(INITIAL))
  _promise = fetch(`${API_URL}?sheet=legal`, { redirect: 'follow' })
    .then(r => r.json())
    .then(j => (j.ok && normalize(j.data)) || INITIAL)
    .catch(() => INITIAL)
  return _promise
}

/** { pages, loading } — visible legal pages in menu order. */
export function useLegalPages() {
  const [state, setState] = useState({ pages: INITIAL, loading: true })
  useEffect(() => {
    let cancelled = false
    loadLegal().then(pages => { if (!cancelled) setState({ pages, loading: false }) })
    return () => { cancelled = true }
  }, [])
  return state
}

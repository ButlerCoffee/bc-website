/**
 * logosApi.js — "Trusted by" client logos from the admin's Logos sheet.
 * Falls back to the built-in four when the sheet is empty or unreachable.
 */
import { useState, useEffect } from 'react'
import { fetchSheet, normalizeDriveUrl } from './api'
import SNAPSHOT from './snapshot.json'

export const DEFAULT_LOGOS = [
  { id: 'shuttlecloud', name: 'ShuttleCloud', image: '/images/logos/shuttlecloud.png', alt: { en: 'ShuttleCloud logo', es: 'Logo de ShuttleCloud' }, link: 'https://www.shuttlecloud.com/' },
  { id: 'el-guiri-studios', name: 'El Güiri Studios', image: '/images/logos/el-guiri-studios.png', alt: { en: 'El Güiri Studios logo', es: 'Logo de El Güiri Studios' }, link: 'https://elguiristudios.com/' },
  { id: 'emailprefs', name: 'emailprefs', image: '/images/logos/emailprefs.png', alt: { en: 'emailprefs logo', es: 'Logo de emailprefs' }, link: '' },
  { id: 'beardface', name: 'Beardface', image: '/images/logos/beardface.png', alt: { en: 'Beardface Design Co. logo', es: 'Logo de Beardface Design Co.' }, link: '' },
]

function adapt(l) {
  if (!l || !l.id || !l.image || !l.name || typeof l.alt !== 'object') return null
  const link = /^https?:\/\//.test(String(l.link || '')) ? String(l.link) : ''
  const image = String(l.image).startsWith('/') ? l.image : normalizeDriveUrl(l.image, 'w600')
  return { id: l.id, name: l.name, image, link, order: Number(l.order) || 0,
    alt: { en: l.alt.en || `${l.name} logo`, es: l.alt.es || l.alt.en || `Logo de ${l.name}` } }
}

function build(rows) {
  if (!Array.isArray(rows)) return null
  const list = rows.map(adapt).filter(Boolean).sort((a, b) => a.order - b.order)
  return list.length ? list : null
}

const INITIAL = build(SNAPSHOT?.logos) || DEFAULT_LOGOS

let _promise = null
const loadData = () => (_promise ||= fetchSheet('logos').then(r => build(r) || INITIAL).catch(() => INITIAL))

export function useLogos() {
  const [logos, setLogos] = useState(INITIAL)
  useEffect(() => {
    let cancelled = false
    loadData().then(l => { if (!cancelled) setLogos(l) })
    return () => { cancelled = true }
  }, [])
  return logos
}

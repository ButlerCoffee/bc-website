/**
 * blogApi.js — loads blog posts from the GAS backend.
 *
 * GAS field shape:
 *   { id, slug, status, updatedAt, category, tags, author, featured,
 *     imageUrl, imageAlt, imageCredit,
 *     title_en, excerpt_en, content_en,
 *     title_es, excerpt_es, content_es }
 *
 * Only posts with status === 'published' are returned.
 * Results are module-level cached for 15 min.
 */
import { useState, useEffect } from 'react'
import { fetchSheet } from './api.js'

// ── Fallback posts shown when the API is unavailable ─────────────────────────
export const FALLBACK_POSTS = [
  {
    id: 'fallback-1', slug: 'cafe-perfecto-oficina', status: 'published',
    title_en: 'How to nail a perfect coffee in the office',
    title_es: 'Cómo clavar un café perfecto en la oficina',
    excerpt_en: 'Great office coffee isn\'t complicated — but it does take the right setup. Here\'s how to get every cup right.',
    excerpt_es: 'El buen café de oficina no es complicado — pero sí requiere el equipo adecuado. Así se consigue una taza perfecta.',
    author: 'Tomás', updatedAt: '2025-06-05', category: 'Brewing', featured: true,
    imageUrl: '', imageAlt: '', content_en: '', content_es: '',
  },
  {
    id: 'fallback-2', slug: 'cold-brew-oficina', status: 'published',
    title_en: 'How to make Cold Brew in the office',
    title_es: 'Cómo hacer Cold Brew en la oficina',
    excerpt_en: 'Cold brew is easier than it looks and keeps for days. Perfect for the office fridge.',
    excerpt_es: 'El cold brew es más fácil de lo que parece y aguanta días. Perfecto para la nevera de la oficina.',
    author: 'Dave', updatedAt: '2025-06-05', category: 'Brewing', featured: false,
    imageUrl: '', imageAlt: '', content_en: '', content_es: '',
  },
  {
    id: 'fallback-3', slug: 'agua-cafe-especialidad', status: 'published',
    title_en: 'Why water matters in specialty coffee',
    title_es: 'La importancia del agua en el café de especialidad',
    excerpt_en: 'Water makes up 98% of your cup. Getting it right makes the difference between good and extraordinary.',
    excerpt_es: 'El agua es el 98% de tu taza. Afinar este detalle marca la diferencia entre lo bueno y lo extraordinario.',
    author: 'Rafael', updatedAt: '2025-05-25', category: 'Science', featured: false,
    imageUrl: '', imageAlt: '', content_en: '', content_es: '',
  },
]

// ── Module-level promise cache ────────────────────────────────────────────────
let _promise = null

async function loadPosts() {
  if (_promise) return _promise
  _promise = fetchSheet('blog').then(rows => {
    if (!rows || !rows.length) return FALLBACK_POSTS
    const published = rows.filter(p => p.status === 'published')
    return published.length ? published : FALLBACK_POSTS
  }).catch(() => FALLBACK_POSTS)
  return _promise
}

export function invalidateBlogCache() { _promise = null }

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** All published posts. */
export function usePosts() {
  const [posts,   setPosts]   = useState(FALLBACK_POSTS)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    loadPosts().then(data => { if (!cancelled) { setPosts(data); setLoading(false) } })
    return () => { cancelled = true }
  }, [])
  return { posts, loading }
}

/** Featured posts (up to `limit`), used for the home page teaser. */
export function useFeaturedPosts(limit = 3) {
  const { posts, loading } = usePosts()
  const featured = posts.filter(p => p.featured).slice(0, limit)
  // If no featured posts, fall back to the latest `limit` posts
  const result = featured.length ? featured : posts.slice(0, limit)
  return { posts: result, loading }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPostBySlug(posts, slug) {
  return posts.find(p => p.slug === slug)
}

export function formatDate(iso, lang = 'en') {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

/** Returns true if the string looks like HTML (from the visual editor). */
export function isHtml(s) { return /^\s*<[a-zA-Z]/.test(s || '') }

/** Minimal Markdown → HTML for post content rendered on the public website. */
export function renderMarkdown(md) {
  if (!md) return ''
  const esc    = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = s => s
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:var(--yellow)">$1</a>')
  return esc(md).split(/\n\n+/).map(block => {
    const lines = block.split('\n')
    if (lines.some(l => /^[*-] /.test(l.trim()))) {
      return `<ul>${lines.filter(l => l.trim()).map(l => `<li>${inline(l.replace(/^[*-]\s+/, ''))}</li>`).join('')}</ul>`
    }
    if (/^#{1,3} /.test(lines[0])) {
      const lvl = lines[0].match(/^(#+)/)[1].length
      return `<h${lvl}>${inline(lines[0].replace(/^#+\s+/, ''))}</h${lvl}>${lines.slice(1).map(inline).join('<br>')}`
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`
  }).join('')
}

/** Render content that may be HTML or Markdown. */
export function renderContent(raw) {
  if (!raw) return ''
  return isHtml(raw) ? raw : renderMarkdown(raw)
}

/** Estimate reading time in minutes from raw content (HTML or Markdown). */
export function readingTime(content) {
  if (!content) return 1
  const text = content.replace(/<[^>]+>/g, ' ').replace(/[#*_`~\[\]]/g, '').replace(/\s+/g, ' ').trim()
  const words = text.split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/** Inject OG + Twitter meta tags into <head> for the current article page.
 *  Cleans up on unmount so tags don't bleed into other pages. */
export function usePageMeta({ title, description, imageUrl }) {
  useEffect(() => {
    const prevTitle = document.title
    if (title) document.title = `${title} — Butler Coffee`

    const tags = [
      { property: 'og:type',               content: 'article' },
      { property: 'og:title',              content: title },
      { property: 'og:description',        content: description },
      { property: 'og:image',              content: imageUrl },
      { property: 'og:url',               content: window.location.href },
      { property: 'og:site_name',          content: 'Butler Coffee' },
      { name:     'twitter:card',          content: 'summary_large_image' },
      { name:     'twitter:title',         content: title },
      { name:     'twitter:description',   content: description },
      { name:     'twitter:image',         content: imageUrl },
    ]

    const injected = []
    tags.forEach(({ property, name, content }) => {
      if (!content) return
      const attr  = property ? 'property' : 'name'
      const value = property || name
      let el = document.querySelector(`meta[${attr}="${value}"]`)
      const isNew = !el
      if (isNew) {
        el = document.createElement('meta')
        el.setAttribute(attr, value)
        document.head.appendChild(el)
      }
      const prev = el.getAttribute('content')
      el.setAttribute('content', content)
      injected.push({ el, isNew, prev })
    })

    return () => {
      document.title = prevTitle
      injected.forEach(({ el, isNew, prev }) => {
        if (isNew) el.remove()
        else el.setAttribute('content', prev || '')
      })
    }
  }, [title, description, imageUrl])
}

/** Normalize Google Drive share URLs to thumbnail image URLs.
 *  Uses the thumbnail endpoint which is not subject to the deprecated uc?export=view block. */
export function normalizeDriveUrl(url) {
  if (!url) return ''
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`
  const m2 = url.match(/id=([a-zA-Z0-9_-]+)/)
  if (m2) return `https://drive.google.com/thumbnail?id=${m2[1]}&sz=w1200`
  return url
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { usePosts, formatDate, normalizeDriveUrl } from '../data/blogApi'
import Layout from '../components/Layout'
import './Blog.css'

export default function Blog() {
  const { lang, t } = useLang()
  const isEs = lang === 'es'
  const { posts, loading } = usePosts()
  const [activeCategory, setActiveCategory] = useState('all')

  // Build unique category list from posts
  const categories = ['all', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]

  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === activeCategory)

  // Featured post = first featured, or first post
  const hero = posts.find(p => p.featured) || posts[0]
  const rest  = filtered.filter(p => !hero || p.id !== hero.id)

  return (
    <Layout>

      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/" className="page-hero__back">{t('back_home')}</Link>
            <span className="badge">{isEs ? 'Del Grano a la Taza' : 'From the Grind'}</span>
          </div>
          <h1 className="page-hero__title">
            {isEs ? <>Últimas <em>lecturas.</em></> : <>Latest <em>reads.</em></>}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Guías de preparación, ciencia del café y todo lo que necesitas saber para elevar tu taza.'
              : 'Brew guides, coffee science, and everything you need to know to elevate your cup.'}
          </p>
        </div>
      </section>

      {/* ── FEATURED POST ─────────────────────────────────────────────────── */}
      {hero && (
        <section className="section blog-featured-section">
          <div className="wrap">
            <Link to={`/blog/${hero.slug}`} className="blog-featured">
              <div className="blog-featured__img">
                {hero.imageUrl
                  ? <img src={normalizeDriveUrl(hero.imageUrl)} alt={hero.imageAlt || hero[`title_${lang}`]} />
                  : <div className="blog-featured__img-placeholder"><span>☕</span></div>
                }
              </div>
              <div className="blog-featured__body">
                {hero.category && <span className="badge blog-featured__cat">{hero.category}</span>}
                <h2 className="blog-featured__title">
                  {hero[`title_${lang}`] || hero.title_en}
                </h2>
                <p className="blog-featured__excerpt">
                  {hero[`excerpt_${lang}`] || hero.excerpt_en}
                </p>
                <div className="blog-featured__meta">
                  {hero.author && <span>{hero.author}</span>}
                  {hero.updatedAt && <span>{formatDate(hero.updatedAt, lang)}</span>}
                </div>
                <span className="blog-featured__cta">
                  {isEs ? 'Leer artículo →' : 'Read article →'}
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── CATEGORY FILTER + GRID ────────────────────────────────────────── */}
      <section className="section surf-section">
        <div className="wrap">

          {categories.length > 1 && (
            <div className="blog-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`blog-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'all' ? (isEs ? 'Todos' : 'All') : cat}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="blog-loading">
              {isEs ? 'Cargando artículos…' : 'Loading posts…'}
            </div>
          )}

          {!loading && rest.length === 0 && (
            <p className="blog-empty">
              {isEs ? 'No hay artículos en esta categoría todavía.' : 'No posts in this category yet.'}
            </p>
          )}

          <div className="blog-grid">
            {rest.map(post => (
              <PostCard key={post.id} post={post} lang={lang} isEs={isEs} />
            ))}
          </div>
        </div>
      </section>

    </Layout>
  )
}

function PostCard({ post, lang, isEs }) {
  const title   = post[`title_${lang}`]   || post.title_en
  const excerpt = post[`excerpt_${lang}`] || post.excerpt_en

  return (
    <Link to={`/blog/${post.slug}`} className="post-card">
      <div className="post-card__img">
        {post.imageUrl
          ? <img src={normalizeDriveUrl(post.imageUrl)} alt={post.imageAlt || title} />
          : <span style={{ fontSize: '2.2rem', opacity: 0.12 }}>☕</span>
        }
      </div>
      <div className="post-card__body">
        {post.category && (
          <span className="post-card__cat">{post.category}</span>
        )}
        <h3 className="post-card__title">{title}</h3>
        {excerpt && <p className="post-card__excerpt">{excerpt}</p>}
        <div className="post-card__meta">
          {post.author && <span>{post.author}</span>}
          {post.updatedAt && <span>{formatDate(post.updatedAt, lang)}</span>}
        </div>
        <span className="post-card__link">{isEs ? 'Leer →' : 'Read →'}</span>
      </div>
    </Link>
  )
}

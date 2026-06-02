import { Link, useParams, Navigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { usePosts, getPostBySlug, formatDate, renderContent, normalizeDriveUrl, readingTime, usePageMeta } from '../data/blogApi'
import Layout from '../components/Layout'
import './BlogPost.css'

export default function BlogPost() {
  const { slug } = useParams()
  const { lang, t } = useLang()
  const isEs = lang === 'es'
  const { posts, loading } = usePosts()

  const post = getPostBySlug(posts, slug)

  // While loading, show nothing to avoid flash redirect
  if (loading && !post) return null
  if (!post) return <Navigate to="/blog" replace />

  const title   = post[`title_${lang}`]   || post.title_en
  const content = post[`content_${lang}`] || post.content_en
  const excerpt = post[`excerpt_${lang}`] || post.excerpt_en
  const mins    = readingTime(content)

  // OG + twitter meta tags + document.title for this article
  usePageMeta({
    title,
    description: excerpt,
    imageUrl: post.imageUrl ? normalizeDriveUrl(post.imageUrl) : undefined,
  })

  // Related posts: same category, excluding current
  const related = posts
    .filter(p => p.id !== post.id && p.category && p.category === post.category)
    .slice(0, 3)

  // Fall back to latest posts if no same-category posts
  const suggestions = related.length
    ? related
    : posts.filter(p => p.id !== post.id).slice(0, 3)

  return (
    <Layout>

      {/* ── OFF-WHITE CANVAS: hero + cover + body ─────────────────────────── */}
      <div className="post-canvas">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="post-hero">
          <div className="post-wrap">
            <div className="post-hero__eyebrow">
              <Link to="/blog" className="post-hero__back">{t('back_blog')}</Link>
              {post.category && <span className="badge">{post.category}</span>}
            </div>

            <h1 className="post-hero__title">{title}</h1>

            {excerpt && <p className="post-hero__excerpt">{excerpt}</p>}

            <div className="post-hero__meta">
              {post.author && <span>{post.author}</span>}
              {post.updatedAt && <span>{formatDate(post.updatedAt, lang)}</span>}
              <span>{mins} {isEs ? `min de lectura` : `min read`}</span>
            </div>
          </div>
        </section>

        {/* ── COVER IMAGE ───────────────────────────────────────────────── */}
        {post.imageUrl && (
          <div className="post-cover">
            <div className="post-wrap">
              <div className="post-cover__img-wrap">
                <img
                  src={normalizeDriveUrl(post.imageUrl)}
                  alt={post.imageAlt || title}
                  className="post-cover__img"
                />
                {post.imageCredit && (
                  <p className="post-cover__credit">{post.imageCredit}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        <div className="post-body">
          <div className="post-wrap">
            {content
              ? <div className="post-content" dangerouslySetInnerHTML={{ __html: renderContent(content) }} />
              : (
                <div className="post-content post-content--empty">
                  <p>{isEs ? 'Contenido próximamente.' : 'Content coming soon.'}</p>
                </div>
              )
            }

            {/* ── BYLINE ────────────────────────────────────────────────── */}
            {(post.author || post.updatedAt) && (
              <div className="post-byline">
                <hr className="post-byline__rule" />
                {post.author && (
                  <p className="post-byline__author">
                    {isEs ? 'Escrito por' : 'Written by'} <strong>{post.author}</strong>
                  </p>
                )}
                {post.updatedAt && (
                  <p className="post-byline__date">{formatDate(post.updatedAt, lang)}</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>{/* end post-canvas */}

      {/* ── MORE POSTS ──────────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <section className="section surf-section">
          <div className="wrap">
            <div className="sh sh--center">
              <span className="badge">{isEs ? 'Seguir Leyendo' : 'Keep Reading'}</span>
              <h2 className="section-title">
                {isEs ? 'Más artículos.' : 'More articles.'}
              </h2>
            </div>

            <div className="post-related-grid">
              {suggestions.map(p => {
                const t2 = p[`title_${lang}`] || p.title_en
                const ex = p[`excerpt_${lang}`] || p.excerpt_en
                return (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="post-related-card">
                    <div className="post-related-card__img">
                      {p.imageUrl
                        ? <img src={normalizeDriveUrl(p.imageUrl)} alt={p.imageAlt || t2} />
                        : <span style={{ fontSize: '2rem', opacity: 0.12 }}>☕</span>
                      }
                    </div>
                    <div className="post-related-card__body">
                      {p.category && <span className="post-card__cat">{p.category}</span>}
                      <h3 className="post-related-card__title">{t2}</h3>
                      {ex && <p className="post-related-card__excerpt">{ex}</p>}
                      <div className="post-card__meta">
                        {p.author    && <span>{p.author}</span>}
                        {p.updatedAt && <span>{formatDate(p.updatedAt, lang)}</span>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

    </Layout>
  )
}

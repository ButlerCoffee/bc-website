import { useState, useEffect } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useMachines, getMachineBySlug, getMachinesByBrand } from '../data/machinesApi'
import { renderMarkdown } from '../data/blogApi'
import Layout from '../components/Layout'
import './MachinePage.css'

export default function MachinePage() {
  const { machine: slug } = useParams()
  const { lang, t } = useLang()
  const { machines, loading } = useMachines()
  const isEs = lang === 'es'

  const machine = getMachineBySlug(machines, slug)
  const [activeImg, setActiveImg] = useState(0)

  // Reset the selected gallery image whenever the machine changes.
  useEffect(() => { setActiveImg(0) }, [machine?.id])

  // While loading, show nothing (avoids flash redirect on first render)
  if (loading && !machine) return null
  if (!machine) return <Navigate to="/machines" replace />

  const related = getMachinesByBrand(machines, machine.brand).filter(m => m.id !== machine.id)
  const gallery = machine.images || []
  const tagText = (machine.tag?.[lang] || machine.tag?.en || '').trim()
  const idealText = (machine.ideal?.[lang] || machine.ideal?.en || '').trim()

  return (
    <Layout>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="machine-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/machines" className="page-hero__back">{t('back_machines')}</Link>
            {tagText && <span className="badge">{tagText}</span>}
          </div>

          <div className="machine-hero__layout">
            <div className="machine-hero__gallery">
              <div className="machine-hero__img">
                {gallery.length > 0
                  ? <img src={gallery[activeImg] || gallery[0]} alt={machine.name} />
                  : (
                    <>
                      <span style={{ fontSize: '8rem', opacity: 0.12 }}>☕</span>
                      <div className="machine-hero__img-label">{isEs ? 'Imagen próximamente' : 'Image coming soon'}</div>
                    </>
                  )}
              </div>
              {gallery.length > 1 && (
                <div className="machine-hero__thumbs">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      className={`machine-hero__thumb ${i === activeImg ? 'is-active' : ''}`}
                      onClick={() => setActiveImg(i)}
                    >
                      <img src={src} alt={`${machine.name} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="machine-hero__info">
              <div className="machine-hero__brand">{machine.brandName}</div>
              <h1 className="machine-hero__name">{machine.name}</h1>
              <p className="machine-hero__tagline">{machine.tagline[lang] || machine.tagline.en}</p>
              <div
                className="machine-hero__desc md-rendered"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(machine.detail[lang] || machine.detail.en) }}
              />

              {idealText && (
                <div className="machine-hero__ideal">
                  <span>{isEs ? 'Ideal para:' : 'Ideal for:'}</span>
                  <strong>{idealText}</strong>
                </div>
              )}

              <div className="machine-hero__price">
                <div>
                  <span className="machine-hero__price-from">{isEs ? 'Desde' : 'From'}</span>
                  <span className="machine-hero__price-num">€{machine.price.toLocaleString()}</span>
                </div>
                <div className="machine-hero__actions">
                  <Link to="/contact" className="btn btn--yellow">{t('request_quote')}</Link>
                  <Link to="/subs" className="btn btn--ghost">{isEs ? 'Ver suscripciones' : 'See subscriptions'}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECS ───────────────────────────────────────────────────────── */}
      <section className="section surf-section">
        <div className="wrap">
          <div className="machine-detail__layout">

            {/* Specs table */}
            <div>
              <h2 className="machine-section-title">{isEs ? 'Especificaciones' : 'Specifications'}</h2>
              <div className="specs-table">
                {(machine.specs[lang] || machine.specs.en).map(s => (
                  <div className="spec-row" key={s.label}>
                    <span className="spec-row__label">{s.label}</span>
                    <span className="spec-row__val">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="machine-section-title">{isEs ? 'Características' : 'Features'}</h2>
              <div className="machine-feats">
                {(machine.features[lang] || machine.features.en).map(f => (
                  <div className="machine-feat" key={f}>
                    <span className="machine-feat__check">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BUNDLE CTA ──────────────────────────────────────────────────── */}
      <div className="cta-band">
        <div className="wrap">
          <h2 className="cta-band__title">
            {isEs ? `Llévate la ${machine.name} con café incluido.` : `Bundle the ${machine.name} with beans.`}
          </h2>
          <p className="cta-band__sub">
            {isEs
              ? 'Combina tu máquina con una suscripción Butler y recibe café calibrado específicamente para ella, cada mes.'
              : 'Pair your machine with a Butler subscription and get beans dialled specifically for it, every month.'}
          </p>
          <div className="cta-band__actions">
            <Link to="/contact" className="btn btn--yellow">{t('request_quote')}</Link>
            <Link to="/subs"    className="btn btn--ghost">{isEs ? 'Ver niveles →' : 'Explore tiers →'}</Link>
          </div>
        </div>
      </div>

      {/* ── RELATED ─────────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="section surf-section">
          <div className="wrap">
            <div className="sh sh--center">
              <span className="badge">{isEs ? 'También de' : 'Also from'} {machine.brandName}</span>
              <h2 className="section-title">{isEs ? 'Más modelos.' : 'More models.'}</h2>
            </div>
            <div className="related-grid">
              {related.map(m => (
                <Link key={m.id} to={`/machines/${m.slug}`} className="related-card">
                  <div className="related-card__img">
                    {m.images?.[0]
                      ? <img src={m.images[0]} alt={m.name} loading="lazy" />
                      : <span style={{ fontSize: '2.5rem', opacity: 0.15 }}>☕</span>}
                  </div>
                  <div className="related-card__body">
                    <div className="related-card__brand">{m.brandName}</div>
                    <h3 className="related-card__name">{m.name}</h3>
                    <p className="related-card__desc">{m.tagline[lang] || m.tagline.en}</p>
                    <div className="related-card__footer">
                      <span className="related-card__price">€{m.price.toLocaleString()}</span>
                      <span className="related-card__link">{isEs ? 'Ver →' : 'View →'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </Layout>
  )
}

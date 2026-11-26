import { useState } from 'react'
import { Link, useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTiers, getTierBySlug } from '../data/subsApi'
import { renderMarkdown } from '../data/blogApi'
import Layout from '../components/Layout'
import AddToCart from '../components/AddToCart'
import './SubTier.css'
import { fmtEur } from '../data/format'
import { useCart, CART_ENABLED, GRINDS, MAX_QTY, FREE_SHIPPING_FROM } from '../context/CartContext'

/**
 * Coffee tier page. fixedMode:
 *  'sub'  → /subscriptions/:tier  (subscribe only)
 *  'once' → /store/coffee/:tier   (one-off only, with the Store sub-menu)
 */
export default function SubTier({ fixedMode }) {
  const { tier: slug } = useParams()
  const { lang, t } = useLang()
  const { tiers, loading } = useTiers()
  const tier = getTierBySlug(tiers, slug)
  const isEs = lang === 'es'

  const [params] = useSearchParams()

  // ?size=…&type=sub|once (from the home page cards) pre-select the buy card
  const [chosenSize, setSize] = useState(() => {
    const wanted = params.get('size')
    return tier?.sizes?.some(s => s.label === wanted) ? wanted : (tier?.sizes?.[0]?.label || '')
  })
  const cart = useCart()
  const [chosenMode, setMode] = useState(() => {
    if (fixedMode) return fixedMode
    const wanted = params.get('type')
    return ['sub', 'once'].includes(wanted) ? wanted : (cart.cartType || 'sub')
  })   // 'sub' | 'once'
  const mode = fixedMode || chosenMode
  const [grind, setGrind] = useState('whole')
  const [qty, setQty] = useState(1)


  // While loading don't flash-redirect; once loaded redirect if slug unknown
  if (loading && !tier) return null
  const base = fixedMode === 'once' ? '/store/coffee' : '/subscriptions'
  if (!tier) return <Navigate to={base} replace />
  // Size must exist for this tier (e.g. Summit is 200g only)
  const size = tier.sizes.some(s => s.label === chosenSize) ? chosenSize : (tier.sizes[0]?.label || '')

  const currentSize = tier.sizes.find(s => s.label === size) || tier.sizes[0]
  const stripeLink  = tier.stripeLinks?.[size] || '#'
  const onceLink    = tier.oneOffLinks?.[size]
  const tierIndex   = tiers.findIndex(t => t.id === tier.id)
  const prevTier    = tierIndex > 0 ? tiers[tierIndex - 1] : null
  const nextTier    = tierIndex < tiers.length - 1 ? tiers[tierIndex + 1] : null

  return (
    <Layout title={tier?.name}>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className={`tier-hero ${tier.featured ? 'tier-hero--feat' : ''}`}>
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to={base} className="page-hero__back">
              {fixedMode === 'once' ? (isEs ? '← Todo el café' : '← All coffee') : t('back_subs')}
            </Link>
          </div>

          <div className="tier-hero__layout">
            <div className="tier-hero__text">
              <img className="tier-hero__img" src={tier.image} alt={tier.name} />
              <h1 className="tier-hero__name">{tier.name}</h1>
              <p className="tier-hero__tagline">{tier.tagline}</p>
              <div className="tier-hero__pills">
                {tier.pills.map(p => <span key={p} className="tier__pill">{p}</span>)}
              </div>
              <div
                className="tier-hero__desc md-rendered"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(tier.detail[lang] || tier.detail.en) }}
              />
            </div>

            <div className="tier-hero__buy" id="buy">
              <div className="tier-buy-card">
                {tier.featured && (
                  <div className="tier-buy-card__pop">{tier.popularLabel?.[lang] || 'Most Popular'}</div>
                )}

                {/* Taste profile */}
                <div className="tier-buy-card__profile">
                  <div className="profile-row">
                    <span>{isEs ? 'Composición' : 'Composition'}</span>
                    <span>{tier.composition[lang]}</span>
                  </div>
                  <div className="profile-row">
                    <span>{isEs ? 'Sabor' : 'Flavor'}</span>
                    <span>{tier.flavor[lang]}</span>
                  </div>
                  <div className="profile-row">
                    <span>{isEs ? 'Estructura' : 'Structure'}</span>
                    <span>{tier.structure[lang]}</span>
                  </div>
                  <div className="profile-row">
                    <span>{isEs ? 'Propósito' : 'Purpose'}</span>
                    <span>{tier.purpose[lang]}</span>
                  </div>
                </div>

                <hr className="tier-buy-card__rule" />

                {/* Size picker */}
                <div className="tier__size-lbl">{isEs ? 'Elige el tamaño' : 'Select size'}</div>
                <div className="tier__sizes tier-buy-card__sizes">
                  {tier.sizes.map(s => (
                    <button
                      key={s.label}
                      className={`sz ${size === s.label ? 'on' : ''}`}
                      onClick={() => setSize(s.label)}
                    >
                      <span className="sz-label">{s.label}</span>
                      <span className="sz-price">{fmtEur(s.price, lang)}</span>
                    </button>
                  ))}
                </div>

                {CART_ENABLED ? (
                  <>
                    {/* Purchase type (hidden when the page is fixed to one mode) */}
                    {!fixedMode && <div className="buy-mode" role="radiogroup" aria-label={isEs ? 'Tipo de compra' : 'Purchase type'}>
                      {[
                        { id: 'sub',  label: isEs ? 'Suscripción' : 'Subscribe', hint: isEs ? 'cada mes' : 'every month' },
                        { id: 'once', label: isEs ? 'Compra única' : 'One-off',  hint: isEs ? 'sin suscripción' : 'no subscription' },
                      ].map(m => (
                        <button
                          key={m.id} role="radio" aria-checked={mode === m.id}
                          className={`buy-mode__opt ${mode === m.id ? 'on' : ''}`}
                          onClick={() => setMode(m.id)}
                        >
                          <span className="buy-mode__label">{m.label}</span>
                          <span className="buy-mode__hint">{m.hint}</span>
                        </button>
                      ))}
                    </div>}

                    {/* Grind + quantity */}
                    <div className="buy-opts">
                      <label className="buy-opts__grind">
                        <span className="tier__size-lbl">{isEs ? 'Molienda' : 'Grind'}</span>
                        <select value={grind} onChange={e => setGrind(e.target.value)}>
                          {GRINDS.map(g => <option key={g.id} value={g.id}>{g[lang] || g.en}</option>)}
                        </select>
                      </label>
                      <div className="buy-opts__qty">
                        <span className="tier__size-lbl">{isEs ? 'Bolsas' : 'Bags'}</span>
                        <div className="qty" role="group" aria-label={isEs ? 'Cantidad' : 'Quantity'}>
                          <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={isEs ? 'Quitar una' : 'Decrease'}>−</button>
                          <span>{qty}</span>
                          <button onClick={() => setQty(q => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label={isEs ? 'Añadir una' : 'Increase'}>+</button>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="tier-buy-card__price">
                      <span className="tier-buy-card__price-num">{fmtEur(currentSize.price * qty, lang)}</span>
                      {mode === 'sub' && <span className="tier-buy-card__price-per">{isEs ? '/ mes' : '/ mo.'}</span>}
                    </div>
                    <p className="tier-buy-card__note">
                      {qty > 1 ? `${qty} × ` : ''}{isEs ? `bolsa de ${size}` : `${size} bag`}
                      {' · '}
                      {currentSize.price * qty >= FREE_SHIPPING_FROM
                        ? (isEs ? 'envío gratis' : 'free shipping')
                        : (isEs ? 'envío gratis desde 30 €' : 'free shipping from €30')}
                    </p>

                    {/* Both order types; this page's type gets the yellow button */}
                    {[mode, mode === 'sub' ? 'once' : 'sub'].map((type, i) => (
                      <AddToCart
                        key={type}
                        item={{ type, tierId: tier.id, size, grind, qty }}
                        onAdded={() => setQty(1)}
                        className={`btn btn--full ${i === 0 ? 'btn--yellow' : 'btn--ghost'}`}
                        label={type === 'sub'
                          ? (isEs ? 'Añadir suscripción' : 'Add Subscription')
                          : (isEs ? 'Añadir bolsa al carrito' : 'Add bag to cart')}
                      />
                    ))}
                    <p className="tier-buy-card__legal">
                      {mode === 'sub'
                        ? (isEs ? 'Sin compromiso. Cancela cuando quieras.' : 'No commitment. Cancel any time.')
                        : (isEs ? 'Un único envío, sin suscripción.' : 'A single delivery, no subscription.')}
                      <br />
                      {isEs ? 'Envíos a España, Portugal y Andorra.' : 'Ships to Spain, Portugal and Andorra.'}
                    </p>
                  </>
                ) : (
                <>
                {/* Price */}
                <div className="tier-buy-card__price">
                  <span className="tier-buy-card__price-from">{isEs ? 'desde' : 'from'}</span>
                  <span className="tier-buy-card__price-num">{fmtEur(currentSize.price, lang)}</span>
                  <span className="tier-buy-card__price-per">{isEs ? '/ mes' : '/ mo.'}</span>
                </div>
                <p className="tier-buy-card__note">
                  {isEs ? `bolsa de ${size}` : `${size} bag`}
                  {' · '}{isEs ? 'suscripción mensual' : 'monthly subscription'}
                </p>

                <a href={stripeLink} className={`btn btn--full ${tier.featured ? 'btn--yellow' : 'btn--ghost'}`} style={{ marginTop: 4 }}>
                  {t('start_sub')}
                </a>
                <p className="tier-buy-card__legal">
                  {isEs ? 'Sin compromiso. Cancela cuando quieras.' : 'No commitment. Cancel any time.'}
                </p>
                {onceLink && (
                  <a href={onceLink} className="btn btn--full btn--ghost tier-buy-card__once">
                    {t('buy_once')}
                  </a>
                )}
                {onceLink && (
                  <p className="tier-buy-card__legal">
                    {currentSize.price >= 30
                      ? (isEs ? 'Sin suscripción. Envío gratis.' : 'No subscription. Free shipping.')
                      : (isEs
                        ? 'Sin suscripción. Envío 5€, gratis desde 30€ con el código ENVIO30.'
                        : 'No subscription. Shipping €5, free from €30 with code ENVIO30.')}
                  </p>
                )}
                </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED (subscriptions) ─────────────────────────────── */}
      {mode === 'sub' && <section className="section surf-section">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Qué incluye' : "What's included"}</span>
            <h2 className="section-title">
              {isEs ? 'Lo que obtienes cada mes.' : 'What you get every month.'}
            </h2>
          </div>
          <div className="tier-features-grid">
            {tier.features[lang].map((f, i) => (
              <div className="tier-feature" key={i}>
                <span className="tier-feature__check">✓</span>
                <span>{f}</span>
              </div>
            ))}
            {[
              { en: 'Free shipping from €30', es: 'Envío gratis a partir de 30€' },
              { en: 'Cancel any time via Portal', es: 'Cancela cuando quieras desde el Portal' },
              { en: 'Freshness guaranteed', es: 'Frescura garantizada' },
              { en: 'Whole bean or ground', es: 'Grano entero o molido' },
            ].map((f, i) => (
              <div className="tier-feature" key={`extra-${i}`}>
                <span className="tier-feature__check">✓</span>
                <span>{f[lang] || f.en}</span>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* ── OTHER TIERS ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Explorar' : 'Explore'}</span>
            <h2 className="section-title">
              {isEs ? 'Otros niveles.' : 'Other tiers.'}
            </h2>
          </div>
          <div className="tier-nav-grid">
            {tiers.filter(t => t.id !== tier.id).map(other => (
              <Link key={other.id} to={`${base}/${other.slug}`} className="tier-nav-card">
                <div className="tier-nav-card__oval">
                  <img src={other.thumb || other.image} alt={other.name} className="tier-nav-card__duck" loading="lazy" decoding="async" />
                </div>
                <div>
                  <div className="tier-nav-card__name">{other.name}</div>
                  <div className="tier-nav-card__price">
                    {isEs ? 'desde' : 'from'} {fmtEur(other.price, lang)}/{other.unit}
                  </div>
                </div>
                <span className="tier-nav-card__arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  )
}

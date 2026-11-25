import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTiers } from '../data/subsApi'
import { useProducts, productsIn } from '../data/productsApi'
import { GRINDS, MAX_QTY, FREE_SHIPPING_FROM } from '../context/CartContext'
import { fmtEur } from '../data/format'
import Layout from '../components/Layout'
import AddToCart from '../components/AddToCart'
import TierBuyCard from '../components/TierBuyCard'
import { renderMarkdown } from '../data/blogApi'
import './Store.css'
import './SubTier.css'
import './Subs.css'

/**
 * A coffee product from the admin (e.g. Pack Navidad) as its own section:
 * photo, description, price and add to cart. With no product yet, shows the
 * Pack Navidad placeholder.
 */
function FeatureProduct({ p, lang }) {
  const isEs = lang === 'es'
  const [grind, setGrind] = useState('whole')
  const [qty, setQty] = useState(1)
  const placeholder = !p
  const name = p ? p.name[lang] : 'Pack Navidad'
  const img = p?.images?.[0]
  const price = p?.price || 0

  return (
    <section className={`feature-product ${placeholder ? 'feature-product--soon' : ''}`} aria-labelledby={`fp-${p?.slug || 'navidad'}`}>
      <div className={`feature-product__media ${img ? '' : 'feature-product__media--placeholder'}`}>
        <img src={img || '/BC_outlineLogo.svg'} alt={img ? name : ''} loading="lazy" decoding="async" />
        {placeholder
          ? <span className="pcard__badge">{isEs ? 'Próximamente' : 'Coming soon'}</span>
          : p.soldOut
            ? <span className="pcard__badge pcard__badge--muted">{isEs ? 'Agotado' : 'Sold out'}</span>
            : p.badge[lang] && <span className="pcard__badge">{p.badge[lang]}</span>}
      </div>

      <div className="feature-product__info">
        <h2 id={`fp-${p?.slug || 'navidad'}`} className="feature-product__name">{name}</h2>
        {placeholder ? (
          <p className="feature-product__desc">
            {isEs
              ? 'Nuestro pack de Navidad llega muy pronto. Foto, descripción y precio, en breve.'
              : 'Our Christmas pack is coming soon. Photo, description and price to follow.'}
          </p>
        ) : p.description[lang] && (
          <div className="feature-product__desc md-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.description[lang]) }} />
        )}

        <div className="feature-product__buy">
          <div className="pcard__price">
            {placeholder ? '€—' : fmtEur(price * qty, lang)}
            {p?.size && <small>{qty > 1 ? `${qty} × ` : ''}{p.size}</small>}
          </div>

          {!placeholder && !p.soldOut && (
            <div className="buy-opts" style={{ marginBottom: 0 }}>
              {p.grind && (
                <label className="buy-opts__grind">
                  <span className="tier__size-lbl">{isEs ? 'Molienda' : 'Grind'}</span>
                  <select value={grind} onChange={e => setGrind(e.target.value)}>
                    {GRINDS.map(g => <option key={g.id} value={g.id}>{g[lang] || g.en}</option>)}
                  </select>
                </label>
              )}
              <div className="buy-opts__qty">
                <span className="tier__size-lbl">{isEs ? 'Cantidad' : 'Quantity'}</span>
                <div className="qty" role="group" aria-label={isEs ? 'Cantidad' : 'Quantity'}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label={isEs ? 'Quitar uno' : 'Decrease'}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label={isEs ? 'Añadir uno' : 'Increase'}>+</button>
                </div>
              </div>
            </div>
          )}

          {placeholder || p.soldOut ? (
            <button className="btn btn--full btn--ghost" disabled>
              {placeholder ? (isEs ? 'Muy pronto' : 'Coming soon') : (isEs ? 'Agotado' : 'Sold out')}
            </button>
          ) : (
            <AddToCart item={{ type: 'once', productId: p.slug, grind: p.grind ? grind : '', qty }} onAdded={() => setQty(1)} />
          )}
        </div>
      </div>
    </section>
  )
}

/** Short side-by-side of the four tiers. */
function TierChart({ tiers, lang }) {
  const isEs = lang === 'es'
  const rows = [
    { label: isEs ? 'Composición' : 'Composition', get: t => t.composition?.[lang] },
    { label: isEs ? 'Sabor' : 'Flavor',            get: t => t.flavor?.[lang] },
    { label: isEs ? 'Estructura' : 'Structure',    get: t => t.structure?.[lang] },
    { label: isEs ? 'Tamaños' : 'Sizes',           get: t => t.sizes.map(s => s.label).join(' · ') },
    { label: isEs ? 'Desde' : 'From',              get: t => fmtEur(Math.min(...t.sizes.map(s => s.price)), lang) },
  ]
  return (
    <div className="tier-chart" role="region" aria-label={isEs ? 'Comparativa de niveles' : 'Tier comparison'} tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">{isEs ? 'Característica' : 'Feature'}</span></th>
            {tiers.map(t => (
              <th scope="col" key={t.id} className={t.featured ? 'is-feat' : ''}>
                <Link to={`/store/coffee/${t.slug}`}>{t.name.replace(/ Coffee$/, '')}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              {tiers.map(t => <td key={t.id} className={t.featured ? 'is-feat' : ''}>{r.get(t) || '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** /store/coffee — one-off bags from each tier, plus coffee products from the admin. */
export default function StoreCoffee() {
  const { lang, t } = useLang()
  const isEs = lang === 'es'
  const { tiers } = useTiers()
  const { products } = useProducts()
  const extras = productsIn(products, 'coffee')
  const hasNavidad = extras.some(p => /navidad|christmas/i.test(`${p.slug} ${p.name.en} ${p.name.es}`))

  return (
    <Layout title={isEs ? 'Café' : 'Coffee'}>
      {/* ── INTRO ─────────────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/" className="page-hero__back">{t('back_home')}</Link>
            <span className="badge">{isEs ? 'Café por bolsa' : 'Coffee by the Bag'}</span>
          </div>
          <h1 className="page-hero__title">{isEs ? 'Café por bolsa.' : 'Coffee by the bag.'}</h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Tú eliges el nivel; nosotros seleccionamos el café. Una compra única, sin suscripción: elige tamaño y molienda y te lo enviamos recién tostado.'
              : 'You choose the tier, we handpick the coffee. A one-time purchase with no subscription: pick a size and grind and we ship it freshly roasted.'}
          </p>

          <div className="subs-hero__stats">
            {[
              { num: String(tiers.length || 4), label: isEs ? 'Niveles' : 'Tiers' },
              { num: '200g–1kg', label: isEs ? 'Tamaños' : 'Bag sizes' },
              { num: '8', label: isEs ? 'Moliendas' : 'Grinds' },
              { num: fmtEur(30, lang), label: isEs ? 'Envío gratis desde' : 'Free shipping from' },
            ].map(st => (
              <div className="stat" key={st.label}>
                <span className="stat__num">{st.num}</span>
                <span className="stat__label">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="wrap">
          <p className="bag-note">
            {isEs
              ? 'Elige un nivel y te seleccionamos a mano un café de ese nivel.'
              : 'Pick a tier and we’ll handpick a coffee from that tier for you.'}
          </p>
          <div className="pgrid pgrid--four">
            {tiers.map(t => <TierBuyCard key={t.id} tier={t} lang={lang} mode="once" />)}
          </div>

          <h2 className="section-title" style={{ marginTop: 72 }}>{isEs ? 'Compara los niveles.' : 'Compare the tiers.'}</h2>
          <TierChart tiers={tiers} lang={lang} />

          {/* Coffee products from the admin (Pack Navidad etc.), each in its own section */}
          {extras.map(p => <FeatureProduct key={p.slug} p={p} lang={lang} />)}
          {!hasNavidad && <FeatureProduct p={null} lang={lang} />}

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <Link to="/subscriptions" className="btn btn--yellow btn--lg">
              {isEs ? 'Ver suscripciones' : 'Shop subscriptions'}
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}

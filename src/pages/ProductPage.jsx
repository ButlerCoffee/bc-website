import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useProducts, getProduct } from '../data/productsApi'
import { GRINDS, MAX_QTY, FREE_SHIPPING_FROM } from '../context/CartContext'
import { renderMarkdown } from '../data/blogApi'
import { fmtEur } from '../data/format'
import Layout from '../components/Layout'
import AddToCart from '../components/AddToCart'
import './Store.css'
import './SubTier.css'

/** /store/product/:slug — a special coffee or a goods item. */
export default function ProductPage() {
  const { slug } = useParams()
  const { lang } = useLang()
  const isEs = lang === 'es'
  const { products, loading } = useProducts()
  const p = getProduct(products, slug)
  const [img, setImg] = useState(0)
  const [broken, setBroken] = useState([])   // photos that failed to load are skipped
  const [grind, setGrind] = useState('whole')
  const [qty, setQty] = useState(1)

  if (!p) return loading ? null : <Navigate to="/store/coffee" replace />

  const back = p.category === 'goods' ? '/store/goods' : '/store/coffee'
  const images = p.images.filter(u => !broken.includes(u))
  const current = images[Math.min(img, images.length - 1)]
  const markBroken = u => setBroken(b => (b.includes(u) ? b : [...b, u]))
  const total = p.price * qty

  return (
    <Layout title={p.name[lang]}>
      <section className="pdp">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to={back} className="page-hero__back">
              ← {p.category === 'goods' ? (isEs ? 'Productos' : 'Goods') : (isEs ? 'Café' : 'Coffee')}
            </Link>
          </div>

          <div className="pdp__grid">
            <div>
              <div className="pdp__main">
                {current
                  ? <img src={current} alt={p.name[lang]} onError={() => markBroken(current)} />
                  : <img src="/BC_outlineLogo.svg" alt="" style={{ width: 140, height: 140, objectFit: 'contain', opacity: 0.4 }} />}
              </div>
              {images.length > 1 && (
                <div className="pdp__thumbs">
                  {images.map((u, i) => (
                    <button key={u + i} className={u === current ? 'on' : ''} onClick={() => setImg(i)} aria-label={`${isEs ? 'Foto' : 'Photo'} ${i + 1}`}>
                      <img src={u} alt="" onError={() => markBroken(u)} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pdp__info">
              {p.badge[lang] && <span className="badge" style={{ alignSelf: 'flex-start' }}>{p.badge[lang]}</span>}
              <h1 className="pdp__name">{p.name[lang]}</h1>
              {p.tagline[lang] && <p className="pdp__tagline">{p.tagline[lang]}</p>}

              <div className="pdp__buy">
                <div className="pdp__price">
                  {fmtEur(total, lang)}
                </div>

                {!p.soldOut && (
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

                {p.soldOut ? (
                  <button className="btn btn--full btn--ghost" disabled>{isEs ? 'Agotado' : 'Sold out'}</button>
                ) : (
                  <AddToCart item={{ type: 'once', productId: p.slug, grind: p.grind ? grind : '', qty }} onAdded={() => setQty(1)} />
                )}
                <p className="pdp__note">
                  {isEs ? 'IVA incluido. ' : 'VAT included. '}
                  {total >= FREE_SHIPPING_FROM
                    ? (isEs ? 'Envío gratis.' : 'Free shipping.')
                    : (isEs ? 'Envío 5 €, gratis desde 30 €.' : 'Shipping €5, free from €30.')}
                  {' '}{isEs ? 'Envíos a España, Portugal y Andorra.' : 'Ships to Spain, Portugal and Andorra.'}
                </p>
              </div>

            </div>
          </div>

          {/* Full description below the photos and buying options */}
          {p.description[lang] && (
            <div className="pdp__desc pdp__desc--full md-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.description[lang]) }} />
          )}
        </div>
      </section>
    </Layout>
  )
}

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
  const [grind, setGrind] = useState('whole')
  const [qty, setQty] = useState(1)

  if (!p) return loading ? null : <Navigate to="/store/coffee" replace />

  const back = p.category === 'goods' ? '/store/goods' : '/store/coffee'
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
                {p.images[img]
                  ? <img src={p.images[img]} alt={p.name[lang]} />
                  : <img src="/BC_outlineLogo.svg" alt="" style={{ width: 140, height: 140, objectFit: 'contain', opacity: 0.4 }} />}
              </div>
              {p.images.length > 1 && (
                <div className="pdp__thumbs">
                  {p.images.map((u, i) => (
                    <button key={u + i} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`${isEs ? 'Foto' : 'Photo'} ${i + 1}`}>
                      <img src={u} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pdp__info">
              {p.badge[lang] && <span className="badge" style={{ alignSelf: 'flex-start' }}>{p.badge[lang]}</span>}
              <h1 className="pdp__name">{p.name[lang]}</h1>

              <div className="pdp__buy">
                <div className="pdp__price">
                  {fmtEur(total, lang)}
                  {p.size && <span style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 500, marginLeft: 8 }}>{qty > 1 ? `${qty} × ` : ''}{p.size}</span>}
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

              {p.description[lang] && (
                <div className="pdp__desc md-rendered" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.description[lang]) }} />
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

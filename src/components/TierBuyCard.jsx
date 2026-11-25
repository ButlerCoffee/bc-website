import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GRINDS, MAX_QTY, FREE_SHIPPING_FROM } from '../context/CartContext'
import { fmtEur } from '../data/format'
import AddToCart from './AddToCart'
import '../pages/Store.css'
import '../pages/SubTier.css'

/**
 * One coffee tier as a buy card: photo, name, size, grind, quantity, price,
 * add to cart. Same card on Coffee (mode 'once') and Subscriptions (mode 'sub').
 */
export default function TierBuyCard({ tier, lang, mode = 'once' }) {
  const isEs = lang === 'es'
  const isSub = mode === 'sub'
  const href = `${isSub ? '/subscriptions' : '/store/coffee'}/${tier.slug}`
  const [size, setSize] = useState(tier.sizes[0]?.label)
  const [grind, setGrind] = useState('whole')
  const [qty, setQty] = useState(1)
  const price = tier.sizes.find(s => s.label === size)?.price || 0
  const total = price * qty

  return (
    <article className="pcard">
      <Link to={href} className="pcard__media">
        <img src={tier.image} alt={tier.name} loading="lazy" decoding="async" />
        {tier.featured && <span className="pcard__badge">{tier.popularLabel?.[lang] || 'Most Popular'}</span>}
      </Link>
      <div className="pcard__body">
        <Link to={href} className="pcard__name">{tier.name}</Link>

        <div className="pcard__sizes" role="radiogroup" aria-label={isEs ? 'Tamaño' : 'Size'}>
          {tier.sizes.map(s => (
            <button key={s.label} role="radio" aria-checked={size === s.label}
              className={`sz ${size === s.label ? 'on' : ''}`} onClick={() => setSize(s.label)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="pcard__opts buy-opts" style={{ marginBottom: 0 }}>
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

        <div className="pcard__spacer" />
        <div className="pcard__price">
          {fmtEur(total, lang)}
          {isSub && <small>{isEs ? '/ mes' : '/ mo.'}</small>}
          <small>{total >= FREE_SHIPPING_FROM ? (isEs ? 'envío gratis' : 'free shipping') : (isEs ? '+ envío' : '+ shipping')}</small>
        </div>
        <AddToCart item={{ type: mode, tierId: tier.id, size, grind, qty }} onAdded={() => setQty(1)} />
      </div>
    </article>
  )
}

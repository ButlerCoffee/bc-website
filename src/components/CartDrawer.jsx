import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useCart, priceCart, GRINDS, MAX_QTY, FREE_SHIPPING_FROM } from '../context/CartContext'
import { useTiers } from '../data/subsApi'
import { useProducts } from '../data/productsApi'
import { fmtEur } from '../data/format'
import './CartDrawer.css'

const TXT = {
  en: {
    title: 'Your cart', close: 'Close cart', empty: 'Your cart is empty.', browse: 'Browse coffee',
    monthly: 'Monthly', once: 'One-off', remove: 'Remove', perMo: '/ mo.',
    toFree: (x) => <>Add <strong>{x}</strong> more for free shipping</>, free: 'Free shipping unlocked',
    kindSub: 'Subscription order', kindOnce: 'One-off order',
    subs: 'Subscriptions (monthly)', oneOff: 'One-off bags', shipping: 'Shipping', freeShip: 'Free',
    today: 'Due today', checkout: 'Checkout',
    note: 'VAT included · Delivery to Spain, Portugal and Andorra · Secure payment by Stripe',
    subNote: 'Subscriptions renew monthly. Cancel any time.',
    qty: 'Quantity', less: 'Decrease quantity', more: 'Increase quantity',
  },
  es: {
    title: 'Tu carrito', close: 'Cerrar carrito', empty: 'Tu carrito está vacío.', browse: 'Ver cafés',
    monthly: 'Mensual', once: 'Compra única', remove: 'Quitar', perMo: '/ mes',
    toFree: (x) => <>Añade <strong>{x}</strong> más y el envío es gratis</>, free: 'Envío gratis conseguido',
    kindSub: 'Pedido de suscripción', kindOnce: 'Pedido de compra única',
    subs: 'Suscripciones (mensual)', oneOff: 'Bolsas sueltas', shipping: 'Envío', freeShip: 'Gratis',
    today: 'A pagar hoy', checkout: 'Finalizar compra',
    note: 'IVA incluido · Envío a España, Portugal y Andorra · Pago seguro con Stripe',
    subNote: 'Las suscripciones se renuevan cada mes. Cancela cuando quieras.',
    qty: 'Cantidad', less: 'Quitar una', more: 'Añadir una',
  },
}

export default function CartDrawer() {
  const { lang } = useLang()
  const tx = TXT[lang] || TXT.en
  const { items, cartType, isOpen, close, setQty, remove, lastAdded } = useCart()
  const { tiers } = useTiers()
  const { products } = useProducts()
  const { lines, subsTotal, onceTotal, firstDelivery, shipping, total } = priceCart(items, tiers, products, lang)
  const navigate = useNavigate()
  const panelRef = useRef(null)

  // Esc closes, lock page scroll, focus the panel
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [isOpen, close])

  const grindLabel = (id) => (GRINDS.find(g => g.id === id) || {})[lang] || id
  const toFree = Math.max(0, FREE_SHIPPING_FROM - firstDelivery)
  const progress = Math.min(100, (firstDelivery / FREE_SHIPPING_FROM) * 100)

  function checkout() {
    close()
    navigate('/checkout')
  }

  return (
    <div className={`cart ${isOpen ? 'cart--open' : ''}`} aria-hidden={!isOpen}>
      <div className="cart__scrim" onClick={close} />
      <aside
        className="cart__panel" role="dialog" aria-modal="true" aria-label={tx.title}
        tabIndex={-1} ref={panelRef}
      >
        <header className="cart__head">
          <div>
            <h2 className="cart__title">{tx.title}</h2>
            {cartType && <p className="cart__kind">{cartType === 'sub' ? tx.kindSub : tx.kindOnce}</p>}
          </div>
          <button className="cart__close" onClick={close} aria-label={tx.close}>×</button>
        </header>

        {lines.length === 0 ? (
          <div className="cart__empty">
            <img src="/BC_outlineLogo.svg" alt="" className="cart__empty-logo" />
            <p>{tx.empty}</p>
            <Link to="/store/coffee" className="btn btn--yellow btn--sm" onClick={close}>{tx.browse}</Link>
          </div>
        ) : (
          <>
            <div className="cart__ship">
              <p className="cart__ship-text">
                {toFree > 0 ? tx.toFree(fmtEur(toFree, lang)) : <strong>✓ {tx.free}</strong>}
              </p>
              <div className="cart__ship-bar"><span style={{ width: `${progress}%` }} /></div>
            </div>

            <ul className="cart__lines">
              {lines.map(l => (
                <li key={l.key} className={`cart-line ${l.key === lastAdded ? 'cart-line--new' : ''}`}>
                  <Link to={l.href} className="cart-line__img" onClick={close}>
                    {l.image && <img src={l.image} alt="" />}
                  </Link>
                  <div className="cart-line__body">
                    <div className="cart-line__top">
                      <span className="cart-line__name">{l.name}</span>
                      <span className={`cart-line__type cart-line__type--${l.type}`}>
                        {l.type === 'sub' ? tx.monthly : tx.once}
                      </span>
                    </div>
                    <div className="cart-line__meta">{[l.sizeLabel, l.grind && grindLabel(l.grind)].filter(Boolean).join(' · ')}</div>
                    <div className="cart-line__bottom">
                      <div className="qty" role="group" aria-label={tx.qty}>
                        <button onClick={() => setQty(l.key, l.qty - 1)} aria-label={tx.less}>−</button>
                        <span aria-live="polite">{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= MAX_QTY} aria-label={tx.more}>+</button>
                      </div>
                      <span className="cart-line__price">
                        {fmtEur(l.lineTotal, lang)}{l.type === 'sub' && <small> {tx.perMo}</small>}
                      </span>
                    </div>
                    <button className="cart-line__remove" onClick={() => remove(l.key)}>{tx.remove}</button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="cart__foot">
              <dl className="cart__sums">
                {subsTotal > 0 && <><dt>{tx.subs}</dt><dd>{fmtEur(subsTotal, lang)}</dd></>}
                {onceTotal > 0 && <><dt>{tx.oneOff}</dt><dd>{fmtEur(onceTotal, lang)}</dd></>}
                <dt>{tx.shipping}</dt>
                <dd>{shipping ? fmtEur(shipping, lang) : tx.freeShip}</dd>
                <dt className="cart__total">{tx.today}</dt>
                <dd className="cart__total">{fmtEur(total, lang)}</dd>
              </dl>
              <button className="btn btn--yellow btn--full btn--lg" onClick={checkout}>
                {tx.checkout}
              </button>
              {subsTotal > 0 && <p className="cart__note">{tx.subNote}</p>}
              <p className="cart__note">{tx.note}</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  CheckoutElementsProvider, useCheckoutElements, PaymentElement, ShippingAddressElement,
} from '@stripe/react-stripe-js/checkout'
import Layout from '../components/Layout'
import { useLang } from '../context/LangContext'
import { useCart, GRINDS } from '../context/CartContext'
import { useTiers } from '../data/subsApi'
import './Checkout.css'

const PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = PK ? loadStripe(PK) : null

// Matches the site's design tokens (index.css)
const APPEARANCE = {
  theme: 'night',
  variables: {
    colorPrimary: '#FFE500',
    colorBackground: '#171717',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255,255,255,0.52)',
    colorTextPlaceholder: 'rgba(255,255,255,0.22)',
    colorDanger: '#ff8a80',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSizeBase: '15px',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid rgba(255,229,0,0.4)', boxShadow: 'none' },
    '.Label': { fontSize: '12px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)' },
    '.Tab': { border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'none' },
    '.Tab--selected': { border: '1px solid #FFE500', backgroundColor: '#1e1e1e', color: '#FFE500', boxShadow: 'none' },
    '.Tab--selected:hover': { color: '#FFE500' },
    '.TabLabel--selected': { color: '#FFE500' },
    '.TabIcon--selected': { fill: '#FFE500', color: '#FFE500' },
  },
}
const FONTS = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap' }]

const TXT = {
  en: {
    title: 'Checkout', back: '← Back to coffee', contact: 'Contact', email: 'Email',
    shipping: 'Shipping address', payment: 'Payment', summary: 'Your order',
    sub: 'Subscription', once: 'One-off order',
    subtotal: 'Subtotal', ship: 'Shipping', free: 'Free', discount: 'Discount', tax: 'incl. VAT',
    total: 'Total today', then: (x) => `Then ${x} / month`,
    promo: 'Promo code', apply: 'Apply', remove: 'Remove',
    pay: (x) => `Pay ${x}`, subscribe: (x) => `Subscribe · ${x}`, paying: 'Processing…',
    legalSub: 'Your subscription renews monthly. Cancel any time from the customer portal.',
    legal: 'Payments are processed securely by Stripe. Delivery to Spain, Portugal and Andorra.',
    empty: 'Your cart is empty.', browse: 'Browse coffee',
    noKey: 'Checkout is not configured yet (missing Stripe publishable key).',
    errors: {
      unavailable: 'One of the items is no longer available. Please review your cart.',
      origin_not_allowed: 'Checkout is not available on this address.',
      default: 'We couldn’t start checkout. Please try again in a moment.',
    },
    badEmail: 'Please enter a valid email.',
    loading: 'Loading secure checkout…',
  },
  es: {
    title: 'Pago', back: '← Volver a los cafés', contact: 'Contacto', email: 'Email',
    shipping: 'Dirección de envío', payment: 'Pago', summary: 'Tu pedido',
    sub: 'Suscripción', once: 'Compra única',
    subtotal: 'Subtotal', ship: 'Envío', free: 'Gratis', discount: 'Descuento', tax: 'IVA incluido',
    total: 'Total hoy', then: (x) => `Después ${x} / mes`,
    promo: 'Código promocional', apply: 'Aplicar', remove: 'Quitar',
    pay: (x) => `Pagar ${x}`, subscribe: (x) => `Suscribirme · ${x}`, paying: 'Procesando…',
    legalSub: 'Tu suscripción se renueva cada mes. Cancela cuando quieras desde el portal de cliente.',
    legal: 'Pagos procesados de forma segura por Stripe. Envíos a España, Portugal y Andorra.',
    empty: 'Tu carrito está vacío.', browse: 'Ver cafés',
    noKey: 'El pago aún no está configurado (falta la clave pública de Stripe).',
    errors: {
      unavailable: 'Uno de los productos ya no está disponible. Revisa tu carrito.',
      origin_not_allowed: 'El pago no está disponible en esta dirección.',
      default: 'No hemos podido iniciar el pago. Inténtalo de nuevo en un momento.',
    },
    badEmail: 'Introduce un email válido.',
    loading: 'Cargando el pago seguro…',
  },
}

// One session per cart+language; survives StrictMode double-mounts.
const sessionCache = new Map()
function clientSecretFor(items, lang) {
  const key = JSON.stringify([items, lang])
  if (!sessionCache.has(key)) {
    const p = fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang, items }),
    }).then(async r => {
      const data = await r.json().catch(() => ({}))
      if (!r.ok || !data.clientSecret) throw new Error(data.error || 'default')
      return data.clientSecret
    })
    p.catch(() => sessionCache.delete(key))
    sessionCache.set(key, p)
  }
  return sessionCache.get(key)
}

export default function Checkout() {
  const { lang } = useLang()
  const tx = TXT[lang] || TXT.en
  const { items } = useCart()

  const cartItems = useMemo(
    () => items.map(({ type, tierId, size, grind, qty }) => ({ type, tierId, size, grind, qty })),
    [items]
  )
  const [startError, setStartError] = useState('')
  const clientSecret = useMemo(() => {
    if (!cartItems.length || !stripePromise) return null
    const p = clientSecretFor(cartItems, lang)
    p.catch(e => setStartError(e.message))
    return p
  }, [cartItems, lang])

  let body
  if (!cartItems.length) {
    body = (
      <div className="co-empty">
        <p>{tx.empty}</p>
        <Link to="/subs" className="btn btn--yellow">{tx.browse}</Link>
      </div>
    )
  } else if (!stripePromise) {
    body = <p className="co-alert">{tx.noKey}</p>
  } else if (startError) {
    body = (
      <div className="co-empty">
        <p className="co-alert">{tx.errors[startError] || tx.errors.default}</p>
        <Link to="/subs" className="btn btn--ghost">{tx.back}</Link>
      </div>
    )
  } else {
    body = (
      <CheckoutElementsProvider
        key={`${lang}`}
        stripe={stripePromise}
        options={{
          clientSecret,
          // "Save my information" is a Link feature — off with Link
          elementsOptions: { appearance: APPEARANCE, fonts: FONTS, savedPaymentMethod: { enableSave: 'never' } },
        }}
      >
        <CheckoutForm tx={tx} lang={lang} cartItems={cartItems} />
      </CheckoutElementsProvider>
    )
  }

  return (
    <Layout title={tx.title}>
      <section className="co">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/subs" className="page-hero__back">{tx.back}</Link>
          </div>
          <h1 className="co__title">{tx.title}</h1>
          {body}
        </div>
      </section>
    </Layout>
  )
}

function CheckoutForm({ tx, lang, cartItems }) {
  const state = useCheckoutElements()
  const { tiers } = useTiers()
  const [email, setEmail] = useState('')
  const [promo, setPromo] = useState('')
  const [promoMsg, setPromoMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (state.type === 'loading') return <p className="co-loading">{tx.loading}</p>
  if (state.type === 'error') return <p className="co-alert">{tx.errors.default}</p>
  const checkout = state.checkout

  const isSub = !!checkout.recurring
  const total = checkout.total
  const promoApplied = checkout.discountAmounts?.find(d => d.promotionCode)
  // Subscriptions carry monthly shipping as its own line item
  const subShipLine = isSub ? checkout.lineItems.find(l => /shipping|env[ií]o/i.test(l.name)) : null
  const shipAmount = isSub ? (subShipLine?.total.minorUnitsAmount || 0) : total.shippingRate.minorUnitsAmount
  const shipLabel = isSub ? subShipLine?.total.amount : total.shippingRate.amount
  const fmt = (cents) => new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(cents / 100)

  // Our cart lines (with grind) for the summary; amounts come from Stripe below.
  const grindLabel = (id) => (GRINDS.find(g => g.id === id) || {})[lang] || id

  async function applyPromo(e) {
    e.preventDefault()
    if (!promo.trim()) return
    setPromoMsg('')
    const r = await checkout.applyPromotionCode(promo.trim())
    if (r.type === 'error') setPromoMsg(r.error.message)
    else setPromo('')
  }

  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  // Give Stripe the email as soon as it's valid, so the session is complete
  async function syncEmail() {
    if (!validEmail(email) || email === checkout.email) return
    const r = await checkout.updateEmail(email)
    if (r.type === 'error') setError(r.error.message)
    else setError('')
  }

  async function pay(e) {
    e.preventDefault()
    setError('')
    if (!validEmail(email)) { setError(tx.badEmail); return }
    setBusy(true)
    const r = await checkout.confirm({ email })
    // On success Stripe redirects to /order/complete
    if (r.type === 'error') { setError(r.error.message); setBusy(false) }
  }

  const payLabel = isSub ? tx.subscribe(total.total.amount) : tx.pay(total.total.amount)

  return (
    <div className="co__grid">
      <form className="co__form" onSubmit={pay} noValidate>
        <fieldset className="co-step">
          <legend>{tx.contact}</legend>
          <div className="form-group">
            <label htmlFor="co-email">{tx.email}</label>
            <input
              id="co-email" type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)} onBlur={syncEmail}
              placeholder="you@company.com"
            />
          </div>
        </fieldset>

        <fieldset className="co-step">
          <legend>{tx.shipping}</legend>
          <ShippingAddressElement options={{ fields: { phone: 'always' } }} />
        </fieldset>

        <fieldset className="co-step">
          <legend>{tx.payment}</legend>
          <PaymentElement options={{ layout: 'tabs', wallets: { link: 'never' } }} />
        </fieldset>

        {error && <p className="co-alert" role="alert">{error}</p>}
        <button type="submit" className="btn btn--yellow btn--full btn--lg" disabled={busy}>
          {busy ? tx.paying : payLabel}
        </button>
        <p className="co__legal">{isSub ? tx.legalSub : ''} {tx.legal}</p>
      </form>

      <aside className="co__summary">
        <div className="co-sum">
          <div className="co-sum__head">
            <h2>{tx.summary}</h2>
            <span className={`cart-line__type cart-line__type--${isSub ? 'sub' : 'once'}`}>{isSub ? tx.sub : tx.once}</span>
          </div>

          <ul className="co-sum__lines">
            {cartItems.map((i, n) => {
              const tier = tiers.find(t => t.id === i.tierId)
              const unit = tier?.sizes.find(sz => sz.label === i.size)?.price
              return (
                <li key={n} className="co-sum__line">
                  <div className="co-sum__img">{tier && <img src={tier.thumb || tier.image} alt="" />}<span>{i.qty}</span></div>
                  <div className="co-sum__text">
                    <strong>{tier?.name || i.tierId}</strong>
                    <span>{i.size} · {grindLabel(i.grind)}</span>
                  </div>
                  {unit != null && <span className="co-sum__price">{fmt(unit * i.qty * 100)}</span>}
                </li>
              )
            })}
          </ul>

          <form className="co-promo" onSubmit={applyPromo}>
            {promoApplied ? (
              <div className="co-promo__applied">
                <span>🏷 {promoApplied.promotionCode}</span>
                <button type="button" onClick={() => checkout.removePromotionCode()}>{tx.remove}</button>
              </div>
            ) : (
              <>
                <input value={promo} onChange={e => setPromo(e.target.value)} placeholder={tx.promo} aria-label={tx.promo} />
                <button type="submit" className="btn btn--ghost btn--sm">{tx.apply}</button>
              </>
            )}
          </form>
          {promoMsg && <p className="co-promo__msg">{promoMsg}</p>}

          <dl className="co-sum__totals">
            <dt>{tx.subtotal}</dt><dd>{fmt(total.subtotal.minorUnitsAmount - (isSub ? shipAmount : 0))}</dd>
            {total.discount.minorUnitsAmount > 0 && <><dt>{tx.discount}</dt><dd>−{total.discount.amount}</dd></>}
            <dt>{tx.ship}</dt><dd>{shipAmount ? shipLabel : tx.free}</dd>
            <dt className="co-sum__total">{tx.total}</dt>
            <dd className="co-sum__total">{total.total.amount}</dd>
            <dt className="co-sum__tax">{tx.tax}</dt><dd className="co-sum__tax">{total.taxInclusive.amount}</dd>
          </dl>
          {isSub && checkout.recurring?.dueNext && (
            <p className="co-sum__then">{tx.then(checkout.recurring.dueNext.total.amount)}</p>
          )}
        </div>
      </aside>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import './Checkout.css'

const TXT = {
  en: {
    title: 'Order complete',
    loading: 'Checking your payment…',
    h: 'Thanks!',
    hSub: 'Thanks!',
    body: (email) => <>We’ve sent a confirmation to <strong>{email}</strong>. We roast and ship within a few working days.</>,
    bodySub: 'You can manage or cancel your subscription any time from the customer portal.',
    openH: 'Payment not completed',
    openP: 'Your payment didn’t go through. Your cart is still saved.',
    retry: 'Back to checkout', home: 'Back to home', portal: 'Customer portal',
    errP: 'We couldn’t check this order. If you were charged, you’ll receive a confirmation email — or contact us.',
    contact: 'Contact us',
  },
  es: {
    title: 'Pedido completado',
    loading: 'Comprobando tu pago…',
    h: '¡Gracias!',
    hSub: '¡Gracias!',
    body: (email) => <>Hemos enviado la confirmación a <strong>{email}</strong>. Tostamos y enviamos en pocos días laborables.</>,
    bodySub: 'Puedes gestionar o cancelar tu suscripción cuando quieras desde el portal de cliente.',
    openH: 'Pago no completado',
    openP: 'Tu pago no se ha completado. Tu carrito sigue guardado.',
    retry: 'Volver al pago', home: 'Volver al inicio', portal: 'Portal de cliente',
    errP: 'No hemos podido comprobar este pedido. Si se te ha cobrado, recibirás un email de confirmación; si no, contáctanos.',
    contact: 'Contáctanos',
  },
}

export default function OrderComplete() {
  const { lang } = useLang()
  const tx = TXT[lang] || TXT.en
  const [params] = useSearchParams()
  const { clear } = useCart()
  const [state, setState] = useState({ type: 'loading' })
  const sessionId = params.get('session_id') || ''

  useEffect(() => {
    let cancelled = false
    fetch(`/.netlify/functions/checkout-session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (cancelled) return
        if (d.status === 'complete') clear()
        setState({ type: d.status === 'complete' ? 'complete' : 'open', ...d })
      })
      .catch(() => { if (!cancelled) setState({ type: 'error' }) })
    return () => { cancelled = true }
  }, [sessionId, clear])

  let content
  if (state.type === 'loading') content = <p>{tx.loading}</p>
  else if (state.type === 'complete') {
    const isSub = state.mode === 'subscription'
    content = (
      <>
        <h1>{isSub ? tx.hSub : tx.h}</h1>
        {state.email && <p>{tx.body(state.email)}</p>}
        {isSub && <p>{tx.bodySub}</p>}
        <div className="done__actions">
          <Link to="/" className="btn btn--yellow">{tx.home}</Link>
          {isSub && <Link to="/portal" className="btn btn--ghost">{tx.portal}</Link>}
        </div>
      </>
    )
  } else if (state.type === 'open') {
    content = (
      <>
        <h1>{tx.openH}</h1>
        <p>{tx.openP}</p>
        <div className="done__actions"><Link to="/checkout" className="btn btn--yellow">{tx.retry}</Link></div>
      </>
    )
  } else {
    content = (
      <>
        <h1>{tx.title}</h1>
        <p>{tx.errP}</p>
        <div className="done__actions"><Link to="/contact" className="btn btn--ghost">{tx.contact}</Link></div>
      </>
    )
  }

  return (
    <Layout title={tx.title}>
      <section className="co">
        <div className="wrap">
          <div className="done">
            <img src="/BC_outlineLogo.svg" alt="" className="done__logo" />
            {content}
          </div>
        </div>
      </section>
    </Layout>
  )
}

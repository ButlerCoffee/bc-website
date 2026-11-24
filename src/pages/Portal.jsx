import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import Layout from '../components/Layout'
import './Portal.css'

// Replace this with the real Stripe Customer Portal URL
const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/your_portal_link'

export default function Portal() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  const features = isEs ? [
    { icon: '📦', title: 'Gestiona tu suscripción', desc: 'Cambia de nivel, ajusta el tamaño de bolsa o pausa temporalmente.' },
    { icon: '💳', title: 'Métodos de pago',          desc: 'Actualiza tu tarjeta o información de facturación en cualquier momento.' },
    { icon: '📜', title: 'Historial de pedidos',      desc: 'Consulta y descarga tus facturas y el historial de entregas.' },
    { icon: '🚫', title: 'Cancela cuando quieras',    desc: 'Sin llamadas ni formularios. Cancela en un clic.' },
  ] : [
    { icon: '📦', title: 'Manage your subscription', desc: 'Change tier, adjust bag size, or pause temporarily.' },
    { icon: '💳', title: 'Payment methods',            desc: 'Update your card or billing info any time.' },
    { icon: '📜', title: 'Order history',              desc: 'View and download your invoices and delivery history.' },
    { icon: '🚫', title: 'Cancel any time',            desc: 'No calls, no forms. Cancel in one click.' },
  ]

  return (
    <Layout title={isEs ? 'Portal del cliente' : 'Customer Portal'}>
      {/* ── PORTAL HERO ─────────────────────────────────────────────────── */}
      <section className="portal-hero">
        <div className="wrap">
          <div className="portal-hero__inner">

            <div className="portal-hero__icon">👤</div>

            <span className="badge">
              {isEs ? 'Portal del Cliente' : 'Customer Portal'}
            </span>

            <h1 className="portal-hero__title">
              {isEs ? <>Tu suscripción,<br/><em>a tu control.</em></> : <>Your subscription,<br/><em>your control.</em></>}
            </h1>

            <p className="portal-hero__sub">
              {isEs
                ? 'Gestiona tu suscripción de café, actualiza tus datos de pago y consulta tu historial — todo en un solo lugar, powered by Stripe.'
                : 'Manage your coffee subscription, update payment details, and review your history — all in one place, powered by Stripe.'}
            </p>

            <a
              href={STRIPE_PORTAL_URL}
              className="btn btn--yellow btn--lg portal-hero__cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              {isEs ? 'Acceder al Portal →' : 'Access Portal →'}
            </a>

            <p className="portal-hero__note">
              {isEs
                ? 'Serás redirigido al portal seguro de Stripe. Introduce el email de tu suscripción para acceder.'
                : "You'll be redirected to Stripe's secure portal. Enter your subscription email to log in."}
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU CAN DO ─────────────────────────────────────────────── */}
      <section className="section surf-section">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Funciones' : 'What you can do'}</span>
            <h2 className="section-title">
              {isEs ? 'Todo en un lugar.' : 'Everything in one place.'}
            </h2>
          </div>
          <div className="portal-features">
            {features.map(f => (
              <div className="portal-feature" key={f.title}>
                <div className="portal-feature__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STRIPE BADGE ────────────────────────────────────────────────── */}
      <div className="portal-stripe-banner">
        <div className="wrap">
          <div className="portal-stripe-banner__inner">
            <span className="portal-stripe-banner__lock">🔒</span>
            <p>
              {isEs
                ? 'Tu portal está asegurado con cifrado de nivel bancario a través de'
                : 'Your portal is secured with bank-level encryption via'}
              {' '}<strong>Stripe</strong>.
              {' '}{isEs
                ? 'Butler Coffee nunca almacena los datos de tu tarjeta.'
                : 'Butler Coffee never stores your card details.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── HELP ────────────────────────────────────────────────────────── */}
      <div className="cta-band">
        <div className="wrap">
          <h2 className="cta-band__title">
            {isEs ? '¿Necesitas ayuda?' : 'Need a hand?'}
          </h2>
          <p className="cta-band__sub">
            {isEs
              ? 'Si tienes algún problema accediendo al portal o con tu suscripción, contacta con nosotros.'
              : "If you're having trouble accessing the portal or with your subscription, get in touch."}
          </p>
          <div className="cta-band__actions">
            <Link to="/contact" className="btn btn--yellow">
              {isEs ? 'Contactar soporte' : 'Contact support'}
            </Link>
            <a href="mailto:hola@butler.coffee" className="btn btn--ghost">hola@butler.coffee</a>
          </div>
        </div>
      </div>

    </Layout>
  )
}

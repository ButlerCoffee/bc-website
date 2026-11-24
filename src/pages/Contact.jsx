import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import Layout from '../components/Layout'
import ContactForm from '../components/ContactForm'
import './Contact.css'

export default function Contact() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  return (
    <Layout title={isEs ? 'Contacto' : 'Contact'}>

      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/" className="page-hero__back">
              {isEs ? '← Volver al inicio' : '← Back to home'}
            </Link>
            <span className="badge">{isEs ? 'Contacto' : 'Contact'}</span>
          </div>
          <h1 className="page-hero__title">
            {isEs ? <>Hablemos <em>del café.</em></> : <>Let's talk <em>coffee.</em></>}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Ya sea para elegir un nivel de suscripción, configurar tu oficina o simplemente curiosidad — estamos aquí.'
              : "Whether it's picking a subscription tier, setting up your office, or just curiosity — we're here."}
          </p>
        </div>
      </section>

      {/* ── CONTACT LAYOUT ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="wrap">
          <div className="contact-layout">

            {/* Form */}
            <div className="contact-form-wrap">
              <ContactForm />
            </div>

            {/* Info sidebar */}
            <div className="contact-sidebar">
              <div className="contact-info-card">
                <h3>{isEs ? 'Información de contacto' : 'Contact info'}</h3>
                <div className="contact-info-item">
                  <span className="contact-info-icon">📧</span>
                  <div>
                    <div className="contact-info-label">Email</div>
                    <a href="mailto:hola@butler.coffee" className="contact-info-val">hola@butler.coffee</a>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">📍</span>
                  <div>
                    <div className="contact-info-label">{isEs ? 'Base' : 'Based in'}</div>
                    <div className="contact-info-val">Madrid, Spain</div>
                  </div>
                </div>
                <div className="contact-info-item">
                  <span className="contact-info-icon">⏱️</span>
                  <div>
                    <div className="contact-info-label">{isEs ? 'Tiempo de respuesta' : 'Response time'}</div>
                    <div className="contact-info-val">{isEs ? '< 1 día laborable' : '< 1 business day'}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </Layout>
  )
}

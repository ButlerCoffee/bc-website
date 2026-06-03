import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import Layout from '../components/Layout'
import ContactForm from '../components/ContactForm'
import './About.css'

// Replace this with a real image URL when available
const ABOUT_IMAGE = ''

export default function About() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  return (
    <Layout>

      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/" className="page-hero__back">
              {isEs ? '← Volver al inicio' : '← Back to home'}
            </Link>
            <span className="badge">{isEs ? 'Nuestra historia' : 'Our story'}</span>
          </div>
          <h1 className="page-hero__title">
            {isEs
              ? <>Café de especialidad,<br /><em>con propósito.</em></>
              : <>Specialty coffee,<br /><em>with purpose.</em></>}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Somos Butler Coffee: una empresa de Madrid que lleva café de especialidad a los espacios de trabajo que lo merecen.'
              : 'We are Butler Coffee — a Madrid-based company bringing specialty coffee to the workspaces that deserve it.'}
          </p>
        </div>
      </section>

      {/* ── STORY ─────────────────────────────────────────────────────────── */}
      <section className="section about-story">
        <div className="wrap about-story__inner">

          {/* Image */}
          <div className="about-story__img-wrap">
            {ABOUT_IMAGE
              ? <img src={ABOUT_IMAGE} alt={isEs ? 'El equipo de Butler Coffee' : 'The Butler Coffee team'} className="about-story__img" loading="lazy" decoding="async" />
              : (
                <div className="about-story__img-placeholder">
                  <span>☕</span>
                </div>
              )
            }
          </div>

          {/* Text */}
          <div className="about-story__text">
            <h2 className="about-story__title">
              {isEs ? 'Por qué existimos' : 'Why we exist'}
            </h2>
            <p>
              {isEs
                ? 'Todo empezó con una pregunta sencilla: ¿por qué el café de oficina tiene que ser malo? En España hay una cultura cafetera increíble, pero la brecha entre el café de especialidad y el mundo del trabajo seguía siendo enorme. Butler Coffee nació para cerrar esa brecha.'
                : 'It started with a simple question: why does office coffee have to be bad? Spain has an incredible coffee culture, but the gap between specialty coffee and the working world remained enormous. Butler Coffee was built to close that gap.'}
            </p>
            <p>
              {isEs
                ? 'Trabajamos con tostadores de especialidad seleccionados, diseñamos niveles de suscripción pensados para equipos reales y nos aseguramos de que cada entrega llegue fresca y lista para preparar. Sin complicaciones, sin compromisos con la calidad.'
                : 'We work with hand-picked specialty roasters, design subscription tiers built for real teams, and make sure every delivery arrives fresh and ready to brew. No fuss, no compromises on quality.'}
            </p>
            <p>
              {isEs
                ? 'Con base en Madrid, servimos a oficinas, estudios y equipos de toda España. Si crees que tu espacio merece un café mejor, estás en el lugar correcto.'
                : 'Based in Madrid, we serve offices, studios, and teams across Spain. If you think your workspace deserves better coffee, you\'re in the right place.'}
            </p>
          </div>

        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────────────────────── */}
      <section className="section about-contact">
        <div className="wrap about-contact__inner">
          <div className="sh">
            <span className="badge">{isEs ? 'Escríbenos' : 'Get in touch'}</span>
            <h2 className="section-title">
              {isEs ? <>¿Hablamos del <em>café?</em></> : <>Let's talk <em>coffee.</em></>}
            </h2>
            <p className="section-sub">
              {isEs
                ? 'Cuéntanos sobre tu equipo y te ayudamos a encontrar el nivel perfecto.'
                : 'Tell us about your team and we\'ll help you find the right fit.'}
            </p>
          </div>
          <div className="about-contact__form">
            <ContactForm />
          </div>
        </div>
      </section>

    </Layout>
  )
}

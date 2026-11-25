import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import Layout from '../components/Layout'
import ContactSection from '../components/ContactSection'
import './About.css'

const ABOUT_IMAGE = '/images/about-team.jpg'

export default function About() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  return (
    <Layout title={isEs ? 'Sobre nosotros' : 'About'}>

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
            {isEs ? 'Haz lo que te gusta y diviértete haciéndolo.' : 'Love what you do and have fun doing it.'}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Eso explica el pato.'
              : 'That explains the duck.'}
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
                ? 'Desde Madrid, servimos café en toda la península ibérica y más allá. Si crees que tu espacio merece un café mejor, estás en el lugar correcto.'
                : 'From Madrid, we serve coffee across the Iberian Peninsula and beyond. If you think your workspace deserves better coffee, you\'re in the right place.'}
            </p>
          </div>

        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────────────────────── */}
      <ContactSection />

    </Layout>
  )
}

import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTiers } from '../data/subsApi'
import Layout from '../components/Layout'
import CoffeeCalculator from '../components/CoffeeCalculator'
import TierBuyCard from '../components/TierBuyCard'
import './Subs.css'

export default function Subs() {
  const { lang, t } = useLang()
  const isEs = lang === 'es'
  const { tiers: TIERS } = useTiers()

  return (
    <Layout title={isEs ? 'Suscripciones' : 'Subscriptions'}>
      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/" className="page-hero__back">{t('back_home')}</Link>
            <span className="badge">{isEs ? 'Suscripciones' : 'Subscriptions'}</span>
          </div>
          <h1 className="page-hero__title">
            {isEs ? <>Elige tu <em>aventura.</em></> : <>Choose your <em>adventure.</em></>}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Cuatro niveles de café de especialidad. Desde tazas fiables para el día a día hasta granos premiados que muy pocos probarán. Todo seleccionado a mano y entregado cada mes.'
              : 'Four tiers of specialty coffee. From reliable everyday cups to award-winning beans that very few will ever taste. All handpicked and delivered every month.'}
          </p>

          {/* Stat row */}
          <div className="subs-hero__stats">
            {[
              { num: '4',    label: isEs ? 'Niveles' : 'Tiers' },
              { num: '12+',  label: isEs ? 'Países de origen' : 'Origin countries' },
              { num: '100%', label: isEs ? 'Especialidad' : 'Specialty grade' },
              { num: '1',    label: isEs ? 'Entrega / mes' : 'Delivery / month' },
            ].map(s => (
              <div className="stat" key={s.label}>
                <span className="stat__num">{s.num}</span>
                <span className="stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIER CARDS ────────────────────────────────────────────────────── */}
      <section className="section subs-tiers" id="tiers" style={{ scrollMarginTop: 'calc(var(--nav-h) + 8px)' }}>
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Los Niveles' : 'The Tiers'}</span>
            <h2 className="section-title">{isEs ? 'Encuentra el tuyo.' : 'Find yours.'}</h2>
            <p className="section-sub">
              {isEs ? 'Tú eliges el nivel; nosotros seleccionamos el café cada mes.' : 'You choose the tier. We handpick the coffee every month.'}
            </p>
          </div>

          {/* Same card as Coffee by the bag, in subscription mode */}
          <div className="pgrid pgrid--four">
            {TIERS.map(tier => <TierBuyCard key={tier.id} tier={tier} lang={lang} mode="sub" />)}
          </div>
        </div>
      </section>

      {/* ── HOW THE TIERS WORK ────────────────────────────────────────────── */}
      <div className="surf-section section">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Nuestro Sistema' : 'How it works'}</span>
            <h2 className="section-title">
              {isEs ? 'Un nivel para cada paladar.' : 'A tier for every palate.'}
            </h2>
            <p className="section-sub">
              {isEs
                ? 'Cada mes recurrimos a los mejores tostadores del mundo para llenar cada nivel con algo especial. Nunca el mismo café dos meses seguidos.'
                : 'Every month we source from the world\'s best roasters to fill each tier with something special. Never the same coffee two months running.'}
            </p>
          </div>

          <div className="subs-how__grid">
            {[
              { icon: '🎯', en: { h: 'Pick your tier', p: 'Choose the level that matches your curiosity and budget. You can upgrade or downgrade any time.' }, es: { h: 'Elige tu nivel', p: 'Escoge el nivel que se adapta a tu curiosidad y presupuesto. Puedes cambiar cuando quieras.' } },
              { icon: '📦', en: { h: 'We curate & pack', p: 'Each month\'s coffee is hand-selected, freshly roasted, and packed the same week it ships.' }, es: { h: 'Seleccionamos y empaquetamos', p: 'El café de cada mes se selecciona a mano, se tuesta frescos y se empaqueta la misma semana que se envía.' } },
              { icon: '🚀', en: { h: 'Arrives at your door', p: 'Delivered to your workspace or home on time, every month. Adjust your bag size or frequency as you go.' }, es: { h: 'Llega a tu puerta', p: 'Entregado en tu espacio de trabajo o en casa a tiempo, cada mes. Ajusta el tamaño de la bolsa cuando quieras.' } },
            ].map(s => {
              const c = s[lang] || s.en
              return (
                <div className="subs-how__card" key={s.icon}>
                  <div className="placeholder-icon">{s.icon}</div>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CALCULATOR ────────────────────────────────────────────────────── */}
      <div className="subs-calc" id="calculator">
        <CoffeeCalculator />
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="cta-band surf-section">
        <div className="wrap">
          <h2 className="cta-band__title">
            {isEs ? '¿No sabes por dónde empezar?' : "Not sure where to start?"}
          </h2>
          <p className="cta-band__sub">
            {isEs
              ? 'Pregúntanos. Estaremos encantados de ayudarte a encontrar el nivel perfecto para tu equipo.'
              : "Ask us. We'd love to help you find the perfect tier for you and your team."}
          </p>
          <div className="cta-band__actions">
            <Link to="/contact" className="btn btn--yellow">{t('contact_us')}</Link>
          </div>
        </div>
      </div>

    </Layout>
  )
}

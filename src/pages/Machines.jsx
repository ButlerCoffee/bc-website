import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useMachines, getMachinesByBrand } from '../data/machinesApi'
import Layout from '../components/Layout'
import './Machines.css'

const TAG_VARIANTS = {
  yellow:  'mcard__tag--yellow',
  outline: 'mcard__tag--outline',
  default: '',
}

export default function Machines() {
  const { lang, t } = useLang()
  const isEs = lang === 'es'
  const { machines, brands } = useMachines()

  return (
    <Layout>

      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/" className="page-hero__back">{t('back_home')}</Link>
            <span className="badge">{isEs ? 'Máquinas de Café' : 'Coffee Machines'}</span>
          </div>
          <h1 className="page-hero__title">
            {isEs ? <>La máquina perfecta<br/>para cada <em>espacio.</em></> : <>The right machine<br/>for every <em>workspace.</em></>}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Vendemos y mantenemos máquinas de café profesionales diseñadas para rendir — para que cada taza de tu equipo sea tan buena como la anterior.'
              : 'We sell and service professional coffee machines built to perform — so every cup your team pours is as good as the last.'}
          </p>

          <div className="subs-hero__stats">
            {[
              { num: '2',     label: isEs ? 'Marcas' : 'Brands' },
              { num: '4',     label: isEs ? 'Modelos' : 'Models' },
              { num: '30–100+', label: isEs ? 'Tazas / día' : 'Cups / day' },
              { num: '1 día', label: isEs ? 'Instalación' : 'Setup' },
            ].map(s => (
              <div className="stat" key={s.label}>
                <span className="stat__num">{s.num}</span>
                <span className="stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY BUTLER STRIP ──────────────────────────────────────────────── */}
      <div className="surf-section" style={{ padding: '56px 0' }}>
        <div className="wrap">
          <div className="why-grid">
            {[
              { icon: '🛠️', en: { t: 'Setup included',   d: 'We deliver, install, and dial in your machine — no guesswork.' }, es: { t: 'Instalación incluida', d: 'Entregamos, instalamos y ajustamos tu máquina — sin complicaciones.' } },
              { icon: '☕',  en: { t: 'Paired with beans', d: 'Bundle with a Butler subscription and get beans dialled to your machine.' }, es: { t: 'Con café incluido', d: 'Combina con una suscripción Butler y recibe café calibrado para tu máquina.' } },
              { icon: '📞', en: { t: 'Local support',     d: 'Based in Madrid. We\'re a call or visit away when you need us.' }, es: { t: 'Soporte local', d: 'Estamos en Madrid. Un call o visita de distancia.' } },
              { icon: '💳', en: { t: 'Finance options',   d: 'Spread the cost — ask about flexible payment plans.' }, es: { t: 'Financiación disponible', d: 'Distribuye el coste — pregúntanos por planes de pago.' } },
            ].map(w => {
              const c = w[lang] || w.en
              return (
                <div className="why-item" key={w.icon}>
                  <div className="why-item__icon">{w.icon}</div>
                  <div className="why-item__title">{c.t}</div>
                  <p className="why-item__desc">{c.d}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── JURA SECTION ──────────────────────────────────────────────────── */}
      <section className="section" id="jura">
        <div className="wrap">
          <div className="brand-header">
            <div>
              <span className="badge">{isEs ? 'Espresso Automático' : 'Automatic Espresso'}</span>
              <div className="brand-label">Jura <span>{isEs ? 'Profesional' : 'Professional'}</span></div>
            </div>
            <p className="brand-tagline">
              {isEs
                ? 'Precisión suiza grano a taza. Diseñada para oficinas que se toman el café en serio.'
                : 'Swiss-engineered bean-to-cup precision. Built for offices that take coffee seriously.'}
            </p>
          </div>

          <div className="machines-grid">
            {getMachinesByBrand(machines, 'jura').map(m => (
              <MachineCard key={m.id} machine={m} lang={lang} isEs={isEs} />
            ))}
          </div>
        </div>
      </section>

      {/* ── BEHMOR SECTION ────────────────────────────────────────────────── */}
      <section className="section surf-section" id="behmor">
        <div className="wrap">
          <div className="brand-header">
            <div>
              <span className="badge">{isEs ? 'Cafetera de Filtro de Precisión' : 'Precision Batch Brew'}</span>
              <div className="brand-label">Behmor <span>Brazen</span></div>
            </div>
            <p className="brand-tagline">
              {isEs
                ? 'Para equipos que se toman su café de filtro tan en serio como el espresso.'
                : 'For teams who take their filter coffee as seriously as their espresso.'}
            </p>
          </div>

          <div className="machines-grid machines-grid--single">
            {getMachinesByBrand(machines, 'behmor').map(m => (
              <MachineCard key={m.id} machine={m} lang={lang} isEs={isEs} wide />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="cta-band">
        <div className="wrap">
          <h2 className="cta-band__title">
            {isEs ? '¿No sabes qué máquina elegir?' : "Not sure which machine?"}
          </h2>
          <p className="cta-band__sub">
            {isEs
              ? 'Cuéntanos tu espacio y te recomendamos la mejor opción.'
              : "Tell us about your workspace and we'll recommend the right setup."}
          </p>
          <div className="cta-band__actions">
            <Link to="/contact" className="btn btn--yellow">{t('contact_us')}</Link>
            <Link to="/subs" className="btn btn--ghost">{isEs ? 'Ver suscripciones →' : 'See subscriptions →'}</Link>
          </div>
        </div>
      </div>

    </Layout>
  )
}

function MachineCard({ machine: m, lang, isEs, wide }) {
  const tagText = (m.tag?.[lang] || m.tag?.en || '').trim()
  const cover = m.images?.[0]

  return (
    <Link to={`/machines/${m.slug}`} className={`mcard ${wide ? 'mcard--wide' : ''}`}>
      {tagText && (
        <div className="mcard__badge-wrap">
          <span className={`mcard__tag ${TAG_VARIANTS[m.tagVariant] || ''}`}>
            {tagText}
          </span>
        </div>
      )}
      <div className="mcard__img">
        {cover
          ? <img src={cover} alt={m.name} loading="lazy" />
          : <span style={{ fontSize: '3rem', opacity: 0.15 }}>☕</span>}
      </div>
      <div className="mcard__body">
        <div className="mcard__brand">{m.brandName}</div>
        <h3 className="mcard__name">{m.name}</h3>
        <p className="mcard__desc">{m.description[lang] || m.description.en}</p>
        {wide && (
          <div className="mcard__features">
            {(m.features[lang] || m.features.en).slice(0, 4).map(f => (
              <div className="mcard__feat" key={f}>
                <span>✓</span> {f}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mcard__footer">
        <div className="mcard__price">
          <span className="mcard__price-from">{isEs ? 'Desde' : 'From'}</span>
          <span className="mcard__price-num">€{m.price.toLocaleString()}</span>
        </div>
        <span className="btn btn--ghost btn--sm">{isEs ? 'Ver detalles →' : 'View details →'}</span>
      </div>
    </Link>
  )
}

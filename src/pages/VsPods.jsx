import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import Layout from '../components/Layout'
import './VsPods.css'

// ── Comparison table data (source: Butler_VS_Pods.pdf) ────────────────────────
const ROWS = [
  { name: 'Base Coffee',              grams: '~9-10 g', shot: '0,36 – 0,40 €',   kg: '40 €',           highlight: false, pods: false },
  { name: 'Explorer Coffee',          grams: '~9-10 g', shot: '0,45 – 0,50 €',   kg: '50 €',           highlight: true,  pods: false },
  { name: 'Alpine Coffee',            grams: '~9-10 g', shot: '0,59 – 0,65 €',   kg: '65 €',           highlight: false, pods: false },
  { name: 'Nespresso Original Pods',  grams: '~5 g',    shot: '0,49 – 0,76 €',   kg: '98 – 152 €',     highlight: false, pods: true },
  { name: 'Nespresso Vertuo Pods',    grams: '~7 g',    shot: '0,52 – 0,95 €',   kg: '73 – 134,90 €',  highlight: false, pods: true },
]

// ── Benefit categories ────────────────────────────────────────────────────────
const BENEFITS = [
  {
    icon: '👍',
    en: { title: 'Better taste & quality', items: [
      'Freshly roasted specialty coffee — nothing lost in aroma or flavor.',
      'More coffee per cup means a richer, more balanced taste.',
      'No preservatives or sealed pods that let the coffee go stale.',
    ]},
    es: { title: 'Mejor sabor y calidad', items: [
      'Café de especialidad recién tostado, sin perder aroma ni sabor.',
      'Más café por taza = sabor más intenso y equilibrado.',
      'Sin conservantes ni cápsulas selladas que envejecen el café.',
    ]},
  },
  {
    icon: '✌️',
    en: { title: 'More sustainable', items: [
      'No aluminum or plastic waste from single-use pods.',
    ]},
    es: { title: 'Más sostenible', items: [
      'Sin residuos de aluminio o plástico de cápsulas desechables.',
    ]},
  },
  {
    icon: '💪',
    en: { title: 'Greater productivity', items: [
      'Better quality coffee means happier employees.',
      'Great office coffee boosts morale and collaboration.',
      'Less time and money spent on coffee runs.',
    ]},
    es: { title: 'Mayor productividad', items: [
      'Café de mejor calidad = empleados contentos.',
      'Un buen café en la oficina mejora la moral y la colaboración.',
      'Menos tiempo y dinero gastado en salir a comprar café.',
    ]},
  },
  {
    icon: '👌',
    en: { title: 'Better price', items: [
      'Better quality for less money.',
      'Visible savings over the long run.',
    ]},
    es: { title: 'Mejor precio', items: [
      'Mejor calidad por menos dinero.',
      'Ahorros visibles a largo plazo.',
    ]},
  },
  {
    icon: '👍',
    en: { title: 'Convenience', items: [
      'Compatible with automatic machines.',
      'Fast brewing with one-touch Jura machines.',
      'More flexibility in brew method.',
    ]},
    es: { title: 'Conveniencia', items: [
      'Compatible con máquinas automáticas.',
      'Preparación rápida con Jura one-touch.',
      'Más flexibilidad en el método de preparación.',
    ]},
  },
]

export default function VsPods() {
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
            <span className="badge">
              {isEs ? 'Café en Cápsulas vs Café de Especialidad' : 'Pod Coffee vs Specialty Coffee'}
            </span>
          </div>
          <h1 className="page-hero__title">
            {isEs
              ? <>¿Cápsulas, o café<br /><em>de especialidad?</em></>
              : <>Pods, or<br /><em>specialty coffee?</em></>}
          </h1>
          <p className="page-hero__sub">
            {isEs
              ? 'sabor · calidad · sostenibilidad · productividad · precio'
              : 'taste · quality · sustainability · productivity · price'}
          </p>
        </div>
      </section>

      {/* ── INTRO + TABLE ─────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <p className="vs-intro">
            {isEs
              ? <>Si amas el buen café, ¿por qué conformarte con menos? El café de especialidad ofrece <strong>más sabor, mejor relación calidad-precio y una alternativa más sostenible</strong> que las cápsulas de café.</>
              : <>If you love good coffee, why settle for less? Specialty coffee offers <strong>more flavor, better value for money, and a more sustainable alternative</strong> to coffee pods.</>}
          </p>

          <div className="vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th>{isEs ? 'Opción' : 'Option'}</th>
                  <th>{isEs ? 'Café (g) / shot' : 'Coffee (g) / shot'}</th>
                  <th>{isEs ? 'Precio / shot' : 'Price / shot'}</th>
                  <th>{isEs ? 'Precio / kg' : 'Price / kg'}</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => (
                  <tr
                    key={r.name}
                    className={`${r.highlight ? 'vs-table__highlight' : ''} ${r.pods ? 'vs-table__pods' : ''}`}
                  >
                    <td>{r.name}</td>
                    <td>{r.grams}</td>
                    <td>{r.shot}</td>
                    <td>{r.kg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE SPECIALTY ──────────────────────────────────────────── */}
      <section className="section surf-section">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'La Comparativa' : 'The Comparison'}</span>
            <h2 className="section-title">
              {isEs
                ? '¿Por qué elegir café de especialidad\nsobre cápsulas de café?'
                : 'Why choose specialty coffee\nover coffee pods?'}
            </h2>
          </div>

          <div className="vs-benefits">
            {BENEFITS.map(b => {
              const c = b[lang] || b.en
              return (
                <div className="vs-benefit" key={c.title}>
                  <div className="vs-benefit__icon">{b.icon}</div>
                  <div className="vs-benefit__title">{c.title}</div>
                  <ul className="vs-benefit__list">
                    {c.items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="cta-band">
        <div className="wrap">
          <h2 className="cta-band__title">
            {isEs ? '¿Listo para dar el salto?' : 'Ready to make the switch?'}
          </h2>
          <p className="cta-band__sub">
            {isEs
              ? 'Encuentra la suscripción de café de especialidad perfecta para tu equipo.'
              : "Find the right specialty coffee subscription for your team."}
          </p>
          <div className="cta-band__actions">
            <Link to="/subs" className="btn btn--yellow btn--lg">
              {isEs ? 'Encuentra tu Sub' : 'Find Your Sub'}
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  )
}

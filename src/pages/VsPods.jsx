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

// ── Benefit categories (written as short article sections) ───────────────────
const BENEFITS = [
  {
    icon: '👍',
    en: { title: 'Better taste & quality', paragraphs: [
      'Freshly roasted specialty coffee keeps its aroma and flavor intact, and Butler blends use more coffee per cup for a richer, more balanced cup than a sealed pod can offer.',
      'There are no preservatives and no sealed pods sitting on a shelf slowly going stale — just coffee roasted to be brewed soon after.',
    ]},
    es: { title: 'Mejor sabor y calidad', paragraphs: [
      'El café de especialidad recién tostado conserva su aroma y sabor, y las mezclas de Butler usan más café por taza para lograr una taza más intensa y equilibrada que la que ofrece una cápsula sellada.',
      'No hay conservantes ni cápsulas selladas envejeciendo en una estantería: solo café tostado para prepararse poco después.',
    ]},
  },
  {
    icon: '✌️',
    en: { title: 'More sustainable', paragraphs: [
      'Pods look convenient, but they leave a lot more behind. A 1kg bag of Butler coffee produces about 25g of packaging waste — the same amount of coffee in Nespresso pods produces 200–250g, roughly 700–900% more, or 8 to 10 times the mass, for the identical amount of coffee.',
      "And unlike a simple paper/plastic bag, most pods can't go in with regular household recycling — they need a special drop-off point to be recycled at all.",
    ]},
    es: { title: 'Más sostenible', paragraphs: [
      'Las cápsulas parecen cómodas, pero dejan mucho más residuo. Una bolsa de 1 kg de café Butler genera unos 25 g de residuos de envase; la misma cantidad de café en cápsulas Nespresso genera entre 200 y 250 g, es decir, entre un 700% y un 900% más (de 8 a 10 veces la masa) para la misma cantidad de café.',
      'Y a diferencia de una simple bolsa de papel/plástico, la mayoría de las cápsulas no se pueden reciclar con la basura doméstica habitual: necesitan un punto de recogida especial.',
    ]},
  },
  {
    icon: '💪',
    en: { title: 'Greater productivity', paragraphs: [
      'Better coffee means happier employees — a great cup in the office does more for morale and collaboration than a rushed one from a machine.',
      'It also cuts down on the time and money spent on coffee runs, keeping people at their desks and focused.',
    ]},
    es: { title: 'Mayor productividad', paragraphs: [
      'Un café mejor significa empleados más contentos: una buena taza en la oficina hace más por la moral y la colaboración que una preparada con prisas.',
      'También reduce el tiempo y el dinero que se gasta en salir a comprar café, manteniendo al equipo en su puesto y concentrado.',
    ]},
  },
  {
    icon: '👌',
    en: { title: 'Better price', paragraphs: [
      'Better quality for less money, with visible savings over the long run compared to pod pricing.',
    ]},
    es: { title: 'Mejor precio', paragraphs: [
      'Mejor calidad por menos dinero, con ahorros visibles a largo plazo frente al precio de las cápsulas.',
    ]},
  },
  {
    icon: '⚡',
    en: { title: 'Convenience', paragraphs: [
      'Butler coffee is compatible with automatic machines, brews fast with one-touch Jura machines, and gives you more flexibility in brew method than a single-pod system allows.',
    ]},
    es: { title: 'Conveniencia', paragraphs: [
      'El café Butler es compatible con máquinas automáticas, se prepara rápido con las Jura one-touch, y da más flexibilidad en el método de preparación que un sistema de cápsula única.',
    ]},
  },
]

export default function VsPods() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  return (
    <Layout>

      {/* ── PAGE HERO ─────────────────────────────────────────────────────── */}
      <section className="page-hero vs-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
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
              ? 'Descubre cómo los granos de café de especialidad se comparan con los sistemas de cápsulas en sabor, calidad, sostenibilidad, productividad y precio.'
              : 'See how specialty coffee beans compare with pod systems on taste, quality, sustainability, productivity, and price.'}
          </p>
        </div>
      </section>

      {/* ── INTRO + TABLE ─────────────────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="vs-intro">
            {isEs ? (
              <>
                <p>La comodidad importa en un lugar de trabajo con mucho movimiento. El café debe ser rápido de preparar, fácil de gestionar y siempre bueno, sin generar trabajo extra para tu equipo.</p>
                <p>Pero la comodidad no tiene por qué significar renunciar a la frescura, la variedad o la sostenibilidad. Butler combina una experiencia de café de oficina sin esfuerzo con café de especialidad recién tostado, suministro flexible y menos residuos de envases. Así es como se compara.</p>
              </>
            ) : (
              <>
                <p>Convenience matters in a busy workplace. Coffee should be quick to prepare, easy to manage, and consistently good—without creating extra work for your team.</p>
                <p>But convenience doesn't have to mean compromising on freshness, choice, or sustainability. Butler combines an effortless office coffee experience with freshly roasted specialty coffee, flexible supply, and less packaging waste. Here's how it compares.</p>
              </>
            )}
          </div>

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

          <article className="vs-article">
            <p className="vs-article__lead">
              {isEs
                ? 'Así es la comparativa completa: desde lo que hay en la taza hasta lo que queda después.'
                : "Here's the full picture — from what's in the cup to what's left behind."}
            </p>

            {BENEFITS.map(b => {
              const c = b[lang] || b.en
              return (
                <div className="vs-article__section" key={c.title}>
                  <h3 className="vs-article__title">
                    <span className="vs-article__icon">{b.icon}</span>
                    {c.title}
                  </h3>
                  {c.paragraphs.map(p => <p key={p}>{p}</p>)}
                </div>
              )
            })}
          </article>
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

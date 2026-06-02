import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { TIERS } from '../data/tiers'
import { getFaqs } from '../data/faqApi'
import { useFeaturedPosts, formatDate, normalizeDriveUrl } from '../data/blogApi'
import Layout from '../components/Layout'
import './Home.css'

// ── Markdown → HTML (for FAQ answers from the DB) ─────────────────────────────
function renderMarkdown(md) {
  if (!md) return '';
  const esc    = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = s => s
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,     '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,         '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--yellow)">$1</a>');
  return esc(md).split(/\n\n+/).map(block => {
    const lines = block.split('\n');
    if (lines.some(l => /^[\-\*] /.test(l.trim()))) {
      const items = lines.filter(l => l.trim())
        .map(l => `<li>${inline(l.replace(/^[\-\*]\s+/, ''))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}

const LOGO_URL    = 'https://drive.google.com/uc?export=view&id=1BrvJTmLjnaUQ6feC6NkSvET6SouIkCQK'
const HERO_IMG    = 'https://drive.google.com/uc?export=view&id=1M7WwiFMF97bWnnUCfQ_pm1tIlHIOBg4U'
const PRINTS_URL  = 'https://drive.google.com/uc?export=view&id=1_OTQRSEL67QT3zkSQgXThEkRnYsfJXl0'

function TierCard({ tier, lang }) {
  const [size, setSize] = useState(tier.sizes[0].label)
  const currentSize = tier.sizes.find(s => s.label === size) || tier.sizes[0]
  const stripeLink = tier.stripeLinks[size] || '#'

  return (
    <div className={`tier ${tier.featured ? 'tier--feat' : ''}`}>
      {tier.featured && (
        <div className="tier__pop">{tier.popularLabel?.[lang] || 'Most Popular'}</div>
      )}

      <div className="tier__oval">
        <img src={tier.image} alt={tier.name} className="tier__duck" />
      </div>

      <h3 className="tier__name">{tier.name}</h3>

      <div className="tier__tagline">
        {tier.pills.map(p => <span key={p} className="tier__pill">{p}</span>)}
      </div>

      <p className="tier__tag">{tier.description[lang]}</p>

      <div className="tier__price">
        <span className="tier__from">{lang === 'es' ? 'desde' : 'from'}</span>
        <span className="tier__amt">€{currentSize.price}</span>
        <span className="tier__per">{lang === 'es' ? '/ mes' : '/ mo.'}</span>
      </div>
      <p className="tier__note">{lang === 'es' ? `por bolsa de ${size}` : `per ${size} bag`}</p>

      <div className="tier__rule" />

      <ul className="tier__feats">
        {tier.features[lang].map(f => <li key={f}>{f}</li>)}
      </ul>

      <div className="tier__size-lbl">{lang === 'es' ? 'Elige el tamaño' : 'Select size'}</div>
      <div className="tier__sizes">
        {tier.sizes.map(s => (
          <button
            key={s.label}
            className={`sz ${size === s.label ? 'on' : ''}`}
            onClick={() => setSize(s.label)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="tier__actions">
        <a href={stripeLink} className="tier__cta">
          {lang === 'es' ? 'Empieza tu Sub' : 'Start Your Sub'}
        </a>
        <Link to={`/subs/${tier.slug}`} className="tier__detail-link">
          {lang === 'es' ? 'Ver detalles' : 'Learn more'}
        </Link>
      </div>
    </div>
  )
}

// ── Hardcoded fallback FAQ (used when the API sheet isn't available yet) ───────
const FALLBACK_FAQS_ES = [
  { q: '¿Cómo funcionan las suscripciones?', a: 'Nuestras suscripciones son simples y flexibles. Una vez que completes el formulario, te recomendaremos un plan. Al inicio de cada mes, recibirás café de especialidad fresco adaptado a tus preferencias de sabor y preparación. Puedes cambiar o cancelar en cualquier momento.' },
  { q: '¿Qué café recibiré cada mes?', a: 'Cada mes recibirás un café diferente — nunca el mismo dos meses seguidos. Cada selección se cuida según tu nivel y perfil de sabor.' },
  { q: '¿Puedo recibir el mismo café cada mes?', a: '¡Haremos todo lo posible! Mientras haya stock, lo gestionamos. Escríbenos un email y lo resolvemos.' },
  { q: '¿A dónde enviáis?', a: 'Enviamos desde Madrid a toda la España peninsular, Portugal y Andorra.' },
  { q: '¿Cuánto cuesta el envío?', a: 'El envío es gratuito en pedidos superiores a 30€. En caso contrario, se aplica un pequeño coste de 3,50€.' },
  { q: '¿Cómo puedo cambiar o cancelar mi suscripción?', a: 'Puedes cambiar o cancelar tu suscripción en cualquier momento desde el <a href="/portal" style="color:var(--yellow)">Portal</a>. Sin llamadas, sin complicaciones.' },
  { q: '¿Ofrecéis compras puntuales?', a: '¡Sí! Echa un vistazo al <strong>Passport: Ranger 3-Pack</strong> — un trío de cafés seleccionados para explorar la gama Butler antes de suscribirte.' },
]

const FALLBACK_FAQS_EN = [
  { q: 'How do subscriptions work?', a: 'Our subscriptions are simple and flexible. Once you complete our form, we\'ll recommend a plan. At the start of each month, you\'ll receive fresh specialty coffee tailored to your taste and brew preferences. Change or cancel anytime.' },
  { q: 'What coffee will I get each month?', a: 'Every month you\'ll receive a different coffee — never the same one two months in a row. We curate each selection based on your tier and taste profile.' },
  { q: 'Can I get the same coffee each month?', a: 'We\'ll do our best! As long as there is supply, we can make it happen. Just drop us an email and we\'ll sort it out.' },
  { q: 'Where do you ship to?', a: 'We ship from our base in Madrid to mainland Spain, Portugal and Andorra.' },
  { q: 'How much is shipping?', a: 'Shipping is free on all orders over €30. Otherwise, a flat fee of €3.50 applies.' },
  { q: 'How can I change or cancel my subscription?', a: 'You can change or cancel your subscription anytime through your <a href="/portal" style="color:var(--yellow)">Portal</a>. No calls, no hassle.' },
  { q: 'Do you offer one-time purchases?', a: 'Yes! Check out our <strong>Passport: Ranger 3-Pack</strong> — a curated trio of coffees to explore the Butler range before committing to a subscription.' },
]

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq__item ${open ? 'faq__item--open' : ''}`}>
      <button className="faq__q" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className="faq__icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq__a" dangerouslySetInnerHTML={{ __html: a }} />}
    </div>
  )
}

export default function Home() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  // Blog teaser — latest featured posts from API
  const { posts: featuredPosts } = useFeaturedPosts(3)

  // FAQ — try to load from API, fall back to hardcoded content
  const [apiFaqs, setApiFaqs] = useState(null) // null = not yet tried

  useEffect(() => {
    getFaqs().then(data => setApiFaqs(data)).catch(() => setApiFaqs([]))
  }, [])

  // Build the FAQ list: use API data if we got entries, otherwise hardcoded fallback
  const faqs = (() => {
    if (apiFaqs && apiFaqs.length > 0) {
      return apiFaqs.map(f => ({
        q: isEs ? (f.question_es || f.question_en) : (f.question_en || f.question_es),
        a: isEs
          ? renderMarkdown(f.answer_es || f.answer_en)
          : renderMarkdown(f.answer_en || f.answer_es),
      }))
    }
    return isEs ? FALLBACK_FAQS_ES : FALLBACK_FAQS_EN
  })()

  return (
    <Layout>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="hero-section" id="home">
        <div className="hero">
          <div className="hero__text">
            <span className="badge hero__badge">
              {isEs ? 'Entrega de Café' : 'Coffee Delivery'}
            </span>
            <h1 className="hero__headline">
              {isEs ? 'Impulsa tu\nespacio.' : 'Fuel your\nworkspace.'}
            </h1>
            <p className="hero__sub">
              {isEs
                ? <>Butler entrega suscripciones de café de especialidad a tu medida, <strong>cada mes</strong>. Fresco, consistente y sin complicaciones.</>
                : <>Butler delivers tailor-made specialty coffee subscriptions to your workspace <strong>every month</strong>. Fresh, consistent, no-hassle.</>
              }
            </p>
            <div className="hero__actions">
              <Link to="/subs" className="btn btn--yellow btn--lg">
                {isEs ? 'Encuentra tu Sub' : 'Find Your Sub'}
              </Link>
              <a href="#how" className="btn btn--ghost btn--lg">
                {isEs ? 'Cómo Funciona' : 'How It Works'}
              </a>
            </div>
          </div>

          <div className="hero__img-wrap">
            <img
              className="hero__img"
              src={HERO_IMG}
              alt="Butler Coffee specialty bag"
              onError={e => { e.currentTarget.parentElement.style.display = 'none' }}
            />
          </div>
        </div>
      </section>


      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Cómo Funciona' : 'How It Works'}</span>
            <h2 className="section-title">
              {isEs ? 'El gran café no tiene\nque ser complicado.' : "Great coffee doesn't\nhave to be complicated."}
            </h2>
            <p className="section-sub">
              {isEs
                ? 'Responde unas preguntas rápidas y encontraremos los granos perfectos para ti y tu equipo.'
                : "Answer a few quick questions and we'll match you with great beans for you and your team."}
            </p>
          </div>

          <div className="how__grid">
            {[
              {
                num: '01',
                en: { title: 'Taste',  text: 'Tell us what flavors you like and we\'ll deliver the perfect match every month.', items: ['Chocolate & nut profiles','Fruity & floral profiles','Single origin or blends'] },
                es: { title: 'Sabor',  text: 'Cuéntanos qué sabores te gustan y entregaremos la combinación perfecta cada mes.', items: ['Perfiles de chocolate y frutos secos','Perfiles afrutados y florales','Origen único o mezclas'] },
              },
              {
                num: '02',
                en: { title: 'Brew',   text: 'We make sure your coffee arrives ready to brew exactly how you like it.', items: ['Whole bean or ground','Matched to your brew method','Grind size options'] },
                es: { title: 'Método', text: 'Nos aseguramos de que tu café llegue listo para prepararlo exactamente como más te gusta.', items: ['Grano entero o molido','Adaptado a tu método de preparación','Opciones de molienda'] },
              },
              {
                num: '03',
                en: { title: 'Supply', text: "We calculate exactly how much your team needs so you never run dry mid-month.", items: ['Based on your team size','250g, 500g or 1kg bags','Adjust any time'] },
                es: { title: 'Suministro', text: 'Calculamos exactamente cuántos granos necesita tu equipo para que nunca os quedéis sin café.', items: ['Según el tamaño de tu equipo','Bolsas de 250g, 500g o 1kg','Ajústalo cuando quieras'] },
              },
            ].map(card => {
              const c = card[lang] || card.en
              return (
                <div className="how__card" key={card.num}>
                  <div className="how__num">{card.num}</div>
                  <h3 className="how__title">{c.title}</h3>
                  <p className="how__text">{c.text}</p>
                  <ul className="how__list">
                    {c.items.map(i => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>


      {/* ── SUBSCRIPTIONS ──────────────────────────────────────────────────── */}
      <section className="section" id="subscriptions" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Entrega de Café' : 'Coffee Delivery'}</span>
            <h2 className="section-title">{isEs ? 'Elige tu Aventura' : 'Choose Your Adventure'}</h2>
            <p className="section-sub">
              {isEs
                ? 'Cuatro niveles de café de especialidad — desde tazas fiables para el día a día hasta granos premiados y únicos. Todo seleccionado a mano, entregado cada mes.'
                : 'Four tiers of specialty coffee — from reliable everyday cups to rare, award-winning beans. All handpicked, delivered every month.'}
            </p>
          </div>
        </div>

        <div className="subs__scroll-wrap">
          <div className="subs__scroll">
            <div className="subs__track">
              {TIERS.map(tier => (
                <TierCard key={tier.id} tier={tier} lang={lang} />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ── MACHINES TEASER ────────────────────────────────────────────────── */}
      <section className="section surf-section" id="machines">
        <div className="wrap">
          <div className="sh">
            <span className="badge">{isEs ? 'Máquinas de Café' : 'Coffee Machines'}</span>
            <h2 className="section-title">
              {isEs ? 'La máquina perfecta\npara cada espacio.' : 'The right machine\nfor every workspace.'}
            </h2>
            <p className="section-sub">
              {isEs
                ? 'Trabajamos con los mejores del sector para que tu equipo pueda preparar un café excelente, cada día.'
                : "We partner with the best in the business so your team can brew great coffee — every single day."}
            </p>
          </div>

          <div className="machines-teaser">
            {[
              {
                brand: 'Jura',
                name: isEs ? 'Línea Profesional' : 'Professional Line',
                desc: isEs
                  ? 'Máquinas automáticas de espresso de ingeniería suiza para uso intensivo en la oficina. De 30 a más de 100 cafés al día.'
                  : 'Swiss-engineered automatic espresso machines built for serious office use. From 30 to 100+ cups per day.',
                price: '€1,299',
                icon: '🇨🇭',
                slug: '/machines',
              },
              {
                brand: 'Behmor',
                name: 'Brazen Plus 3',
                desc: isEs
                  ? 'Preparación por lotes de precisión para equipos que se toman en serio su café de filtro. Control de temperatura hasta 0,1°.'
                  : 'Precision batch brewing for teams that take their filter coffee seriously. Temperature control to 0.1°.',
                price: '€199',
                icon: '☕',
                slug: '/machines',
              },
            ].map(m => (
              <div className="machine-preview" key={m.brand}>
                <div className="machine-preview__img">
                  <span style={{ fontSize: '4rem', opacity: 0.15 }}>{m.icon}</span>
                </div>
                <div className="machine-preview__body">
                  <div className="machine-preview__brand">{m.brand}</div>
                  <h3 className="machine-preview__name">{m.name}</h3>
                  <p className="machine-preview__desc">{m.desc}</p>
                  <div className="machine-preview__footer">
                    <div className="machine-preview__price">
                      <span>{isEs ? 'Desde' : 'From'}</span>
                      {m.price}
                    </div>
                    <Link to={m.slug} className="btn btn--ghost btn--sm">
                      {isEs ? 'Ver máquinas →' : 'Explore →'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── BLOG PREVIEW ───────────────────────────────────────────────────── */}
      <section className="section" id="blog">
        <div className="wrap">
          <div className="blog-header">
            <div>
              <span className="badge">{isEs ? 'Del Grano a la Taza' : 'From the Grind'}</span>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                {isEs ? 'Últimas lecturas.' : 'Latest reads.'}
              </h2>
            </div>
            <Link to="/blog" className="btn btn--ghost btn--sm blog-header__all">
              {isEs ? 'Ver todo →' : 'View all →'}
            </Link>
          </div>

          <div className="blog-grid">
            {featuredPosts.map(post => {
              const title = post[`title_${lang}`] || post.title_en
              const imgSrc = post.imageUrl ? normalizeDriveUrl(post.imageUrl, 'w500') : null
              return (
                <Link to={`/blog/${post.slug}`} className="post-card" key={post.id}>
                  <div className="post-card__img">
                    {imgSrc
                      ? <img src={imgSrc} alt={post.imageAlt || title} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy" decoding="async" />
                      : null
                    }
                  </div>
                  <div className="post-card__body">
                    <div className="post-card__meta">
                      {post.author    && <span>{post.author}</span>}
                      {post.updatedAt && <span>{formatDate(post.updatedAt, lang)}</span>}
                    </div>
                    <h3 className="post-card__title">{title}</h3>
                    <span className="post-card__link">{isEs ? 'Leer →' : 'Read →'}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>


      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="section surf-section" id="faq">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Preguntas Frecuentes' : 'FAQ'}</span>
            <h2 className="section-title">
              {isEs ? '¿Dudas? Te lo explicamos.' : "Questions? We've got answers."}
            </h2>
          </div>
          <div className="faq__list">
            {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>


      {/* ── LOGOS ──────────────────────────────────────────────────────────── */}
      <div className="logos-band">
        <div className="wrap">
          <p className="logos-band__label">
            {isEs ? 'Con la confianza de oficinas y equipos en toda España' : 'Trusted by offices & teams across Spain'}
          </p>
          <div className="logos-band__row">
            {['ShuttleCloud','El Güiri Studios','emailprefs','BEARDFACE'].map(name => (
              <div className="logos-band__chip" key={name}><span>{name}</span></div>
            ))}
          </div>
        </div>
      </div>

    </Layout>
  )
}

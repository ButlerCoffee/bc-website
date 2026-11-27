import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTiers } from '../data/subsApi'
import { useMachines } from '../data/machinesApi'
import { useLogos } from '../data/logosApi'
import { fmtEur } from '../data/format'
import { getFaqs } from '../data/faqApi'
import { useFeaturedPosts, formatDate, normalizeDriveUrl } from '../data/blogApi'
import Layout from '../components/Layout'
import CoffeeCalculator from '../components/CoffeeCalculator'
import { PodsDoodle, BagDoodle } from '../components/Doodles'
import ContactSection from '../components/ContactSection'
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

// Hero background: Pexels "coffee beans cocoa" by Aswin R S (free licence), 720p loop + still
const HERO_VIDEO  = '/videos/hero-beans.mp4'
const HERO_POSTER = '/images/hero-beans.jpg'
const PRINTS_URL  = '/images/footprints.png'

/** Compact homepage tier card: flavour, short description, starting monthly price, link. */
function TierCard({ tier, lang }) {
  const isEs = lang === 'es'
  const from = Math.min(...tier.sizes.map(s => s.price))
  return (
    <Link to={`/subscriptions/${tier.slug}`} className={`tier tier--compact ${tier.featured ? 'tier--feat' : ''}`}>
      {tier.featured && (
        <div className="tier__pop">{tier.popularLabel?.[lang] || 'Most Popular'}</div>
      )}
      <div className="tier__oval">
        <img src={tier.thumb || tier.image} alt="" className="tier__duck" loading="lazy" decoding="async" />
      </div>
      <h3 className="tier__name">{tier.name}</h3>
      {tier.flavor?.[lang] && <span className="tier__pill tier__flavor">{tier.flavor[lang]}</span>}
      <p className="tier__tag">{tier.description[lang]}</p>
      <div className="tier__price">
        <span className="tier__from">{isEs ? 'desde' : 'from'}</span>
        <span className="tier__amt">{fmtEur(from, lang)}</span>
        <span className="tier__per">{isEs ? '/ mes' : '/ mo.'}</span>
      </div>
      <span className="tier__cta">{isEs ? 'Ver' : 'See'} {tier.name.replace(/ Coffee$/, '')} →</span>
    </Link>
  )
}

// ── Hardcoded fallback FAQ (used when the API sheet isn't available yet) ───────
const FALLBACK_FAQS_ES = [
  { q: '¿Cómo funcionan las suscripciones?', a: 'Elige tu nivel (Base, Explorer, Alpine o Summit), el tamaño de bolsa y la molienda. Cada mes seleccionamos a mano un café de especialidad para tu nivel y te lo enviamos recién tostado. Puedes cambiar o cancelar en cualquier momento.' },
  { q: '¿Qué café recibiré cada mes?', a: 'Cada mes recibirás un café diferente — nunca el mismo dos meses seguidos. Lo seleccionamos a mano para tu nivel.' },
  { q: '¿Puedo recibir el mismo café cada mes?', a: '¡Haremos todo lo posible! Mientras haya stock, lo gestionamos. Escríbenos un email y lo resolvemos.' },
  { q: '¿A dónde enviáis?', a: 'Enviamos desde Madrid a toda la España peninsular, Portugal y Andorra.' },
  { q: '¿Cuánto cuesta el envío?', a: 'El envío es gratuito en pedidos de 30€ o más. En caso contrario, se aplica un pequeño coste de 5€.' },
  { q: '¿Cómo puedo cambiar o cancelar mi suscripción?', a: 'Puedes cambiar o cancelar tu suscripción en cualquier momento desde el <a href="/portal" style="color:var(--yellow)">Portal</a>. Sin llamadas, sin complicaciones.' },
  { q: '¿Ofrecéis compras puntuales?', a: '¡Sí! Elige cualquier nivel en <a href="/store/coffee" style="color:var(--yellow)">Café por bolsa</a> y te seleccionamos una bolsa, sin suscripción.' },
]

const FALLBACK_FAQS_EN = [
  { q: 'How do subscriptions work?', a: 'Choose your tier (Base, Explorer, Alpine or Summit), bag size and grind. Each month we handpick a specialty coffee for your tier and ship it freshly roasted. Change or cancel anytime.' },
  { q: 'What coffee will I get each month?', a: 'Every month you\'ll receive a different coffee — never the same one two months in a row. We handpick each selection for your tier.' },
  { q: 'Can I get the same coffee each month?', a: 'We\'ll do our best! As long as there is supply, we can make it happen. Just drop us an email and we\'ll sort it out.' },
  { q: 'Where do you ship to?', a: 'We ship from our base in Madrid to mainland Spain, Portugal and Andorra.' },
  { q: 'How much is shipping?', a: 'Shipping is free on all orders of €30 or more. Otherwise, a flat fee of €5 applies.' },
  { q: 'How can I change or cancel my subscription?', a: 'You can change or cancel your subscription anytime through your <a href="/portal" style="color:var(--yellow)">Portal</a>. No calls, no hassle.' },
  { q: 'Do you offer one-time purchases?', a: 'Yes! Pick any tier in <a href="/store/coffee" style="color:var(--yellow)">Coffee by the bag</a> and we\'ll handpick a bag for you, no subscription required.' },
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
  const { tiers } = useTiers()
  const { machines } = useMachines()
  const logos = useLogos()
  const fromPrice = brand => {
    const prices = machines.filter(m => m.brand === brand && m.price > 0).map(m => m.price)
    return prices.length ? fmtEur(Math.min(...prices), lang) : ''
  }
  // Photos for the machines teaser: Jura GIGA X8 (pro line) and Behmor Brazen Plus
  const machinePhoto = (brand, nameMatch) => {
    const list = machines.filter(m => m.brand === brand && m.images?.length)
    const m = list.find(x => nameMatch.test(x.name)) || list[0]
    return m ? { src: m.images[0], alt: `${m.brandName} ${m.name}`, href: `/store/machines/${m.slug}` } : null
  }

  // Blog teaser — latest featured posts from API
  const { posts: featuredPosts } = useFeaturedPosts(3)

  // FAQ — try to load from API, fall back to hardcoded content
  const [apiFaqs, setApiFaqs] = useState(null) // null = not yet tried
  // Play the hero video on wider screens only; phones, data-saver and
  // reduced-motion visitors get the still image (saves ~7 MB of mobile data).
  const [heroVideo, setHeroVideo] = useState(() => {
    try {
      const wide = window.matchMedia('(min-width: 768px)').matches
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const saveData = navigator.connection?.saveData === true
      return wide && !calm && !saveData
    } catch { return false }
  })

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
    <Layout title="">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="hero-section hero-section--media" id="home">
        <div className="hero-media" aria-hidden="true">
          <img className="hero-media__img" src={HERO_POSTER} alt="" />
          {heroVideo && (
            <video className="hero-media__video" src={HERO_VIDEO} poster={HERO_POSTER}
              autoPlay muted loop playsInline preload="auto"
              onError={() => setHeroVideo(false)} />
          )}
          <div className="hero-media__shade" />
        </div>
        <div className="hero">
          <div className="hero__text">
            <span className="badge hero__badge">
              {isEs ? 'Café de pato madre' : 'Ducking good coffee'}
            </span>
            <h1 className="hero__headline">
              {isEs ? 'Impulsa tu espacio.' : 'Fuel your space.'}
            </h1>
            <p className="hero__sub">
              {isEs
                ? 'Un buen café alegra el día. Recibe café de especialidad a principios de cada mes con nuestra suscripción pensada para espacios de trabajo, equipos y ejércitos de uno.'
                : 'Better coffee makes for brighter days. Get specialty coffee at the start of each month with our subscription built for workspaces, teams & armies of one.'}
            </p>
            <div className="hero__actions">
              <Link to="/subscriptions" className="btn btn--yellow btn--lg hero__cta-main">
                {isEs ? 'Ver suscripciones' : 'Explore Subscriptions'}
              </Link>
              <Link to="/store/coffee" className="btn btn--ghost btn--lg">
                {isEs ? 'Tienda' : 'Shop'}
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* ── SUBSCRIPTIONS ──────────────────────────────────────────────────── */}
      <section className="section home-tiers" id="subscriptions">
        <div className="wrap">
          <div className="sh sh--center">
            <span className="badge">{isEs ? 'Entrega de Café' : 'Coffee Delivery'}</span>
            <h2 className="section-title">{isEs ? 'Elige tu Aventura' : 'Choose Your Adventure'}</h2>
            <p className="section-sub">
              {isEs
                ? 'Cuatro formas de descubrir el café de especialidad. Encuentra la que va contigo.'
                : 'Four ways to explore specialty coffee. Find the one that feels like you.'}
            </p>
          </div>
        </div>

        <div className="wrap">
          <div className="home-tiers__grid">
            {tiers.map(tier => <TierCard key={tier.id} tier={tier} lang={lang} />)}
          </div>
        </div>
      </section>


      {/* ── ONE-TIME BAG CALLOUT ────────────────────────────────────────────── */}
      <section className="bag-callout">
        <div className="wrap">
          <div className="bag-callout__box">
            <div className="bag-callout__main">
              <BagDoodle className="bag-callout__art" />
              <div>
              <h2 className="bag-callout__title">{isEs ? '¿Quieres probar una bolsa primero?' : 'Want to try a bag first?'}</h2>
              <p className="bag-callout__text">
                {isEs
                  ? 'Elige cualquier nivel y te seleccionamos una bolsa a mano. Una compra única, sin suscripción.'
                  : 'Pick any tier and we’ll handpick a bag for you. A one-time purchase, with no subscription required.'}
              </p>
              </div>
            </div>
            <Link to="/store/coffee" className="btn btn--ghost btn--lg">
              {isEs ? 'Comprar café por bolsa →' : 'Shop coffee by the bag →'}
            </Link>
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
            {logos.map(l => {
              const img = <img src={l.image} alt={l.alt[lang] || l.alt.en} loading="lazy" decoding="async" />
              return l.link
                ? <a className="logos-band__logo" key={l.id} href={l.link} target="_blank" rel="noopener noreferrer">{img}</a>
                : <div className="logos-band__logo" key={l.id}>{img}</div>
            })}
          </div>
        </div>
      </div>

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
                ? 'Configura tu suscripción una vez. Nosotros nos encargamos del café cada mes.'
                : 'Set up your subscription once. We’ll take care of the coffee every month.'}
            </p>
          </div>

          <div className="how__grid">
            {[
              {
                num: '01',
                en: { title: 'Choose your tier', text: 'Pick the level that fits your taste and budget, from everyday Base to rare Summit.', items: ['Base, Explorer, Alpine or Summit', 'Change tier any time', 'Starting from €13 / month'] },
                es: { title: 'Elige tu nivel', text: 'Escoge el nivel que encaja con tu gusto y presupuesto, desde el Base del día a día hasta el exclusivo Summit.', items: ['Base, Explorer, Alpine o Summit', 'Cambia de nivel cuando quieras', 'Desde 13 € / mes'] },
              },
              {
                num: '02',
                en: { title: 'We handpick', text: 'Each month we select a coffee for your tier from the best roasters. Never the same coffee two months running.', items: ['Curated for each tier', 'Freshly roasted', 'Whole bean or ground to your brew method'] },
                es: { title: 'Seleccionamos', text: 'Cada mes elegimos un café para tu nivel entre los mejores tostadores. Nunca el mismo dos meses seguidos.', items: ['Seleccionado para cada nivel', 'Recién tostado', 'En grano o molido para tu método'] },
              },
              {
                num: '03',
                en: { title: 'Delivered monthly', text: 'Choose the amount you need and we deliver it to your home or office at the start of each month.', items: ['250g, 500g or 1kg bags', 'Free shipping from €30', 'Adjust or cancel any time'] },
                es: { title: 'Cada mes, en tu puerta', text: 'Elige la cantidad que necesitas y te la llevamos a casa o a la oficina a principios de cada mes.', items: ['Bolsas de 250g, 500g o 1kg', 'Envío gratis desde 30 €', 'Ajusta o cancela cuando quieras'] },
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


      {/* ── COFFEE CALCULATOR ─────────────────────────────────────────────── */}
      <CoffeeCalculator />

      {/* ── SPECIALTY VS PODS LINK ────────────────────────────────────────── */}
      <section className="bag-callout pods-callout">
        <div className="wrap">
          <div className="bag-callout__box">
            <div className="bag-callout__main">
              <PodsDoodle className="bag-callout__art" />
              <h2 className="bag-callout__title">{isEs ? '¿Por qué café de especialidad y no cápsulas?' : 'Why choose specialty over pods?'}</h2>
            </div>
            <Link to="/vs-pods" className="btn btn--ghost btn--lg">
              {isEs ? 'Ver la comparación →' : 'See the comparison →'}
            </Link>
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
                ? 'Trabajamos con los mejores del sector para que tu equipo prepare un café excelente cada vez.'
                : 'We partner with the best in the business so your team can brew great coffee every time.'}
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
                price: fromPrice('jura'),
                photo: { ...machinePhoto('jura', /^GIGA X8$/i), href: '/store/machines/jura' },
                slug: '/store/machines/jura',
              },
              {
                brand: 'Behmor',
                name: 'Brazen Plus 3',
                desc: isEs
                  ? 'Preparación por lotes de precisión para equipos que se toman en serio su café de filtro. Control de temperatura hasta 0,1°.'
                  : 'Precision batch brewing for teams that take their filter coffee seriously. Temperature control to 0.1°.',
                price: fromPrice('behmor'),
                photo: machinePhoto('behmor', /brazen/i),
                slug: '/store/machines',
              },
            ].map(m => (
              <div className="machine-preview" key={m.brand}>
                <Link to={m.photo?.href || m.slug} className="machine-preview__img">
                  {m.photo && <img src={m.photo.src} alt={m.photo.alt} loading="lazy" decoding="async" />}
                </Link>
                <div className="machine-preview__body">
                  <div className="machine-preview__brand">{m.brand}</div>
                  <h3 className="machine-preview__name">{m.name}</h3>
                  <p className="machine-preview__desc">{m.desc}</p>
                  <div className="machine-preview__footer">
                    <div className="machine-preview__price">
                      <span>{isEs ? 'Desde' : 'From'}</span>
                      {m.price}
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link to="/store/machines" className="btn btn--yellow">
              {isEs ? 'Ver máquinas de café' : 'Shop coffee machines'}
            </Link>
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


      {/* ── CONTACT ────────────────────────────────────────────────────────── */}
      <ContactSection />

    </Layout>
  )
}

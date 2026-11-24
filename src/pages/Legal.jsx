import { Link, useParams, Navigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { getLegalBySlug, LEGAL_NAV } from '../data/legal'
import Layout from '../components/Layout'
import { useSettings, fillSettings } from '../data/settingsApi'
import './Legal.css'

export default function Legal() {
  const { slug } = useParams()
  const { lang } = useLang()
  const page = getLegalBySlug(slug)
  const isEs = lang === 'es'
  const settings = useSettings()
  const fill = t => fillSettings(t, settings)

  if (!page) return <Navigate to="/" replace />

  return (
    <Layout title={page ? (page.title[lang] || page.title.en) : undefined}>
      <div className="legal-page">

        {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
        <aside className="legal-sidebar">
          <div className="legal-sidebar__inner">
            <Link to="/" className="page-hero__back" style={{ marginBottom: 20, display: 'inline-flex' }}>
              {isEs ? '← Inicio' : '← Home'}
            </Link>
            <h4 className="legal-sidebar__title">{isEs ? 'Legal' : 'Legal'}</h4>
            <nav>
              {LEGAL_NAV.map(item => (
                <Link
                  key={item.slug}
                  to={`/legal/${item.slug}`}
                  className={`legal-sidebar__link ${item.slug === slug ? 'legal-sidebar__link--active' : ''}`}
                >
                  {item.title[lang] || item.title.en}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── CONTENT ───────────────────────────────────────────────────── */}
        <main className="legal-content">
          <div className="legal-content__header">
            <span className="badge">Legal</span>
            <h1 className="legal-content__title">
              {page.title[lang] || page.title.en}
            </h1>
            <p className="legal-content__updated">
              {isEs ? 'Última actualización:' : 'Last updated:'} {settings.legalUpdated || page.lastUpdated}
            </p>
          </div>

          <div className="legal-content__intro">
            {fill(page.intro[lang] || page.intro.en)}
          </div>

          <div className="legal-content__sections">
            {page.sections.map((section, i) => (
              <div className="legal-section" key={i}>
                <h2 className="legal-section__heading">
                  {section.heading[lang] || section.heading.en}
                </h2>
                <p className="legal-section__body">
                  {fill(section.body[lang] || section.body.en)}
                </p>
              </div>
            ))}
          </div>

          {/* Nav between legal pages */}
          <div className="legal-nav-bar">
            <p className="legal-nav-bar__label">
              {isEs ? 'Más documentos legales:' : 'More legal documents:'}
            </p>
            <div className="legal-nav-bar__links">
              {LEGAL_NAV.filter(item => item.slug !== slug).map(item => (
                <Link key={item.slug} to={`/legal/${item.slug}`} className="legal-nav-bar__link">
                  {item.title[lang] || item.title.en} →
                </Link>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div className="legal-contact">
            <div className="legal-contact__icon">❓</div>
            <div>
              <strong>{isEs ? '¿Preguntas?' : 'Questions?'}</strong>
              <p>
                {isEs
                  ? 'Si tienes preguntas sobre estos términos, contáctanos en '
                  : 'If you have questions about any of these terms, reach us at '}
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </p>
            </div>
          </div>
        </main>

      </div>
    </Layout>
  )
}

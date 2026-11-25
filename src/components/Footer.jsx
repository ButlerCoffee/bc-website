import { Link } from 'react-router-dom'
import { useSettings } from '../data/settingsApi'
import { useLang } from '../context/LangContext'
import { useLegalPages } from '../data/legalApi'
import { PHONE, telHref } from '../data/contact'
import './Footer.css'

const LOGO_URL   = '/BC_outlineLogo.svg'
const PRINTS_URL = '/images/footprints.png'

// Contact details in the footer brand column
const INSTAGRAM = { handle: '@butlercoffeemadrid', url: 'https://www.instagram.com/butlercoffeemadrid/' }

export default function Footer() {
  const { lang, t } = useLang()
  const year = new Date().getFullYear()

  const productLinks = [
    { to: '/store/coffee',   label: t('nav_coffee') },
    { to: '/subscriptions',  label: t('nav_subscriptions') },
    { to: '/store/machines', label: t('nav_machines') },
    { to: '/vs-pods',  label: t('nav_vs_pods') },
    { to: '/blog',     label: t('nav_blog') },
    { to: '/portal',   label: t('nav_portal') },
  ]

  const settings = useSettings()
  const { pages: legalPages } = useLegalPages()
  const companyLinks = [
    { to: '/about',   label: t('nav_about') },
    { to: '/contact', label: t('nav_contact') },
    { href: '/#faq',  label: 'FAQ' },
  ]

  return (
    <footer className="footer">
      <img className="footer__prints" src={PRINTS_URL} alt="" aria-hidden="true" />

      <div className="wrap">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand-col">
            <Link to="/" className="footer__logo">
              <img src={LOGO_URL} alt="" className="footer__logo-img" />
              <span className="footer__name">Butler Coffee</span>
            </Link>
            <ul className="footer__contact">
              <li>
                <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer">
                  <span className="footer__contact-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                  </span>
                  {INSTAGRAM.handle}
                </a>
              </li>
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`}>
                    <span className="footer__contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                    </span>
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {PHONE && (
                <li>
                  <a href={telHref()}>
                    <span className="footer__contact-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
                    </span>
                    {PHONE}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Product */}
          <div className="footer__col">
            <h4>{t('footer_product')}</h4>
            <ul>
              {productLinks.map(({ to, label }) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="footer__col">
            <h4>{t('footer_company')}</h4>
            <ul>
              {companyLinks.map(({ to, href, label }) => (
                <li key={label}>
                  {to ? <Link to={to}>{label}</Link> : <a href={href}>{label}</a>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          <span className="footer__copy">© {year} {settings.companyName} — Madrid</span>

          {/* Legal links */}
          <nav className="footer__legal" aria-label="Legal">
            {legalPages.map(({ slug, title }) => (
              <Link key={slug} to={`/legal/${slug}`}>
                {title[lang] || title.en}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}

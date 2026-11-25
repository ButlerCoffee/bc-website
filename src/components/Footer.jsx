import { Link } from 'react-router-dom'
import { useSettings } from '../data/settingsApi'
import { useLang } from '../context/LangContext'
import { useLegalPages } from '../data/legalApi'
import './Footer.css'

const LOGO_URL   = '/BC_outlineLogo.svg'
const PRINTS_URL = '/images/footprints.png'

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
    { href: `mailto:${settings.contactEmail}`, label: settings.contactEmail },
  ]

  return (
    <footer className="footer">
      <img className="footer__prints" src={PRINTS_URL} alt="" aria-hidden="true" />

      <div className="wrap">
        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand-col">
            <Link to="/" className="footer__logo">
              <img src={LOGO_URL} alt="Butler Coffee" className="footer__logo-img" />
            </Link>
            <p className="footer__tagline">{t('footer_tag')}</p>
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

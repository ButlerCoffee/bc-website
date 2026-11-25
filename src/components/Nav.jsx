import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useCart, CART_ENABLED } from '../context/CartContext'
import { useStoreSections } from './StoreNav'
import './Nav.css'

const LOGO_URL = '/BC_outlineLogo.svg'

export default function Nav() {
  const { lang, switchLang, t } = useLang()
  const cart = useCart()
  const storeSections = useStoreSections()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef(null)
  const location = useLocation()

  // Close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [location])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Single menu items; Goods appears only once it has a product
  const hasGoods = storeSections.some(s => s.to === '/store/goods')
  const navLinks = [
    { to: '/store/coffee',   label: t('nav_coffee') },
    { to: '/subscriptions',  label: t('nav_subscriptions') },
    { to: '/store/machines', label: t('nav_machines') },
    ...(hasGoods ? [{ to: '/store/goods', label: t('nav_goods') }] : []),
    { to: '/blog',     label: t('nav_blog') },
    { to: '/contact',  label: t('nav_contact') },
    { to: '/portal',   label: t('nav_portal') },
  ]

  return (
    <nav className={`nav ${scrolled ? 'nav--scrolled' : ''} ${open ? 'nav--open' : ''}`} ref={drawerRef}>
      <div className="nav__bar">
        {/* Logo */}
        <Link to="/" className="nav__logo">
          <img src={LOGO_URL} alt="" className="nav__logo-img" />
          <span className="nav__logo-name">Butler Coffee</span>
        </Link>

        {/* Desktop links */}
        <ul className="nav__links">
          {navLinks.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="nav__right">
          <div className="lang-toggle" role="group" aria-label="Language">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLang('en')}>EN</button>
            <button className={`lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => switchLang('es')}>ES</button>
          </div>
          {CART_ENABLED && (
            <button
              className="nav__cart"
              onClick={cart.open}
              aria-label={`${lang === 'es' ? 'Carrito' : 'Cart'} (${cart.count})`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 7h12l-1 13H7L6 7z" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </svg>
              {cart.count > 0 && <span className="nav__cart-count">{cart.count}</span>}
            </button>
          )}
          <button
            className="nav__burger"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`nav__drawer ${open ? 'nav__drawer--open' : ''}`} aria-hidden={!open}>
        <div className="nav__drawer-inner">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} className="nav__drawer-link">{label}</Link>
          ))}
          <div className="nav__drawer-lang">
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => switchLang('en')}>EN</button>
            <button className={`lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => switchLang('es')}>ES</button>
          </div>
        </div>
      </div>
    </nav>
  )
}

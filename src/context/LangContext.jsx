import { createContext, useContext, useState, useCallback } from 'react'

// ─── Translation strings ─────────────────────────────────────────────────────
const translations = {
  en: {
    // Nav
    brand: 'Butler Coffee',
    nav_coffee: 'Coffee',
    nav_machines: 'Machines',
    nav_blog: 'Artículos',
    nav_about: 'About',
    nav_contact: 'Contact',
    nav_portal: 'Portal',
    nav_cta: 'Find Your Sub',

    // Footer
    footer_copy: '© 2025 Butler Coffee SL — Madrid',
    footer_all_rights: 'All rights reserved',
    footer_product: 'Product',
    footer_company: 'Company',
    footer_legal: 'Legal',
    footer_tag: 'Specialty coffee, delivered to your workspace every month.',

    // Legal link labels
    legal_privacy: 'Privacy Policy',
    legal_cookies: 'Cookies',
    legal_shipping: 'Shipping & Returns',
    legal_terms: 'Terms of Service',
    legal_disclaimer: 'Disclaimer',

    // Common
    from: 'from',
    per_month: '/ mo.',
    back_home: '← Back to home',
    back_subs: '← All subscriptions',
    back_machines: '← All machines',
    back_blog: '← All articles',
    coming_soon: 'Coming soon',
    learn_more: 'Learn more →',
    start_sub: 'Start Your Sub',
    request_quote: 'Request a quote',
    contact_us: 'Talk to us',
  },
  es: {
    brand: 'Butler Coffee',
    nav_coffee: 'Café',
    nav_machines: 'Máquinas',
    nav_blog: 'Artículos',
    nav_about: 'Nosotros',
    nav_contact: 'Contacto',
    nav_portal: 'Portal',
    nav_cta: 'Encuentra tu Sub',

    footer_copy: '© 2025 Butler Coffee SL — Madrid',
    footer_all_rights: 'Todos los derechos reservados',
    footer_product: 'Producto',
    footer_company: 'Empresa',
    footer_legal: 'Legal',
    footer_tag: 'Café de especialidad, entregado en tu espacio cada mes.',

    legal_privacy: 'Política de Privacidad',
    legal_cookies: 'Cookies',
    legal_shipping: 'Envíos y Devoluciones',
    legal_terms: 'Términos de Servicio',
    legal_disclaimer: 'Aviso Legal',

    from: 'desde',
    per_month: '/ mes',
    back_home: '← Volver al inicio',
    back_subs: '← Todas las suscripciones',
    back_machines: '← Todas las máquinas',
    back_blog: '← Todos los artículos',
    coming_soon: 'Próximamente',
    learn_more: 'Más info →',
    start_sub: 'Empieza tu Sub',
    request_quote: 'Pedir presupuesto',
    contact_us: 'Hablar con nosotros',
  },
}

// ─── Context ─────────────────────────────────────────────────────────────────
const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('bc_lang') || 'en' } catch { return 'en' }
  })

  const switchLang = useCallback((l) => {
    setLang(l)
    try { localStorage.setItem('bc_lang', l) } catch {}
    document.documentElement.setAttribute('lang', l)
  }, [])

  const t = useCallback((key) => translations[lang]?.[key] ?? translations.en[key] ?? key, [lang])

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}

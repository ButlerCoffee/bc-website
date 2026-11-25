import { useEffect } from 'react'
import Nav from './Nav'
import Footer from './Footer'
import CartDrawer from './CartDrawer'
import { CART_ENABLED } from '../context/CartContext'
import './Layout.css'

const SITE_TITLE = 'Butler Coffee — Specialty Coffee for Workspaces'

/**
 * title: page name shown in the browser tab as "<title> · Butler Coffee".
 *   ''        → site default title (home)
 *   undefined → leave the title alone (pages that set it themselves, e.g. BlogPost)
 * bare: no nav, footer or cart drawer (checkout pages)
 * subnav: element shown under the site nav (Store sub-menu)
 */
export default function Layout({ children, noFooter = false, bare = false, subnav = null, title }) {
  useEffect(() => {
    if (title === undefined) return
    document.title = title ? `${title} · Butler Coffee` : SITE_TITLE
  }, [title])

  return (
    <div className={`layout ${bare ? 'layout--bare' : ''}`}>
      {!bare && <Nav />}
      {subnav}
      <main className={`layout__main ${subnav ? 'store-page' : ''}`}>{children}</main>
      {!noFooter && !bare && <Footer />}
      {CART_ENABLED && !bare && <CartDrawer />}
    </div>
  )
}

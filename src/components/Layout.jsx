import { useEffect } from 'react'
import Nav from './Nav'
import Footer from './Footer'
import './Layout.css'

const SITE_TITLE = 'Butler Coffee — Specialty Coffee for Workspaces'

/**
 * title: page name shown in the browser tab as "<title> · Butler Coffee".
 *   ''        → site default title (home)
 *   undefined → leave the title alone (pages that set it themselves, e.g. BlogPost)
 */
export default function Layout({ children, noFooter = false, title }) {
  useEffect(() => {
    if (title === undefined) return
    document.title = title ? `${title} · Butler Coffee` : SITE_TITLE
  }, [title])

  return (
    <div className="layout">
      <Nav />
      <main className="layout__main">{children}</main>
      {!noFooter && <Footer />}
    </div>
  )
}

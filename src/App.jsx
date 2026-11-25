import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

// Pages
import Home       from './pages/Home'
import Subs       from './pages/Subs'
import SubTier    from './pages/SubTier'
import Machines   from './pages/Machines'
import MachinePage from './pages/MachinePage'
import Blog       from './pages/Blog'
import BlogPost   from './pages/BlogPost'
import About      from './pages/About'
import Contact    from './pages/Contact'
import Portal     from './pages/Portal'
import Legal      from './pages/Legal'
import VsPods     from './pages/VsPods'
import Checkout   from './pages/Checkout'
import OrderComplete from './pages/OrderComplete'

// Scroll to top on route change
function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/subs"               element={<Subs />} />
        <Route path="/subs/:tier"         element={<SubTier />} />
        <Route path="/machines"           element={<Machines />} />
        <Route path="/machines/:machine"  element={<MachinePage />} />
        <Route path="/blog"               element={<Blog />} />
        <Route path="/blog/:slug"         element={<BlogPost />} />
        <Route path="/about"              element={<About />} />
        <Route path="/vs-pods"            element={<VsPods />} />
        <Route path="/contact"            element={<Contact />} />
        <Route path="/portal"             element={<Portal />} />
        <Route path="/legal/:slug"        element={<Legal />} />
        <Route path="/checkout"           element={<Checkout />} />
        <Route path="/order/complete"     element={<OrderComplete />} />
        {/* Catch-all → home */}
        <Route path="*"                   element={<Home />} />
      </Routes>
    </>
  )
}

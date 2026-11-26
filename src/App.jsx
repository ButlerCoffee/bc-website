import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
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
import StoreCoffee  from './pages/StoreCoffee'
import StoreProducts from './pages/StoreProducts'
import ProductPage  from './pages/ProductPage'
import OrderComplete from './pages/OrderComplete'
import Calculator from './pages/Calculator'
import JuraLine from './pages/JuraLine'

// Scroll to top on route change, or to #section when the link has one
function ScrollReset() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 250)
    return () => clearTimeout(t)
  }, [pathname, hash])
  return null
}

// Old addresses → new ones (keeps ?query and #hash, e.g. old shared links)
function Moved({ to }) {
  const params = useParams()
  const { search, hash } = useLocation()
  const path = to.replace(/:(\w+)/g, (_, k) => params[k] || '')
  return <Navigate to={`${path}${search}${hash}`} replace />
}

export default function App() {
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/"                   element={<Home />} />
        {/* Subscriptions */}
        <Route path="/subscriptions"        element={<Subs />} />
        <Route path="/calculator"           element={<Calculator />} />
        <Route path="/subscriptions/:tier"  element={<SubTier key="sub" fixedMode="sub" />} />

        {/* Store */}
        <Route path="/store"                   element={<Navigate to="/store/coffee" replace />} />
        <Route path="/store/coffee"            element={<StoreCoffee />} />
        <Route path="/store/coffee/:tier"      element={<SubTier key="once" fixedMode="once" />} />
        <Route path="/store/goods"             element={<StoreProducts />} />
        <Route path="/store/product/:slug"     element={<ProductPage />} />
        <Route path="/store/machines"          element={<Machines />} />
        <Route path="/store/machines/jura"      element={<JuraLine />} />
        <Route path="/store/machines/:machine" element={<MachinePage />} />

        {/* Old addresses */}
        <Route path="/store/specials"     element={<Moved to="/store/coffee" />} />
        <Route path="/subs"               element={<Moved to="/subscriptions" />} />
        <Route path="/subs/:tier"         element={<Moved to="/subscriptions/:tier" />} />
        <Route path="/machines"           element={<Moved to="/store/machines" />} />
        <Route path="/machines/:machine"  element={<Moved to="/store/machines/:machine" />} />
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

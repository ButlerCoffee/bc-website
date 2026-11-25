import { Link, Navigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useProducts, productsIn } from '../data/productsApi'
import { fmtEur } from '../data/format'
import Layout from '../components/Layout'
import './Store.css'

/** Product card (Store coffee products and goods). */
export function ProductCard({ p, lang }) {
  const isEs = lang === 'es'
  return (
    <Link to={`/store/product/${p.slug}`} className="pcard">
      <div className={`pcard__media ${p.images[0] ? '' : 'pcard__media--placeholder'}`}>
        <img src={p.images[0] || '/BC_outlineLogo.svg'} alt={p.name[lang]} loading="lazy" decoding="async" />
        {p.soldOut
          ? <span className="pcard__badge pcard__badge--muted">{isEs ? 'Agotado' : 'Sold out'}</span>
          : p.badge[lang] && <span className="pcard__badge">{p.badge[lang]}</span>}
      </div>
      <div className="pcard__body">
        <span className="pcard__name">{p.name[lang]}</span>
        <div className="pcard__spacer" />
        <div className="pcard__price">
          {fmtEur(p.price, lang)}{p.size && <small>{p.size}</small>}
        </div>
        <span className="btn btn--full btn--ghost">{isEs ? 'Ver producto' : 'View'}</span>
      </div>
    </Link>
  )
}

/** /store/goods — hidden (redirects to the Store) until there is at least one goods product. */
export default function StoreGoods() {
  const { lang } = useLang()
  const { products, loading } = useProducts()
  const list = productsIn(products, 'goods')

  if (!list.length) return loading ? null : <Navigate to="/store/coffee" replace />

  return (
    <Layout title={lang === 'es' ? 'Productos' : 'Goods'}>
      <section className="page-hero">
        <div className="wrap">
          <h1 className="page-hero__title">{lang === 'es' ? 'Productos.' : 'Goods.'}</h1>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="pgrid">
            {list.map(p => <ProductCard key={p.slug} p={p} lang={lang} />)}
          </div>
        </div>
      </section>
    </Layout>
  )
}

import { useProducts, productsIn } from '../data/productsApi'

/** Store sections (nav dropdown, mobile menu, Store landing tiles). */
export const STORE_SECTIONS = [
  { to: '/store/coffee',   en: 'Coffee by the Bag',   es: 'Café por bolsa' },
  { to: '/subscriptions',  en: 'Coffee by the Month', es: 'Café cada mes' },
  { to: '/store/machines', en: 'Machines',            es: 'Máquinas' },
  { to: '/store/goods',    en: 'Goods',               es: 'Productos' },
]

/** Sections to show right now: Goods stays hidden until it has a product. */
export function useStoreSections() {
  const { products } = useProducts()
  const hasGoods = productsIn(products, 'goods').length > 0
  return STORE_SECTIONS.filter(s => s.to !== '/store/goods' || hasGoods)
}

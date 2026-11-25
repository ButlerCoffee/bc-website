import { useLang } from '../context/LangContext'
import Layout from '../components/Layout'
import CoffeeCalculator from '../components/CoffeeCalculator'

/** The coffee calculator on its own page (/calculator). */
export default function Calculator() {
  const { lang } = useLang()
  return (
    <Layout title={lang === 'es' ? 'Calculadora de café' : 'Coffee calculator'}>
      <div className="calculator-page"><CoffeeCalculator /></div>
    </Layout>
  )
}

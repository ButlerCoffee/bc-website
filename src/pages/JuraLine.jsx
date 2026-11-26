import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useMachines, getMachinesByBrand } from '../data/machinesApi'
import Layout from '../components/Layout'
import { MachineCard } from './Machines'
import './Machines.css'

/** Every Jura machine we sell, on one page (/store/machines/jura). */
export default function JuraLine() {
  const { lang } = useLang()
  const isEs = lang === 'es'
  const { machines } = useMachines()
  const jura = getMachinesByBrand(machines, 'jura')

  return (
    <Layout title={isEs ? 'Jura Línea Profesional' : 'Jura Professional Line'}>
      <section className="page-hero">
        <div className="wrap">
          <div className="page-hero__eyebrow">
            <Link to="/store/machines" className="page-hero__back">{isEs ? '← Todas las máquinas' : '← All machines'}</Link>
            <span className="badge">{isEs ? 'Espresso Automático' : 'Automatic Espresso'}</span>
          </div>
          <h1 className="page-hero__title">{isEs ? 'Jura Línea Profesional' : 'Jura Professional Line'}</h1>
          <p className="page-hero__sub">
            {isEs
              ? 'Máquinas automáticas de espresso de ingeniería suiza para uso intensivo en la oficina. De 30 a más de 100 cafés al día.'
              : 'Swiss-engineered automatic espresso machines built for serious office use. From 30 to 100+ cups per day.'}
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="machines-grid">
            {jura.map(m => <MachineCard key={m.id} machine={m} lang={lang} isEs={isEs} />)}
          </div>
        </div>
      </section>
    </Layout>
  )
}

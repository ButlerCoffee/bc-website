import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import './CoffeeCalculator.css'

// ── Brew method → grams of coffee per cup ──────────────────────────────────
const BREW_METHODS = [
  { id: 'auto',    grams: 12, en: 'Automatic Espresso (Jura)',        es: 'Espresso Automático (Jura)' },
  { id: 'manual',  grams: 14, en: 'Manual Espresso',                  es: 'Espresso Manual' },
  { id: 'filter',  grams: 15, en: 'Filter',                           es: 'Filtro' },
  { id: 'immersion', grams: 18, en: 'Immersion (French Press / V60)', es: 'Inmersión (French Press / V60)' },
  { id: 'unsure',  grams: 15, en: 'Not sure',                         es: 'No estoy seguro' },
]

// ── Intake level → cups per person per day ──────────────────────────────────
const INTAKE_LEVELS = [
  { value: 1, cups: 0.75, en: 'Ultra Light', es: 'Ultra Ligero' },
  { value: 2, cups: 1.25, en: 'Light',       es: 'Ligero' },
  { value: 3, cups: 2.5,  en: 'Medium',      es: 'Medio'  },
  { value: 4, cups: 3.5,  en: 'Heavy',       es: 'Fuerte' },
]

// ── Price per kg by tier (matches site-wide comparison pricing) ────────────
const TIER_PRICE_PER_KG = { base: 40, explorer: 50, alpine: 65 }

export default function CoffeeCalculator() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  const [people, setPeople] = useState(12)
  const [intake, setIntake] = useState(3)
  const [brew, setBrew] = useState('unsure')

  const intakeLevel = INTAKE_LEVELS.find(l => l.value === intake) || INTAKE_LEVELS[2]
  const brewMethod = BREW_METHODS.find(b => b.id === brew) || BREW_METHODS[BREW_METHODS.length - 1]

  // "kg of coffee needed" rounds to the nearest half kilo.
  const roundToHalf = n => Math.round(n * 2) / 2

  // Bags round to the nearest whole kilo — exactly x.25 rounds down,
  // anything over x.25 rounds up.
  const roundToBags = n => {
    const floor = Math.floor(n)
    const frac = n - floor
    return Math.max(1, frac > 0.25 ? Math.ceil(n) : floor)
  }

  const { kgNeeded, bags, tierCosts } = useMemo(() => {
    const gramsPerDay = people * intakeLevel.cups * brewMethod.grams
    const kgRaw = (gramsPerDay * 30) / 1000
    const kg = roundToHalf(kgRaw)
    const bagCount = roundToBags(kgRaw) // 1 bag = 1kg
    const costs = Object.fromEntries(
      Object.entries(TIER_PRICE_PER_KG).map(([tier, perKg]) => [tier, bagCount * perKg])
    )
    return { kgNeeded: kg, bags: bagCount, tierCosts: costs }
  }, [people, intakeLevel, brewMethod])

  const fmtNum = n => n.toLocaleString(isEs ? 'es-ES' : 'en-US', { maximumFractionDigits: 1 })
  const fmtEur = n => n.toLocaleString(isEs ? 'es-ES' : 'en-US', { maximumFractionDigits: 0 })
  const bagsLabel = bags === 1
    ? (isEs ? '1 bolsa de 1 kg' : '1 × 1kg bag')
    : (isEs ? `${fmtNum(bags)} bolsas de 1 kg` : `${fmtNum(bags)} × 1kg bags`)

  const tierNames = {
    base:     isEs ? 'Base Coffee'     : 'Base Coffee',
    explorer: isEs ? 'Explorer Coffee' : 'Explorer Coffee',
    alpine:   isEs ? 'Alpine Coffee'   : 'Alpine Coffee',
  }

  return (
    <section className="section surf-section" id="calculator">
      <div className="wrap">
        <div className="sh sh--center">
          <span className="badge">{isEs ? 'Calculadora de Café' : 'Coffee Calculator'}</span>
          <h2 className="section-title">
            {isEs ? '¿Cuánto café necesita\ntu equipo?' : 'How much coffee does\nyour team need?'}
          </h2>
          <p className="section-sub">
            {isEs
              ? 'Ajusta las cifras y calculamos al instante cuánto café necesitáis y lo que costaría cada mes.'
              : "Adjust the numbers and we'll calculate instantly how much coffee you need and what it would cost each month."}
          </p>
        </div>

        <div className="calc-card">
          {/* ── Inputs ─────────────────────────────────────────────────── */}
          <div className="calc-inputs">

            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-people">
                <span>{isEs ? 'Nº de personas' : 'Number of people'}</span>
                <span className="calc-value">{people}</span>
              </label>
              <input
                id="calc-people"
                type="range"
                className="calc-slider"
                min={1}
                max={40}
                step={1}
                value={people}
                onChange={e => setPeople(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--yellow) ${((people - 1) / 39) * 100}%, var(--surf3) ${((people - 1) / 39) * 100}%)`,
                }}
              />
            </div>

            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-intake">
                <span>{isEs ? 'Consumo diario' : 'Daily intake'}</span>
                <span className="calc-value">{intakeLevel[lang] || intakeLevel.en}</span>
              </label>
              <input
                id="calc-intake"
                type="range"
                className="calc-slider"
                min={1}
                max={4}
                step={1}
                value={intake}
                onChange={e => setIntake(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, var(--yellow) ${((intake - 1) / 3) * 100}%, var(--surf3) ${((intake - 1) / 3) * 100}%)`,
                }}
              />
              <div className="calc-ticks">
                {INTAKE_LEVELS.map(l => (
                  <span key={l.value} className={intake === l.value ? 'on' : ''}>
                    {l[lang] || l.en}
                  </span>
                ))}
              </div>
            </div>

            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-brew">
                <span>{isEs ? 'Método de preparación' : 'Brew method'}</span>
              </label>
              <select
                id="calc-brew"
                className="calc-select"
                value={brew}
                onChange={e => setBrew(e.target.value)}
              >
                {BREW_METHODS.map(b => (
                  <option key={b.id} value={b.id}>{b[lang] || b.en}</option>
                ))}
              </select>
              <p className="calc-hint">
                {isEs
                  ? '¿No sabes cuál usaréis? Elige "No estoy seguro" — usamos una estimación media.'
                  : "Not sure which you'll use? Pick \"Not sure\" — we'll use an average estimate."}
              </p>
            </div>

          </div>

          {/* ── Results ────────────────────────────────────────────────── */}
          <div className="calc-results">
            <div className="calc-results__eyebrow">
              {isEs ? 'Estimación mensual' : 'Monthly estimate'}
            </div>
            <div className="calc-results__kg">
              {isEs ? 'Necesitaréis' : "You'll need"} <span>~{fmtNum(kgNeeded)} kg</span> {isEs ? 'de café al mes' : 'of coffee a month'}
            </div>

            <div className="calc-tiers">
              {Object.entries(tierCosts).map(([tier, cost]) => (
                <div className={`calc-tier ${tier === 'explorer' ? 'calc-tier--pop' : ''}`} key={tier}>
                  <div className="calc-tier__info">
                    <div className="calc-tier__name">
                      {tierNames[tier]}
                      {tier === 'explorer' && (
                        <span className="calc-tier__pop-tag">{isEs ? 'Popular' : 'Popular'}</span>
                      )}
                    </div>
                    <div className="calc-tier__bags">{bagsLabel}</div>
                  </div>
                  <div className="calc-tier__price">
                    €{fmtEur(cost)}<small>{isEs ? '/ mes' : '/ mo.'}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="calc-cta">
              <Link to="/subs" className="btn btn--yellow btn--lg">
                {isEs ? 'Encuentra tu Sub' : 'Find Your Sub'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

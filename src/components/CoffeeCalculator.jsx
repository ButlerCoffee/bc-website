import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTiers } from '../data/subsApi'
import { useCart, CART_ENABLED, GRINDS, MAX_QTY, FREE_SHIPPING_FROM, SHIPPING_FEE } from '../context/CartContext'
import { fmtEur } from '../data/format'
import './CoffeeCalculator.css'
import '../pages/Store.css'

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

const DECAF_GRAMS_PER_3 = 250            // 250g of decaf per 3 decaf drinkers, per month
const SIZE_GRAMS = { '200g': 200, '250g': 250, '500g': 500, '1kg': 1000 }
const DEFAULT_TIER = 'base'

/** Round to the nearest half kilo (min 500g): suggestions only use 1kg and 500g bags. */
const toHalfKilos = grams => Math.max(500, Math.round(grams / 500) * 500)

/** Split grams into 1kg / 500g bags (rounded to the nearest 500g). */
function splitIntoBags(grams) {
  let left = toHalfKilos(grams)
  const out = []
  for (const [size, g] of [['1kg', 1000], ['500g', 500]]) {
    const n = Math.floor(left / g)
    if (n > 0) { out.push({ size, qty: n }); left -= n * g }
  }
  return out
}

const fmtKg = (grams, lang) =>
  (grams / 1000).toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', { maximumFractionDigits: 2 }) + ' kg'

export default function CoffeeCalculator() {
  const { lang } = useLang()
  const isEs = lang === 'es'
  const navigate = useNavigate()
  const cart = useCart()
  const { tiers } = useTiers()

  const [people, setPeople] = useState(8)
  const [intake, setIntake] = useState(2)
  const [brew, setBrew] = useState('unsure')
  const [decafOn, setDecafOn] = useState(false)
  const [decaf, setDecaf] = useState(3)
  const [grind, setGrind] = useState('whole')
  const [plan, setPlan] = useState(null)      // null = follow the suggestion
  const [conflict, setConflict] = useState(false)

  // Decaf drinkers can't outnumber drinkers
  useEffect(() => { if (decaf > people) setDecaf(people) }, [people, decaf])

  const intakeLevel = INTAKE_LEVELS.find(l => l.value === intake) || INTAKE_LEVELS[2]
  const brewMethod = BREW_METHODS.find(b => b.id === brew) || BREW_METHODS[BREW_METHODS.length - 1]

  const priceOf = (tierId, size) =>
    tiers.find(t => t.id === (tierId === 'decaf' ? 'explorer' : tierId))?.sizes.find(s => s.label === size)?.price || 0
  const sizesOf = tierId => tiers.find(t => t.id === tierId)?.sizes.map(s => s.label) || []

  // ── Estimate ──────────────────────────────────────────────────────────────
  const decafPeople = decafOn ? Math.min(decaf, people) : 0
  const { regularGrams, decafGrams, suggestion, decafBags } = useMemo(() => {
    const regularPeople = Math.max(0, people - decafPeople)
    const g = regularPeople * intakeLevel.cups * brewMethod.grams * 30
    const dg = decafPeople > 0 ? toHalfKilos(Math.ceil(decafPeople / 3) * DECAF_GRAMS_PER_3) : 0
    return {
      regularGrams: regularPeople > 0 ? toHalfKilos(g) : 0,
      decafGrams: dg,
      suggestion: regularPeople > 0 ? splitIntoBags(g).map(b => ({ tier: DEFAULT_TIER, ...b })) : [],
      decafBags: dg > 0 ? splitIntoBags(dg) : [],
    }
  }, [people, decafPeople, intakeLevel, brewMethod])

  const rows = plan ?? suggestion
  const edited = plan !== null

  const updateRow = (i, patch) => setPlan(rows.map((r, k) => {
    if (k !== i) return r
    const next = { ...r, ...patch }
    if (patch.tier) { const s = sizesOf(patch.tier); if (!s.includes(next.size)) next.size = s[s.length - 1] || s[0] }
    return next
  }))
  const removeRow = i => setPlan(rows.filter((_, k) => k !== i))
  const addRow = () => setPlan([...rows, { tier: DEFAULT_TIER, size: '500g', qty: 1 }])

  // ── Totals ────────────────────────────────────────────────────────────────
  const selectedGrams = rows.reduce((n, r) => n + SIZE_GRAMS[r.size] * r.qty, 0)
  const regularTotal = rows.reduce((n, r) => n + priceOf(r.tier, r.size) * r.qty, 0)
  const decafTotal = decafBags.reduce((n, b) => n + priceOf('decaf', b.size) * b.qty, 0)
  const monthly = regularTotal + decafTotal
  const shipping = monthly === 0 || monthly >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  const diff = selectedGrams - regularGrams
  const match = Math.abs(diff) < 1 ? 'ok' : diff < 0 ? 'short' : 'over'

  const tierName = id => tiers.find(t => t.id === id)?.name.replace(/ Coffee$/, '') || id

  function subscribe(replace = false) {
    const items = [
      ...rows.filter(r => r.qty > 0).map(r => ({ type: 'sub', tierId: r.tier, size: r.size, grind, qty: Math.min(MAX_QTY, r.qty) })),
      ...decafBags.map(b => ({ type: 'sub', tierId: 'decaf', size: b.size, grind, qty: Math.min(MAX_QTY, b.qty) })),
    ]
    if (!items.length) return
    if (!cart.addMany(items, { replace })) { setConflict(true); return }
    setConflict(false)
    navigate('/checkout')
  }

  const slider = (value, min, max) => ({
    background: `linear-gradient(to right, var(--yellow) ${((value - min) / Math.max(1, max - min)) * 100}%, var(--surf3) ${((value - min) / Math.max(1, max - min)) * 100}%)`,
  })

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
              ? 'Ajusta las cifras, elige tus bolsas y suscríbete en un clic.'
              : 'Adjust the numbers, pick your bags and subscribe in one click.'}
          </p>
        </div>

        <div className="calc-card">
          {/* ── Inputs ─────────────────────────────────────────────────── */}
          <div className="calc-inputs">
            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-people">
                <span>{isEs ? 'Nº de personas que toman café' : 'Number of coffee drinkers'}</span>
                <span className="calc-value">{people}</span>
              </label>
              <input id="calc-people" type="range" className="calc-slider" min={1} max={40} step={1}
                value={people} onChange={e => { setPeople(Number(e.target.value)); setPlan(null) }} style={slider(people, 1, 40)} />
            </div>

            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-intake">
                <span>{isEs ? 'Consumo diario por persona' : 'Daily intake / person'}</span>
                <span className="calc-value">{intakeLevel[lang] || intakeLevel.en}</span>
              </label>
              <input id="calc-intake" type="range" className="calc-slider" min={1} max={4} step={1}
                value={intake} onChange={e => { setIntake(Number(e.target.value)); setPlan(null) }} style={slider(intake, 1, 4)} />
              <div className="calc-ticks">
                {INTAKE_LEVELS.map(l => <span key={l.value} className={intake === l.value ? 'on' : ''}>{l[lang] || l.en}</span>)}
              </div>
            </div>

            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-brew"><span>{isEs ? 'Método de preparación' : 'Brew method'}</span></label>
              <select id="calc-brew" className="calc-select" value={brew} onChange={e => { setBrew(e.target.value); setPlan(null) }}>
                {BREW_METHODS.map(b => <option key={b.id} value={b.id}>{b[lang] || b.en}</option>)}
              </select>
            </div>

            {decafOn ? (
              <div className="calc-field calc-decaf">
                <label className="calc-label" htmlFor="calc-decaf">
                  <span>{isEs ? '¿Cuántas personas toman descafeinado?' : 'How many people drink decaf?'}</span>
                  <span className="calc-value">{decafPeople}</span>
                </label>
                <input id="calc-decaf" type="range" className="calc-slider" min={1} max={people} step={1}
                  value={decafPeople} onChange={e => { setDecaf(Number(e.target.value)); setPlan(null) }} style={slider(decafPeople, 1, people)} />
                <button type="button" className="calc-decaf__remove" onClick={() => { setDecafOn(false); setPlan(null) }}>
                  {isEs ? 'Quitar descafeinado' : 'Remove decaf'}
                </button>
              </div>
            ) : (
              <button type="button" className="calc-plan__add calc-decaf__add" onClick={() => { setDecafOn(true); setPlan(null) }}>
                + {isEs ? '¿Añadir descafeinado?' : 'Add decaf?'}
              </button>
            )}

            <div className="calc-field">
              <label className="calc-label" htmlFor="calc-grind"><span>{isEs ? 'Molienda' : 'Grind'}</span></label>
              <select id="calc-grind" className="calc-select" value={grind} onChange={e => setGrind(e.target.value)}>
                {GRINDS.map(g => <option key={g.id} value={g.id}>{g[lang] || g.en}</option>)}
              </select>
            </div>
          </div>

          {/* ── Results + bag plan ─────────────────────────────────────── */}
          <div className="calc-results">
            <div className="calc-results__eyebrow">{isEs ? 'Estimación mensual' : 'Monthly estimate'}</div>
            <div className="calc-results__kg">
              {isEs ? 'Necesitaréis' : "You'll need"} <span>~{fmtKg(regularGrams, lang)}</span>
              {decafGrams > 0 && <> + <span>{fmtKg(decafGrams, lang)}</span> {isEs ? 'descafeinado' : 'decaf'}</>}
              {' '}{isEs ? 'al mes' : 'a month'}
            </div>

            <div className="calc-plan">
              <div className="calc-plan__head">
                <span>{isEs ? 'Tus bolsas cada mes' : 'Your bags each month'}</span>
                {edited && <button type="button" className="calc-plan__reset" onClick={() => setPlan(null)}>{isEs ? 'Volver a la sugerencia' : 'Reset to suggestion'}</button>}
              </div>

              {rows.map((r, i) => (
                <div className="calc-row" key={i}>
                  <select aria-label={isEs ? 'Nivel' : 'Tier'} value={r.tier} onChange={e => updateRow(i, { tier: e.target.value })}>
                    {tiers.map(t => <option key={t.id} value={t.id}>{tierName(t.id)}</option>)}
                  </select>
                  <select aria-label={isEs ? 'Tamaño' : 'Size'} value={r.size} onChange={e => updateRow(i, { size: e.target.value })}>
                    {sizesOf(r.tier).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="qty" role="group" aria-label={isEs ? 'Cantidad' : 'Quantity'}>
                    <button onClick={() => updateRow(i, { qty: Math.max(1, r.qty - 1) })} disabled={r.qty <= 1} aria-label={isEs ? 'Quitar una' : 'Decrease'}>−</button>
                    <span>{r.qty}</span>
                    <button onClick={() => updateRow(i, { qty: Math.min(MAX_QTY, r.qty + 1) })} disabled={r.qty >= MAX_QTY} aria-label={isEs ? 'Añadir una' : 'Increase'}>+</button>
                  </div>
                  <span className="calc-row__price">{fmtEur(priceOf(r.tier, r.size) * r.qty, lang)}</span>
                  <button type="button" className="calc-row__remove" onClick={() => removeRow(i)} aria-label={isEs ? 'Quitar' : 'Remove'}>×</button>
                </div>
              ))}

              {decafBags.map(b => (
                <div className="calc-row calc-row--decaf" key={`decaf-${b.size}`}>
                  <span className="calc-row__label">{isEs ? 'Descafeinado' : 'Decaf'}</span>
                  <span className="calc-row__label">{b.size}</span>
                  <span className="calc-row__label">× {b.qty}</span>
                  <span className="calc-row__price">{fmtEur(priceOf('decaf', b.size) * b.qty, lang)}</span>
                  <span />
                </div>
              ))}

              <button type="button" className="calc-plan__add" onClick={addRow}>+ {isEs ? 'Añadir bolsas' : 'Add bags'}</button>

              <div className={`calc-match calc-match--${match}`}>
                {fmtKg(selectedGrams, lang)} {isEs ? 'seleccionado' : 'selected'}
                {' · '}
                {match === 'ok'
                  ? (isEs ? 'justo lo que necesitáis' : 'just what you need')
                  : match === 'short'
                    ? (isEs ? `faltan ${fmtKg(-diff, lang)}` : `${fmtKg(-diff, lang)} short`)
                    : (isEs ? `${fmtKg(diff, lang)} de más` : `${fmtKg(diff, lang)} extra`)}
              </div>
            </div>

            <dl className="calc-total">
              <dt>{isEs ? 'Envío' : 'Shipping'}</dt>
              <dd>{shipping ? `${fmtEur(shipping, lang)} ${isEs ? '/ mes' : '/ mo.'}` : (isEs ? 'Gratis' : 'Free')}</dd>
              <dt className="calc-total__sum">{isEs ? 'Total al mes' : 'Monthly total'}</dt>
              <dd className="calc-total__sum">{fmtEur(monthly + shipping, lang)}</dd>
            </dl>

            {conflict ? (
              <div className="buy-conflict" role="status">
                <p>{isEs
                  ? 'Tu carrito tiene compras sueltas. Las suscripciones se pagan por separado.'
                  : 'Your cart has one-off items. Subscriptions check out separately.'}</p>
                <button className="btn btn--full btn--yellow" onClick={() => subscribe(true)}>{isEs ? 'Vaciar carrito y suscribirme' : 'Empty cart & subscribe'}</button>
                <button className="btn btn--full btn--ghost" onClick={cart.open}>{isEs ? 'Ver carrito' : 'View cart'}</button>
              </div>
            ) : (
              <div className="calc-cta">
                <button type="button" className="btn btn--yellow btn--lg btn--full" onClick={() => subscribe(false)}
                  disabled={!CART_ENABLED || (!rows.length && !decafBags.length)}>
                  {isEs ? 'Suscribirme' : 'Subscribe'} · {fmtEur(monthly + shipping, lang)}{isEs ? '/mes' : '/mo'}
                </button>
                <p className="calc-hint" style={{ textAlign: 'center' }}>
                  {isEs ? 'Sin compromiso. Cancela cuando quieras.' : 'No commitment. Cancel any time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

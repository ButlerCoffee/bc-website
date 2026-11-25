import { useEffect, useRef, useState } from 'react'
import { useLang } from '../context/LangContext'
import { useSettings } from '../data/settingsApi'
import { useMachines } from '../data/machinesApi'
import '../pages/Contact.css'
import './QuoteModal.css'

/**
 * "Request a quote" pop-up for machines. A normal contact form plus the
 * machine (pre-filled) and how many coffee drinkers. Submits to the same
 * Netlify "contact" form (see index.html) so it lands in the same inbox.
 */
export default function QuoteModal({ open, onClose, machineName }) {
  const { lang } = useLang()
  const isEs = lang === 'es'
  const { contactEmail } = useSettings()
  const { machines } = useMachines()
  const machineOptions = [...new Set(machines.map(m => `${m.brandName} ${m.name}`.trim()))]
  const empty = { name: '', email: '', company: '', machine: machineName || '', drinkers: '', decaf: '', message: '' }
  const [form, setForm] = useState(empty)
  const [botField, setBotField] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Reset with the right machine each time it opens
  useEffect(() => {
    if (!open) return
    setForm(f => ({ ...f, machine: machineName || '' }))
    setSent(false); setError('')
  }, [open, machineName])

  // Esc closes, lock page scroll, focus first field
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') closeRef.current() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setTimeout(() => panelRef.current?.querySelector('input')?.focus(), 50)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const n = Number(form.drinkers)
    if (!Number.isInteger(n) || n < 1 || n > 10000) {
      setError(isEs ? 'Indica cuántas personas toman café (un número).' : 'Please enter the number of coffee drinkers (a number).')
      return
    }
    if (!form.decaf) {
      setError(isEs ? 'Indica si quieres opción de descafeinado.' : 'Please say whether you want a decaf option.')
      return
    }
    setSending(true); setError('')
    try {
      const body = new URLSearchParams({
        'form-name': 'contact',
        'bot-field': botField,
        ...form,
        drinkers: String(n),
        subject: `Machine quote: ${form.machine}`,
        language: lang,
      }).toString()
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
      if (!res.ok) throw new Error(String(res.status))
      setSent(true)
      setForm({ ...empty, machine: machineName || '' })
    } catch {
      setError(isEs
        ? `No se pudo enviar. Inténtalo de nuevo o escríbenos a ${contactEmail}.`
        : `Couldn't send. Please try again or email us at ${contactEmail}.`)
    } finally { setSending(false) }
  }

  return (
    <div className="qm" role="dialog" aria-modal="true" aria-labelledby="qm-title">
      <div className="qm__scrim" onClick={onClose} />
      <div className="qm__panel" ref={panelRef}>
        <button className="qm__close" onClick={onClose} aria-label={isEs ? 'Cerrar' : 'Close'}>×</button>
        <h2 id="qm-title" className="qm__title">{isEs ? 'Pedir presupuesto' : 'Request a quote'}</h2>

        {sent ? (
          <div className="contact-success">
            <div className="contact-success__icon">✅</div>
            <h2>{isEs ? '¡Solicitud enviada!' : 'Request sent!'}</h2>
            <p>{isEs ? 'Te respondemos en menos de 1 día laborable.' : "We'll be back in touch within 1 business day."}</p>
            <button className="btn btn--ghost btn--sm" onClick={onClose}>{isEs ? 'Cerrar' : 'Close'}</button>
          </div>
        ) : (
          <form className="contact-form" name="contact" onSubmit={submit} noValidate>
            <p hidden>
              <label>Leave this empty: <input name="bot-field" value={botField} onChange={e => setBotField(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
            </p>
            <div className="contact-form__row">
              <div className="form-group">
                <label htmlFor="qm-name">{isEs ? 'Nombre' : 'Name'}</label>
                <input id="qm-name" name="name" required value={form.name} onChange={set} placeholder={isEs ? 'Tu nombre' : 'Your name'} />
              </div>
              <div className="form-group">
                <label htmlFor="qm-email">Email</label>
                <input id="qm-email" name="email" type="email" required value={form.email} onChange={set} placeholder="you@company.com" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="qm-company">{isEs ? 'Empresa (opcional)' : 'Company (optional)'}</label>
              <input id="qm-company" name="company" value={form.company} onChange={set} placeholder={isEs ? 'Tu empresa' : 'Your company'} />
            </div>
            <div className="contact-form__row">
              <div className="form-group">
                <label htmlFor="qm-machine">{isEs ? 'Máquina' : 'Machine'}</label>
                <select id="qm-machine" name="machine" required value={form.machine} onChange={set}>
                  {!machineOptions.includes(form.machine) && form.machine && <option value={form.machine}>{form.machine}</option>}
                  {machineOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="Not sure / need advice">{isEs ? 'No lo sé / necesito consejo' : 'Not sure / need advice'}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="qm-drinkers">{isEs ? 'Nº de personas que toman café' : '# of coffee drinkers'}</label>
                <input id="qm-drinkers" name="drinkers" type="number" inputMode="numeric" min="1" max="10000" step="1" required
                  value={form.drinkers} onChange={set} placeholder={isEs ? 'p. ej. 25' : 'e.g. 25'} />
              </div>
            </div>
            <fieldset className="form-group qm__yn">
              <legend>{isEs ? '¿Opción de descafeinado?' : 'Decaf option?'}</legend>
              <div className="qm__yn-opts">
                {[{ v: 'Yes', en: 'Yes', es: 'Sí' }, { v: 'No', en: 'No', es: 'No' }].map(o => (
                  <label key={o.v} className={`qm__yn-opt ${form.decaf === o.v ? 'on' : ''}`}>
                    <input type="radio" name="decaf" value={o.v} checked={form.decaf === o.v} onChange={set} required />
                    {o[lang] || o.en}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="form-group">
              <label htmlFor="qm-message">{isEs ? 'Mensaje (opcional)' : 'Message (optional)'}</label>
              <textarea id="qm-message" name="message" value={form.message} onChange={set}
                placeholder={isEs ? 'Cuéntanos sobre tu espacio o lo que necesitas…' : 'Tell us about your space or what you need…'} />
            </div>
            {error && <p className="contact-form__error" role="alert">{error}</p>}
            <button type="submit" className="btn btn--yellow btn--full btn--lg"
              disabled={sending || !form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) || !form.machine}>
              {sending ? (isEs ? 'Enviando…' : 'Sending…') : (isEs ? 'Enviar solicitud' : 'Send request')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

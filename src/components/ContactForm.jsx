import { useState } from 'react'
import { useLang } from '../context/LangContext'
import '../pages/Contact.css'

export default function ContactForm() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const [botField, setBotField] = useState('')

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  // Submits to Netlify Forms (see the hidden "contact" form in index.html).
  const handleSubmit = async e => {
    e.preventDefault()
    setSending(true)
    setError(false)
    try {
      const body = new URLSearchParams({
        'form-name': 'contact',
        'bot-field': botField,
        ...form,
        language: lang,
      }).toString()
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      if (!res.ok) throw new Error(`Form submit failed (${res.status})`)
      setSent(true)
      setForm({ name: '', email: '', company: '', message: '' })
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setSending(false)
    }
  }


  if (sent) {
    return (
      <div className="contact-success">
        <div className="contact-success__icon">✅</div>
        <h2>{isEs ? '¡Mensaje enviado!' : 'Message sent!'}</h2>
        <p>{isEs ? 'Te respondemos en menos de 1 día laborable.' : "We'll be back in touch within 1 business day."}</p>
        <button className="btn btn--ghost btn--sm" onClick={() => setSent(false)}>
          {isEs ? 'Enviar otro mensaje' : 'Send another message'}
        </button>
      </div>
    )
  }

  return (
    <form className="contact-form" name="contact" onSubmit={handleSubmit}>
      {/* Honeypot: hidden from people, bots tend to fill it in */}
      <p hidden>
        <label>Leave this empty: <input name="bot-field" value={botField} onChange={e => setBotField(e.target.value)} tabIndex={-1} autoComplete="off" /></label>
      </p>
      <div className="contact-form__row">
        <div className="form-group">
          <label htmlFor="cf-name">{isEs ? 'Nombre' : 'Name'}</label>
          <input
            id="cf-name" name="name" type="text" required
            placeholder={isEs ? 'Tu nombre' : 'Your name'}
            value={form.name} onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cf-email">Email</label>
          <input
            id="cf-email" name="email" type="email" required
            placeholder="you@company.com"
            value={form.email} onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="cf-company">{isEs ? 'Empresa (opcional)' : 'Company (optional)'}</label>
        <input
          id="cf-company" name="company" type="text"
          placeholder={isEs ? 'Tu empresa' : 'Your company'}
          value={form.company} onChange={handleChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="cf-message">{isEs ? 'Mensaje' : 'Message'}</label>
        <textarea
          id="cf-message" name="message" required
          placeholder={isEs
            ? 'Cuéntanos un poco sobre tu espacio, equipo o necesidades de café...'
            : 'Tell us about your workspace, team, or coffee needs...'}
          value={form.message} onChange={handleChange}
        />
      </div>
      {error && (
        <p className="contact-form__error" role="alert">
          {isEs
            ? <>No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos a <a href="mailto:hola@butler.coffee">hola@butler.coffee</a>.</>
            : <>Your message couldn't be sent. Please try again or email us at <a href="mailto:hola@butler.coffee">hola@butler.coffee</a>.</>}
        </p>
      )}
      <button type="submit" className="btn btn--yellow btn--full btn--lg" disabled={sending}>
        {sending
          ? (isEs ? 'Enviando…' : 'Sending…')
          : (isEs ? 'Enviar mensaje' : 'Send message')}
      </button>
      <p className="contact-form__note">
        {isEs
          ? 'Respondemos en menos de 1 día laborable. Sin spam.'
          : "We reply within 1 business day. No spam, ever."}
      </p>
    </form>
  )
}

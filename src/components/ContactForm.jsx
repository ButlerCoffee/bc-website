import { useState } from 'react'
import { useLang } from '../context/LangContext'

export default function ContactForm() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  const [form, setForm] = useState({ name: '', email: '', company: '', topic: 'subscription', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    // TODO: wire to EmailJS / Formspree / backend
    setSent(true)
  }

  const topics = isEs ? [
    { value: 'subscription', label: 'Suscripción de café' },
    { value: 'machine',      label: 'Máquinas de café' },
    { value: 'bundle',       label: 'Pack máquina + suscripción' },
    { value: 'other',        label: 'Otro' },
  ] : [
    { value: 'subscription', label: 'Coffee subscription' },
    { value: 'machine',      label: 'Coffee machines' },
    { value: 'bundle',       label: 'Machine + subscription bundle' },
    { value: 'other',        label: 'Something else' },
  ]

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
    <form className="contact-form" onSubmit={handleSubmit}>
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
        <label htmlFor="cf-topic">{isEs ? '¿Sobre qué?' : "What's this about?"}</label>
        <select id="cf-topic" name="topic" value={form.topic} onChange={handleChange}>
          {topics.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
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
      <button type="submit" className="btn btn--yellow btn--full btn--lg">
        {isEs ? 'Enviar mensaje' : 'Send message'}
      </button>
      <p className="contact-form__note">
        {isEs
          ? 'Respondemos en menos de 1 día laborable. Sin spam.'
          : "We reply within 1 business day. No spam, ever."}
      </p>
    </form>
  )
}

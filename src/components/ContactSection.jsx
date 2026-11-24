import { useLang } from '../context/LangContext'
import ContactForm from './ContactForm'
import './ContactSection.css'

/** "Let's talk coffee" block with the contact form — used on Home and About. */
export default function ContactSection() {
  const { lang } = useLang()
  const isEs = lang === 'es'

  return (
    <section className="section contact-section" id="contact">
      <div className="wrap contact-section__inner">
        <div className="sh">
          <span className="badge">{isEs ? 'Escríbenos' : 'Get in touch'}</span>
          <h2 className="section-title">
            {isEs ? <>¿Hablamos del <em>café?</em></> : <>Let's talk <em>coffee.</em></>}
          </h2>
          <p className="section-sub">
            {isEs
              ? 'Cuéntanos sobre tu equipo y te ayudamos a encontrar el nivel perfecto.'
              : "Tell us about your team and we'll help you find the right fit."}
          </p>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}

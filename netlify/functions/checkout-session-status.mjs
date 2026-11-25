import { stripe, json, handler, HttpError } from '../lib/checkout.mjs'

// GET ?session_id=cs_... → { status, paymentStatus, email, mode }
// Only returns what the thank-you page needs.
export default handler('GET', async (req) => {
  const id = new URL(req.url).searchParams.get('session_id') || ''
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) throw new HttpError(400, 'bad_session_id')
  const s = await stripe().checkout.sessions.retrieve(id)
  return json(200, {
    status: s.status,
    paymentStatus: s.payment_status,
    email: s.customer_details?.email || null,
    mode: s.mode,
  })
})

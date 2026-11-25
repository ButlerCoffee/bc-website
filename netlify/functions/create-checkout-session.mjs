import { stripe, json, handler, allowedOrigin, parseCart, buildSessionParams, HttpError } from '../lib/checkout.mjs'

// POST { lang, items: [{ type, tierId, size, grind, qty }] } → { clientSecret }
export default handler('POST', async (req) => {
  const origin = allowedOrigin(req)
  const body = await req.json().catch(() => { throw new HttpError(400, 'bad_json') })
  const cart = parseCart(body)
  const params = await buildSessionParams(cart, origin)
  const session = await stripe().checkout.sessions.create(params)
  return json(200, { clientSecret: session.client_secret })
})

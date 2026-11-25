#!/usr/bin/env node
/**
 * Creates the products and prices the website checkout looks up, in a Stripe
 * TEST account / sandbox. Safe to re-run: existing lookup keys are skipped.
 *
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
 *
 * Live mode is refused on purpose. Going live means attaching these same
 * lookup keys to the existing live prices (done once, with Dave's OK).
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY || ''
if (!/^(sk|rk)_test_/.test(key)) {
  console.error('Refusing to run: STRIPE_SECRET_KEY must be a test key (sk_test_ or rk_test_).')
  process.exit(1)
}
const stripe = new Stripe(key)

// Euros, VAT included — mirrors the website / live Stripe prices.
const CATALOG = {
  base:     { name: 'Base Coffee',     sizes: { '250g': 13, '500g': 24, '1kg': 40 } },
  explorer: { name: 'Explorer Coffee', sizes: { '250g': 15, '500g': 26, '1kg': 50 } },
  alpine:   { name: 'Alpine Coffee',   sizes: { '250g': 18, '500g': 34, '1kg': 65 } },
  summit:   { name: 'Summit Coffee',   sizes: { '200g': 30 } },
}

async function existing(lookupKey) {
  const res = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
  return res.data[0]
}

async function ensurePrice({ lookupKey, productName, amount, recurring, metadata }) {
  const found = await existing(lookupKey)
  if (found) { console.log(`  = ${lookupKey} (${found.id})`); return }
  const product = await stripe.products.create({ name: productName, metadata })
  const price = await stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: Math.round(amount * 100),
    tax_behavior: 'inclusive',
    lookup_key: lookupKey,
    ...(recurring ? { recurring: { interval: 'month' } } : {}),
    metadata,
  })
  console.log(`  + ${lookupKey} → ${price.id}`)
}

for (const [tier, { name, sizes }] of Object.entries(CATALOG)) {
  console.log(name)
  for (const [size, eur] of Object.entries(sizes)) {
    await ensurePrice({
      lookupKey: `bc_${tier}_${size}_once`, productName: `${name} | ${size}`,
      amount: eur, recurring: false, metadata: { tier, size, type: 'one_off' },
    })
    await ensurePrice({
      lookupKey: `bc_${tier}_${size}_sub`, productName: `${name} Monthly Subscription | ${size}`,
      amount: eur, recurring: true, metadata: { tier, size, type: 'subscription' },
    })
  }
}
console.log('Shipping')
await ensurePrice({
  lookupKey: 'bc_shipping_monthly', productName: 'Shipping (monthly subscription)',
  amount: 5, recurring: true, metadata: { type: 'shipping' },
})
console.log('Done.')

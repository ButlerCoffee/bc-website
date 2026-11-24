/**
 * format.js — locale-aware number formatting.
 *
 * EN: €1,299   ·   ES: 1.299 €
 */
export function fmtEur(n, lang = 'en') {
  const num = Number(n) || 0
  const decimals = Number.isInteger(num) ? 0 : 2
  const s = num.toLocaleString(lang === 'es' ? 'es-ES' : 'en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: 'always',
  })
  return lang === 'es' ? `${s} €` : `€${s}`
}

import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'

/**
 * "Add to cart" for any item. If the cart already holds the other order type
 * (subscriptions vs one-off), explain that they check out separately and offer to
 * view the cart or empty it and add this instead.
 *
 * item: { type: 'once', tierId+size | productId, grind, qty }
 */
export default function AddToCart({ item, disabled, label, className = 'btn btn--full btn--yellow', onAdded }) {
  const { lang } = useLang()
  const cart = useCart()
  const [conflict, setConflict] = useState(false)
  const isEs = lang === 'es'

  function add(replace = false) {
    const ok = cart.add(item, { replace })
    if (ok) { setConflict(false); onAdded?.() }
    else setConflict(true)
  }

  if (conflict && cart.cartType && cart.cartType !== item.type) {
    return (
      <div className="buy-conflict" role="status">
        <p>
          {item.type === 'sub'
            ? (isEs
              ? 'Tu carrito tiene compras sueltas. Las suscripciones se pagan por separado: finaliza ese pedido primero o vacía el carrito.'
              : 'Your cart has one-off items. Subscriptions check out separately: finish that order first, or empty the cart.')
            : (isEs
              ? 'Tu carrito tiene suscripciones. Las compras sueltas se pagan por separado: finaliza ese pedido primero o vacía el carrito.'
              : 'Your cart has subscriptions. One-off purchases check out separately: finish that order first, or empty the cart.')}
        </p>
        <button className="btn btn--full btn--yellow" onClick={cart.open}>{isEs ? 'Ver carrito' : 'View cart'}</button>
        <button className="btn btn--full btn--ghost" onClick={() => add(true)}>
          {isEs ? 'Vaciar carrito y añadir' : 'Empty cart & add this'}
        </button>
      </div>
    )
  }

  return (
    <button className={className} onClick={() => add(false)} disabled={disabled}>
      {label || (isEs ? 'Añadir al carrito' : 'Add to cart')}
    </button>
  )
}

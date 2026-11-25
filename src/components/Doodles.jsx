/**
 * Light outline drawings for the homepage callouts.
 * Thin white strokes, with one yellow touch (a pod, a bag label).
 */

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
const accent = { fill: 'rgba(255, 229, 0, 0.14)', stroke: 'var(--yellow)', strokeWidth: 1.6, strokeLinejoin: 'round' }

/** One capsule, lid on top, standing in a 36×34 box. */
function Pod({ x, y, rotate = 0, yellow = false }) {
  const s = yellow ? accent : line
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} 18 17)`}>
      <rect x="0" y="0" width="36" height="5" rx="2.5" style={s} />
      <path d="M4 5 L9 27 Q18 33 27 27 L32 5" style={s} />
      <path d="M7 14 L29 14" style={{ ...line, stroke: yellow ? 'var(--yellow)' : 'currentColor', opacity: 0.5 }} />
    </g>
  )
}

export function PodsDoodle({ className }) {
  return (
    <svg className={className} viewBox="0 0 132 56" width="132" height="56" aria-hidden="true">
      <Pod x={4} y={18} rotate={-14} />
      <Pod x={48} y={8} yellow />
      <Pod x={92} y={18} rotate={12} />
      <path d="M2 54 H130" style={{ ...line, opacity: 0.35 }} />
    </svg>
  )
}

export function BagDoodle({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 84" width="56" height="74" aria-hidden="true">
      {/* crimped top seal */}
      <path d="M12 4 H52 V12 H12 Z" style={line} />
      <path d="M16 4 V12 M22 4 V12 M28 4 V12 M34 4 V12 M40 4 V12 M46 4 V12" style={{ ...line, opacity: 0.45 }} />
      {/* bag body, slightly wider at the base */}
      <path d="M12 12 L8 76 Q8 80 12 80 H52 Q56 80 56 76 L52 12" style={line} />
      {/* side gussets */}
      <path d="M17 12 L15 80 M47 12 L49 80" style={{ ...line, opacity: 0.3 }} />
      {/* degassing valve */}
      <circle cx="32" cy="24" r="3.5" style={line} />
      {/* label */}
      <rect x="19" y="38" width="26" height="24" rx="3" style={accent} />
      <path d="M24 46 H40 M24 52 H36" style={{ ...line, stroke: 'var(--yellow)', opacity: 0.7 }} />
    </svg>
  )
}

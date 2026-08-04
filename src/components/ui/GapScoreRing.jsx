// The signature visual motif of NDISP: every facility, department and
// recommendation is scored 0–1 by the Deficit Detection Engine (LLD Vol 3
// §17.1). Rather than a generic progress bar, this ring is used consistently
// everywhere a gap/coverage score appears so the number always reads the same
// way — low ring fill + red = underserved, high ring fill + green = well-served.
import clsx from 'clsx'

function colorFor(score) {
  if (score >= 0.66) return '#c0392b' // high deficit
  if (score >= 0.33) return '#e07a2c'
  return '#1f7a54' // low deficit, well served
}

export default function GapScoreRing({ score, size = 44, strokeWidth = 4.5, label, className }) {
  const clamped = Math.max(0, Math.min(1, score ?? 0))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped)
  const color = colorFor(clamped)

  return (
    <div className={clsx('inline-flex items-center gap-2.5', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e4e7ec" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-mono text-[11px] font-semibold" style={{ color }}>{clamped.toFixed(2)}</span>
        </div>
      </div>
      {label && (
        <div className="leading-tight">
          <div className="text-[12.5px] font-medium text-ink-800">{label}</div>
          <div className="text-[11px] text-ink-400">gap score</div>
        </div>
      )}
    </div>
  )
}

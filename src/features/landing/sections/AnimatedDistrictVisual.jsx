import { useEffect, useRef, useState } from 'react'
import { Building2, Cross, Droplets, GraduationCap } from 'lucide-react'
import Button from '../../../components/ui/Button'

const BOUNDARY = 'M46 62 C 74 34, 128 26, 168 38 C 214 52, 244 74, 238 116 C 232 158, 196 190, 148 194 C 98 198, 52 178, 40 136 C 32 104, 24 84, 46 62 Z'

// Illustrative service points — generic labels only, never invented
// statistics. Each marker carries the query the real spatial-query engine
// will run when the citizen taps "Explore".
const MARKERS = [
  { x: 118, y: 86, icon: Cross, label: 'Nearby Hospital', category: 'Health', query: 'Nearest hospital', color: '#1f7a54', float: 'ndisp-float', card: 0 },
  { x: 168, y: 132, icon: GraduationCap, label: 'Public School', category: 'Education', query: 'Nearest school', color: '#1d7ab5', float: 'ndisp-float-slow', card: null },
  { x: 90, y: 156, icon: Droplets, label: 'Water Facility', category: 'Water', query: 'Water tank', color: '#0e7490', float: 'ndisp-float-slow', card: 1 },
  { x: 200, y: 96, icon: Building2, label: 'Public Facility', category: 'Public Facilities', query: 'Public facilities', color: '#e07a2c', float: 'ndisp-float', card: null },
]

const LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3]]

const FLOAT_CARDS = [
  { marker: 0, className: 'left-2 top-8', title: 'Nearby Hospital', sub: 'Find it in search' },
  { marker: 2, className: 'bottom-6 right-2', title: 'Water Facility', sub: 'Public service' },
]

// Lightweight animated district visual — a pure inline-SVG illustration with
// subtle float, connection lines, marker pulses and gentle survey dots. It
// deliberately does NOT load Leaflet or the facilities collection; the real
// map lives behind the "Explore Map" action on /citizen/map. Markers are real
// buttons: hover, keyboard focus or tap reveals a tooltip whose "Explore"
// action runs the same public spatial-query the hero search uses.
// All motion stops under prefers-reduced-motion.
export default function AnimatedDistrictVisual({ interactive = true, onExplore = null }) {
  const wrapperRef = useRef(null)
  const [active, setActive] = useState(null)
  const [motionOk] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced || typeof IntersectionObserver === 'undefined') return
    const node = wrapperRef.current
    if (!node) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        if (rect.bottom < 0 || rect.top > window.innerHeight) return
        const depth = Math.max(-16, Math.min(16, (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.015))
        node.style.transform = `translateY(${depth.toFixed(1)}px)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const activeMarker = active != null ? MARKERS[active] : null

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-[420px] will-change-transform lg:max-w-[560px]">
      <div className="relative rounded-2xl bg-gradient-to-br from-ink-50 via-white to-saffron-50/60 p-4 shadow-popover ring-1 ring-ink-100">
        <div className="relative">
          <svg viewBox="0 0 280 220" className="h-auto w-full" aria-hidden="true">
            <defs>
              <radialGradient id="ndisp-land-glow" cx="50%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#1d7ab5" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#1d7ab5" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="ndisp-boundary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0b3558" />
                <stop offset="100%" stopColor="#1d7ab5" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="280" height="220" rx="14" fill="#ffffff" />

            <circle cx="140" cy="104" r="92" fill="url(#ndisp-land-glow)" />

            {/* soft terrain grid */}
            <g stroke="#e4e8ed" strokeWidth="0.7">
              {[40, 80, 120, 160, 200].map((y) => <line key={`h${y}`} x1="16" y1={y} x2="264" y2={y} />)}
              {[40, 80, 120, 160, 200, 240].map((x) => <line key={`v${x}`} x1={x} y1="14" x2={x} y2="206" />)}
            </g>

            {/* district boundary with flowing dashes */}
            <path
              d={BOUNDARY}
              fill="#f4f6f8"
              stroke="url(#ndisp-boundary)"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path
              className="ndisp-dash"
              d={BOUNDARY}
              fill="none"
              stroke="#1d7ab5"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />

            {/* survey dots travelling along the boundary (SMIL, gated by JS) */}
            {motionOk && (
              <g opacity="0.75">
                <circle r="2.6" fill="#e07a2c"><animateMotion dur="16s" repeatCount="indefinite" path={BOUNDARY} /></circle>
                <circle r="2.2" fill="#1d7ab5"><animateMotion dur="22s" begin="4s" repeatCount="indefinite" path={BOUNDARY} /></circle>
              </g>
            )}

            {/* connection lines between service points */}
            <g stroke="#7488a0" strokeWidth="1.1" strokeLinecap="round" opacity="0.45">
              {LINKS.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={MARKERS[a].x} y1={MARKERS[a].y} x2={MARKERS[b].x} y2={MARKERS[b].y} strokeDasharray="3 5" />
              ))}
            </g>

            {/* service markers with pulses — focusable, interactive */}
            {MARKERS.map((marker, index) => {
              const MarkerIcon = marker.icon
              return (
                <g
                  key={marker.label}
                  className={`${marker.float} ${interactive ? 'ndisp-marker' : ''}`}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  aria-label={interactive ? `${marker.label} — ${marker.category}. Press Enter for details.` : undefined}
                  onFocus={interactive ? () => setActive(index) : undefined}
                  onBlur={interactive ? (event) => { if (!event.currentTarget.contains(event.relatedTarget)) setActive((current) => (current === index ? null : current)) } : undefined}
                  onClick={interactive ? () => setActive((current) => (current === index ? null : index)) : undefined}
                  onKeyDown={interactive ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActive((current) => (current === index ? null : index)) } if (event.key === 'Escape') setActive(null) } : undefined}
                >
                  <circle className="ndisp-marker-ring ndisp-pulse-ring" cx={marker.x} cy={marker.y} r="7" fill="none" stroke={marker.color} strokeWidth="1.6" />
                  <circle className="ndisp-marker-dot" cx={marker.x} cy={marker.y} r="7" fill="#ffffff" stroke={marker.color} strokeWidth="1.6" />
                  <MarkerIcon x={marker.x - 4.5} y={marker.y - 4.5} width="9" height="9" color={marker.color} strokeWidth="2.2" />
                  <text x={marker.x + 11} y={marker.y + 3.5} fontSize="8.5" fontWeight="600" fill="#546882">{marker.label}</text>
                  {index === 0 && <circle cx={marker.x} cy={marker.y} r="3.2" fill={marker.color} />}
                </g>
              )
            })}
          </svg>

          {/* Marker tooltip — service name, category and a real search action */}
          {interactive && activeMarker && (
            <div
              className="ndisp-pop absolute z-20 w-[172px] rounded-xl border border-ink-100 bg-white p-3 shadow-popover"
              style={{
                left: `${Math.min(88, Math.max(8, (activeMarker.x / 280) * 100))}%`,
                top: `${(activeMarker.y / 220) * 100}%`,
              }}
              onMouseLeave={() => setActive(null)}
            >
              <p className="text-[12.5px] font-bold leading-tight text-ink-950">{activeMarker.label}</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-saffron-700">{activeMarker.category}</p>
              <Button size="sm" variant="primary" className="mt-2 w-full" onClick={() => onExplore?.(activeMarker)}>
                Explore
              </Button>
            </div>
          )}

          {/* floating service cards — generic labels, never fake statistics */}
          {FLOAT_CARDS.map((card) => {
            const marker = MARKERS[card.marker]
            return (
              <div key={card.title} className={`${marker.float} ${card.className} absolute hidden rounded-xl border border-ink-100 bg-white/95 px-3 py-2 shadow-popover sm:block ${active === card.marker ? 'ring-2 ring-saffron-400' : ''}`}>
                <p className="text-[11px] font-bold text-ink-900">{card.title}</p>
                <p className="text-[10px] text-ink-500">{card.sub}</p>
              </div>
            )
          })}
        </div>

        <span className="absolute left-3 top-3 rounded-md bg-ink-900/90 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">District View</span>
      </div>
    </div>
  )
}

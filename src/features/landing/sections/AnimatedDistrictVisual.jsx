import { useEffect, useRef } from 'react'
import { Building2, Cross, Droplets, GraduationCap } from 'lucide-react'

const MARKERS = [
  { x: 118, y: 86, icon: Building2, label: 'Health Centre', color: '#1f7a54', float: 'ndisp-float' },
  { x: 168, y: 132, icon: GraduationCap, label: 'School', color: '#1d7ab5', float: 'ndisp-float-slow' },
  { x: 90, y: 156, icon: Droplets, label: 'Water Tank', color: '#0e7490', float: 'ndisp-float-slow' },
  { x: 200, y: 96, icon: Cross, label: 'Public Facility', color: '#e07a2c', float: 'ndisp-float' },
]

const LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3]]

// Lightweight animated district visual — a pure inline-SVG illustration with
// subtle float, connection lines and marker pulses. It deliberately does NOT
// load Leaflet or the facilities collection; the real map lives behind the
// "Explore Map" action on /citizen/map. All motion stops under
// prefers-reduced-motion (landing.css + media query guard).
export default function AnimatedDistrictVisual() {
  const wrapperRef = useRef(null)

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

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-[560px] will-change-transform" aria-hidden="true">
      <div className="relative rounded-2xl bg-gradient-to-br from-ink-50 via-white to-saffron-50/60 p-4 shadow-popover ring-1 ring-ink-100">
        <svg viewBox="0 0 280 220" className="h-auto w-full">
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
            d="M46 62 C 74 34, 128 26, 168 38 C 214 52, 244 74, 238 116 C 232 158, 196 190, 148 194 C 98 198, 52 178, 40 136 C 32 104, 24 84, 46 62 Z"
            fill="#f4f6f8"
            stroke="url(#ndisp-boundary)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            className="ndisp-dash"
            d="M46 62 C 74 34, 128 26, 168 38 C 214 52, 244 74, 238 116 C 232 158, 196 190, 148 194 C 98 198, 52 178, 40 136 C 32 104, 24 84, 46 62 Z"
            fill="none"
            stroke="#1d7ab5"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          {/* connection lines between service points */}
          <g stroke="#7488a0" strokeWidth="1.1" strokeLinecap="round" opacity="0.45">
            {LINKS.map(([a, b]) => (
              <line key={`${a}-${b}`} x1={MARKERS[a].x} y1={MARKERS[a].y} x2={MARKERS[b].x} y2={MARKERS[b].y} strokeDasharray="3 5" />
            ))}
          </g>

          {/* service markers with pulses */}
          {MARKERS.map((marker, index) => {
            const MarkerIcon = marker.icon
            return (
              <g key={marker.label} className={marker.float}>
                <circle className="ndisp-pulse-ring" cx={marker.x} cy={marker.y} r="7" fill="none" stroke={marker.color} strokeWidth="1.6" />
                <circle cx={marker.x} cy={marker.y} r="7" fill="#ffffff" stroke={marker.color} strokeWidth="1.6" />
                <MarkerIcon x={marker.x - 4.5} y={marker.y - 4.5} width="9" height="9" color={marker.color} strokeWidth="2.2" />
                <text x={marker.x + 11} y={marker.y + 3.5} fontSize="8.5" fontWeight="600" fill="#546882">{marker.label}</text>
                {index === 0 && <circle cx={marker.x} cy={marker.y} r="3.2" fill={marker.color} />}
              </g>
            )
          })}
        </svg>

        {/* floating service cards */}
        <div className="ndisp-float absolute left-2 top-8 hidden rounded-xl border border-ink-100 bg-white/95 px-3 py-2 shadow-popover sm:block">
          <p className="text-[11px] font-bold text-ink-900">Hospital · 1.2 km</p>
          <p className="text-[10px] text-ink-500">Open now</p>
        </div>
        <div className="ndisp-float-slow absolute bottom-6 right-2 hidden rounded-xl border border-ink-100 bg-white/95 px-3 py-2 shadow-popover sm:block">
          <p className="text-[11px] font-bold text-ink-900">Water Supply · Scheduled</p>
          <p className="text-[10px] text-ink-500">2 km from you</p>
        </div>

        <span className="absolute left-3 top-3 rounded-md bg-ink-900/90 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white">District View</span>
      </div>
    </div>
  )
}
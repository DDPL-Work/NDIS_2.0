import { useState } from 'react'
import { Building2, Compass, FileText, HandCoins, Landmark, MapPinned, User } from 'lucide-react'

// "One Platform" — a lightweight connected-node visual. A citizen at the
// centre, six service areas on spokes with slowly flowing connections and
// pulsing nodes. Pure HTML + SVG, no animation library; everything stops
// under prefers-reduced-motion.
const NODES = [
  { id: 'services', icon: Compass, label: 'Services', x: 84.6, y: 33 },
  { id: 'district', icon: Landmark, label: 'District Info', x: 84.6, y: 67 },
  { id: 'facilities', icon: Building2, label: 'Public Facilities', x: 50, y: 84 },
  { id: 'complaints', icon: FileText, label: 'Complaints', x: 15.4, y: 67 },
  { id: 'maps', icon: MapPinned, label: 'Maps', x: 15.4, y: 33 },
  { id: 'schemes', icon: HandCoins, label: 'Schemes', x: 50, y: 16 },
]

export default function OnePlatformSection() {
  const [hovered, setHovered] = useState(null)
  const [motionOk] = useState(() => !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">One Platform</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">One place for the services that matter to you</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-500">Citizen services, district information, public facilities, complaints, maps and schemes — together.</p>
        </div>

        <div className="ndisp-scroll-reveal stagger-1 relative mx-auto mt-12 h-[340px] max-w-2xl sm:h-[380px]" onMouseLeave={() => setHovered(null)}>
          {/* connection lines */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <g strokeLinecap="round">
              {NODES.map((node) => (
                <g key={node.id}>
                  <line x1="50" y1="50" x2={node.x} y2={node.y} stroke={hovered === node.id ? '#e07a2c' : '#c3ccd6'} strokeWidth={hovered === node.id ? 0.9 : 0.55} opacity={hovered === node.id ? 1 : 0.8} />
                  <line className="ndisp-dash" x1="50" y1="50" x2={node.x} y2={node.y} stroke={hovered === node.id ? '#e07a2c' : '#1d7ab5'} strokeWidth={hovered === node.id ? 0.7 : 0.45} />
                </g>
              ))}
            </g>
          </svg>

          {/* centre node */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-ink-950 text-saffron-400 shadow-popover">
              {motionOk && <span className="ndisp-node-pulse absolute inset-0 rounded-full border-2 border-saffron-400" aria-hidden="true" />}
              <User size={26} />
              <span className="sr-only">Citizen</span>
            </div>
            <p className="mt-2 text-center font-display text-[12px] font-bold tracking-widest text-ink-900">CITIZEN</p>
          </div>

          {/* service nodes */}
          {NODES.map((node) => {
            const Icon = node.icon
            return (
              <div
                key={node.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseEnter={() => setHovered(node.id)}
                onFocus={() => setHovered(node.id)}
                onBlur={() => setHovered(null)}
              >
                <div className={`relative grid h-14 w-14 place-items-center rounded-full border bg-white shadow-card transition-all duration-200 ${hovered === node.id ? 'scale-110 border-saffron-300 text-saffron-600' : 'border-ink-100 text-ink-600'}`}>
                  {motionOk && hovered === node.id && <span className="ndisp-node-pulse absolute inset-0 rounded-full border-2 border-saffron-400" aria-hidden="true" />}
                  <Icon size={22} />
                </div>
                <p className="mt-1.5 text-center text-[10.5px] font-semibold text-ink-700">{node.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

import { Eye, Globe2, HeartHandshake, MapPin, Network } from 'lucide-react'

// Trust-focused reasons, kept factual and restrained — no marketing claims.
const REASONS = [
  { icon: Globe2, title: 'One District View', text: 'Services, facilities and updates about your district in one place.' },
  { icon: Eye, title: 'Transparent Updates', text: 'See where your request stands at every step.' },
  { icon: MapPin, title: 'Location-Aware Services', text: 'Find what you need close to where you are.' },
  { icon: HeartHandshake, title: 'Citizen Participation', text: 'Report problems directly to the department responsible.' },
  { icon: Network, title: 'Connected Departments', text: 'Concerned departments work together on your request.' },
]

export default function WhyNdisSection() {
  return (
    <section id="about" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">Why NDISP</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Built Around You</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-500">NDISP connects citizens with their district administration — simply and transparently.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon
            return (
              <div key={reason.title} className={`ndisp-scroll-reveal stagger-${index % 5} rounded-xl2 border border-ink-100 bg-ink-50/60 p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-popover`}>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-saffron-600 shadow-card"><Icon size={22} /></span>
                <h3 className="mt-4 text-[14.5px] font-bold text-ink-950">{reason.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{reason.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
import { Building2, Globe2, MapPin, ShieldCheck } from 'lucide-react'

// Trust band — deliberately non-numeric. NDISP has no public statistics API,
// so fabricating counts is prohibited; these statements are accurate.
const ITEMS = [
  { icon: Globe2, title: 'District Information', text: 'One place for your district’s services, facilities and updates.' },
  { icon: Building2, title: 'Public Facilities', text: 'Hospitals, schools, water points and infrastructure, mapped.' },
  { icon: ShieldCheck, title: 'Grievance Support', text: 'A clear path from reporting a problem to its resolution.' },
  { icon: MapPin, title: 'Location-Aware', text: 'Find services near you instead of searching blindly.' },
]

export default function TrustSection() {
  return (
    <section className="border-b border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-center font-display text-[22px] font-semibold tracking-tight text-ink-950">One platform for your district</p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[13.5px] text-ink-500">Citizen services, district information, public facilities and grievance support — together.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={item.title} className={`ndisp-scroll-reveal stagger-${index} flex items-start gap-3 rounded-xl2 border border-ink-100 bg-ink-50/60 p-4`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-saffron-600 shadow-card"><Icon size={18} /></span>
                <span>
                  <span className="block text-[13.5px] font-semibold text-ink-900">{item.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">{item.text}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
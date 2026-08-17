import { Baby, Building2, GraduationCap, HeartPulse, Info, Landmark, Tractor } from 'lucide-react'

// There is no public schemes API yet (schemeApi.listSchemes is unsupported on
// the backend), so this section shows a clean static category structure. Every
// card is explicitly marked as informational — no invented schemes, no
// fabricated benefits. The sign-in path to the Schemes page in the citizen
// portal is offered once account features exist.
const CATEGORIES = [
  { icon: HeartPulse, label: 'Health', text: 'Public health facilities and schemes for wellness and care.' },
  { icon: GraduationCap, label: 'Education', text: 'Schools, scholarships and learning support for students.' },
  { icon: Tractor, label: 'Agriculture', text: 'Farm support, irrigation and crop-related assistance.' },
  { icon: Baby, label: 'Social Welfare', text: 'Support for families, elderly and people in need.' },
  { icon: Building2, label: 'Infrastructure', text: 'Roads, water supply, housing and community facilities.' },
  { icon: Landmark, label: 'Employment', text: 'Work and livelihood opportunities and skill programmes.' },
]

export default function SchemesSection() {
  return (
    <section id="schemes" className="bg-ink-50/70 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">Government Schemes &amp; Services</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Support That Reaches You</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14.5px] text-ink-500">
            An introduction to the areas where government support is available. Details of specific schemes are provided here as information only.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={category.label} className={`ndisp-scroll-reveal stagger-${index % 3} flex items-start gap-4 rounded-xl2 border border-ink-100 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-popover`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-900 text-saffron-400"><Icon size={20} /></span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold text-ink-950">{category.label}<Info size={12} className="shrink-0 text-ink-300" aria-label="Informational" /></span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-500">{category.text}</span>
                </span>
              </div>
            )
          })}
        </div>

        <div className="ndisp-scroll-reveal mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-xl2 border border-saffron-200 bg-saffron-50 p-4">
          <Info size={16} className="mt-0.5 shrink-0 text-saffron-600" />
          <p className="text-[12.5px] leading-relaxed text-saffron-900">
            Scheme details and application steps are being connected to live government data. This page is currently informational.
          </p>
        </div>
      </div>
    </section>
  )
}
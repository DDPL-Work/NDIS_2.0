import { FileSearch, MapPin, Send } from 'lucide-react'

const STEPS = [
  { number: '01', icon: MapPin, title: 'Choose a Service', text: 'Find the service or information you need.' },
  { number: '02', icon: Send, title: 'Submit or Explore', text: 'Raise a complaint, request a service or explore district information.' },
  { number: '03', icon: FileSearch, title: 'Track Progress', text: 'Stay informed about your request and its resolution.' },
]

export default function HowItWorksSection() {
  return (
    <section className="bg-ink-50/70 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="ndisp-scroll-reveal text-center">
          <p className="eyebrow">Simple by design</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">Getting Help Is Simple</h2>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <li key={step.number} className={`ndisp-scroll-reveal stagger-${index} relative rounded-xl2 border border-ink-100 bg-white p-6 shadow-card`}>
                <span className="absolute right-5 top-4 font-display text-[13px] font-bold tracking-widest text-ink-300">STEP {step.number}</span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-900 text-saffron-400"><Icon size={22} /></span>
                <h3 className="mt-4 text-[16px] font-bold text-ink-950">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{step.text}</p>
                {index < 2 && <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-[22px] font-semibold text-ink-300 md:block" aria-hidden="true">→</span>}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
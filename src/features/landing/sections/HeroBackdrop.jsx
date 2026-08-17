import { Ambulance, Building2, Bus, Droplets, FileText, GraduationCap, HeartPulse, Hospital, Landmark, MapPin, Phone, Trees } from 'lucide-react'

// UMANG-style hero backdrop: layered decorative imagery behind the content —
// soft colour glows plus a scattered watermark of the district service icons
// (the same facility categories the search + map use). Purely decorative:
// aria-hidden, pointer-events-none, never rendered to assistive tech. Every
// animation reuses existing reduced-motion-safe keyframes (ndisp-float /
// ndisp-drift); icon opacity is kept below 10% so text stays readable.
const WATERMARK = [
  { icon: Hospital, x: 6, y: 18, size: 22, color: 'text-ink-900', anim: 'ndisp-float-slow' },
  { icon: GraduationCap, x: 88, y: 12, size: 20, color: 'text-saffron-500', anim: 'ndisp-drift' },
  { icon: Droplets, x: 94, y: 48, size: 18, color: 'text-sky-500', anim: 'ndisp-float' },
  { icon: Bus, x: 12, y: 62, size: 22, color: 'text-ink-900', anim: 'ndisp-drift' },
  { icon: Building2, x: 82, y: 76, size: 24, color: 'text-leaf-500', anim: 'ndisp-float-slow' },
  { icon: Landmark, x: 24, y: 30, size: 18, color: 'text-saffron-500', anim: 'ndisp-float' },
  { icon: MapPin, x: 68, y: 24, size: 20, color: 'text-ink-900', anim: 'ndisp-drift' },
  { icon: HeartPulse, x: 38, y: 12, size: 16, color: 'text-leaf-500', anim: 'ndisp-float' },
  { icon: Trees, x: 4, y: 84, size: 20, color: 'text-ink-900', anim: 'ndisp-float-slow' },
  { icon: FileText, x: 56, y: 88, size: 18, color: 'text-ink-900', anim: 'ndisp-drift' },
  { icon: Ambulance, x: 30, y: 78, size: 18, color: 'text-sky-500', anim: 'ndisp-float-slow' },
  { icon: Phone, x: 76, y: 56, size: 16, color: 'text-saffron-500', anim: 'ndisp-float' },
]

export default function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="ndisp-drift absolute -left-24 -top-24 h-72 w-72 rounded-full bg-saffron-300/40 blur-3xl" />
      <div className="ndisp-float-slow absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-leaf-200/40 blur-3xl" />
      <div className="ndisp-drift absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" style={{ animationDelay: '-8s' }} />

      {WATERMARK.map((item, index) => {
        const Icon = item.icon
        return (
          <span
            key={index}
            className={`absolute opacity-[0.09] ${item.color} ${item.anim}`}
            style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: `${index * -1.7}s`, animationDuration: index % 2 ? '13s' : '9s' }}
          >
            <Icon size={item.size} strokeWidth={1.6} />
          </span>
        )
      })}
    </div>
  )
}
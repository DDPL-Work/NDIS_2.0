import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPinned, Search, Flag, ClipboardCheck, Sparkles, FileDown, Map,
  ShieldCheck, Building2, HardHat, Droplets, HeartPulse, GraduationCap,
  Sun, Compass, Landmark, Database, LineChart, Workflow,
  Globe2, ArrowRight, Menu, X, Phone, Mail, MessageCircle, Languages,
  ChevronRight, CheckCircle2, Scale, Users, Layers,
  GripVertical,
} from 'lucide-react'
import { useI18n } from '../../i18n/i18n'
import { LANGUAGES } from '../../config/constants'
import heroBg from '../../assets/hero-bg.jpg'
import commandBg from '../../assets/command-bg.jpg'

/* ─────────────────────────────────────────────────────────────
   National Emblem (simplified, on-brand seal)
   ───────────────────────────────────────────────────────────── */
function Emblem({ className = '' }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15)
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={className}>
      <circle cx="24" cy="24" r="23" fill="currentColor" opacity="0.12" />
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="24" cy="24" r="2.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        {spokes.map((deg) => (
          <line key={deg} x1="24" y1="5" x2="24" y2="20" transform={`rotate(${deg} 24 24)`} />
        ))}
      </g>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────
   Section heading helper
   ───────────────────────────────────────────────────────────── */
function SectionHeading({ eyebrow, title, subtitle, light = false, align = 'center' }) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left'
  return (
    <div className={`max-w-3xl ${alignCls}`}>
      <p className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${light ? 'text-royal-300' : 'text-royal-600'}`}>
        <span className="h-px w-8 bg-current" />
        {eyebrow}
      </p>
      <h2 className={`mt-3 font-display text-3xl md:text-[2.5rem] font-semibold leading-[1.15] tracking-tight ${light ? 'text-white' : 'text-royal-950'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-[15px] leading-relaxed ${light ? 'text-royal-200' : 'text-slate-600'}`}>{subtitle}</p>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Content data (grounded in LLD Vol 1–5) — text resolved via i18n
   ──────────────────────────────────────────────────────────────── */
const SERVICES = [
  { key: 'locate', icon: Search, tagKey: 'landing.tag.citizen' },
  { key: 'report', icon: Flag, tagKey: 'landing.tag.citizen' },
  { key: 'track', icon: ClipboardCheck, tagKey: 'landing.tag.citizen' },
  { key: 'schemes', icon: Sparkles, tagKey: 'landing.tag.citizen' },
  { key: 'reports', icon: FileDown, tagKey: 'landing.tag.all' },
  { key: 'gis', icon: Map, tagKey: 'landing.tag.all' },
]

const SECTORS = [
  { key: 'health', icon: HeartPulse },
  { key: 'water', icon: Droplets },
  { key: 'education', icon: GraduationCap },
  { key: 'tourism', icon: Compass },
  { key: 'solar', icon: Sun },
  { key: 'assets', icon: Landmark },
]

const FLOW_STEPS = [
  { key: 'ingest', icon: Database, step: '01' },
  { key: 'analyse', icon: LineChart, step: '02' },
  { key: 'act', icon: Workflow, step: '03' },
  { key: 'inform', icon: Globe2, step: '04' },
]

const PORTALS = [
  { key: 'citizen', icon: Users, path: '/login', tone: 'bg-royal-50 text-royal-700' },
  { key: 'executive', icon: ShieldCheck, path: '/login', tone: 'bg-royal-700 text-white' },
  { key: 'linedept', icon: Building2, path: '/login', tone: 'bg-royal-50 text-royal-700' },
  { key: 'inspector', icon: HardHat, path: '/login', tone: 'bg-royal-50 text-royal-700' },
]

const PRINCIPLES = [
  { key: 'gisFirst', icon: MapPinned },
  { key: 'evidence', icon: Scale },
  { key: 'interoperable', icon: Globe2 },
  { key: 'nationalScale', icon: Layers },
  { key: 'multilingual', icon: Languages },
  { key: 'secure', icon: ShieldCheck },
]

const NAV_LINKS = [
  { id: 'home', labelKey: 'landing.nav.home' },
  { id: 'services', labelKey: 'landing.nav.services' },
  { id: 'sectors', labelKey: 'landing.nav.sectors' },
  { id: 'how', labelKey: 'landing.nav.how' },
  { id: 'portals', labelKey: 'landing.nav.portals' },
  { id: 'about', labelKey: 'landing.nav.about' },
  { id: 'contact', labelKey: 'landing.nav.contact' },
]

const HERO_STATS = [
  { value: '700+', labelKey: 'landing.hero.stats.districts' },
  { value: '6', labelKey: 'landing.hero.stats.sectors' },
  { value: '3', labelKey: 'landing.hero.stats.portals' },
  { value: '14-day', labelKey: 'landing.hero.stats.sla' },
]

const HERO_CHIPS = ['landing.hero.chip.gis', 'landing.hero.chip.gatishakti', 'landing.hero.chip.langs', 'landing.hero.chip.ogc']

const WORKFLOW_STEP_KEYS = [
  'landing.how.step.draft',
  'landing.how.step.submitted',
  'landing.how.step.dmReview',
  'landing.how.step.approved',
  'landing.how.step.budgetApproved',
  'landing.how.step.tasked',
  'landing.how.step.fieldInspection',
  'landing.how.step.completed',
  'landing.how.step.citizenFeedback',
  'landing.how.step.closed',
]

const SNAPSHOT_STATS = [
  ['6', 'landing.about.stat.depts'],
  ['700+', 'landing.about.stat.scaleTarget'],
  ['5', 'landing.about.stat.custodians'],
  ['99.5%', 'landing.about.stat.uptime'],
  ['98%', 'landing.about.stat.geocode'],
  ['14 days', 'landing.about.stat.sla'],
]

/* ─────────────────────────────────────────────────────────────
   Header
   ───────────────────────────────────────────────────────────── */
function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { locale, setLocale, t } = useI18n()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="bg-royal-950 text-royal-200">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 text-[11.5px]">
          <p className="hidden sm:flex items-center gap-2 tracking-wide">
            <span className="font-semibold text-white/90">{t('landing.govTop')}</span>
            <span className="opacity-40">|</span>
            {t('landing.portalName')}
          </p>
          <a href="#home" className="sm:hidden font-semibold text-white/90">{t('landing.govTop')}</a>
          <div className="flex items-center gap-4">
            <a href="mailto:helpdesk@ndisp.gov.in" className="hidden md:inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={12} /> helpdesk@ndisp.gov.in
            </a>
            <div className="flex items-center gap-1 rounded-full border border-royal-800 bg-royal-900/60 p-0.5">
              <Languages size={12} className="ml-2 text-royal-300" />
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code)}
                  className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors ${locale === lang.code ? 'bg-royal-500 text-white' : 'text-royal-200 hover:text-white'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className={`border-b bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'border-royal-100 shadow-[0_6px_24px_-12px_rgba(10,26,74,0.35)]' : 'border-royal-100/60'}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#home" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center text-royal-700">
              <Emblem className="h-11 w-11" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-bold text-royal-950 tracking-tight">
                NDISP <span className="text-royal-600">2.0</span>
              </span>
              <span className="block max-w-[220px] truncate text-[10.5px] text-slate-500 sm:max-w-none">
                {t('app.fullName')}
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-slate-600 transition-colors hover:bg-royal-50 hover:text-royal-800"
              >
                {t(link.labelKey)}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-royal-800 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-colors hover:bg-royal-900"
            >
              {t('landing.signin')} <ArrowRight size={15} />
            </Link>
            <button
              className="grid h-10 w-10 place-items-center rounded-lg border border-royal-100 text-royal-800 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={t('landing.toggleNav')}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {open && (
          <nav className="border-t border-royal-100 bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
            <div className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-royal-50 hover:text-royal-800"
                >
                  {t(link.labelKey)}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-royal-800 px-4 py-2.5 text-[14px] font-semibold text-white"
              >
                {t('landing.signin')} <ArrowRight size={15} />
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

/* ─────────────────────────────────────────────────────────────
   Draggable District Command panel — draggable ONLY within the
   Home section. Position is clamped to section bounds on every
   pointer move and re-clamped on window resize, so the panel
   never leaves, overlaps edges or gets hidden inside the section.
   ───────────────────────────────────────────────────────────── */
function DraggableCommandPanel({ sectionRef }) {
  const { t } = useI18n()
  const panelRef = useRef(null)
  const dragState = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  function clampWithinSection() {
    const section = sectionRef.current
    const panel = panelRef.current
    if (!section || !panel) return
    const sRect = section.getBoundingClientRect()
    const pRect = panel.getBoundingClientRect()

    setOffset((o) => {
      const minX = sRect.left - pRect.left
      const maxX = sRect.right - pRect.width - pRect.left
      const minY = sRect.top - pRect.top
      const maxY = sRect.bottom - pRect.height - pRect.top
      const canFitX = maxX >= minX
      const canFitY = maxY >= minY
      return {
        x: canFitX ? Math.min(Math.max(o.x, minX), maxX) : (sRect.left + sRect.right - pRect.width) / 2 - pRect.left,
        y: canFitY ? Math.min(Math.max(o.y, minY), maxY) : (sRect.top + sRect.bottom - pRect.height) / 2 - pRect.top,
      }
    })
  }

  // Keep the panel inside the section even after browser resize
  useEffect(() => {
    clampWithinSection()
    window.addEventListener('resize', clampWithinSection)
    return () => window.removeEventListener('resize', clampWithinSection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRef])

  function handlePointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY }
    setDragging(true)
  }

  function handlePointerMove(e) {
    const state = dragState.current
    if (!state || e.pointerId !== state.pointerId) return
    const section = sectionRef.current
    const panel = panelRef.current
    if (!section || !panel) return

    // Incremental delta from the last pointer position (1:1 mouse tracking)
    const dx = e.clientX - state.lastX
    const dy = e.clientY - state.lastY
    state.lastX = e.clientX
    state.lastY = e.clientY
    if (dx === 0 && dy === 0) return

    const sRect = section.getBoundingClientRect()
    const pRect = panel.getBoundingClientRect()

    // Clamp the panel's visual position to the Home section bounds
    let nextLeft = pRect.left + dx
    let nextTop = pRect.top + dy
    const minX = sRect.left
    const minY = sRect.top
    const maxX = sRect.right - pRect.width
    const maxY = sRect.bottom - pRect.height

    if (maxX < minX) {
      nextLeft = (sRect.left + sRect.right - pRect.width) / 2
    } else {
      nextLeft = Math.min(Math.max(nextLeft, minX), maxX)
    }
    if (maxY < minY) {
      nextTop = (sRect.top + sRect.bottom - pRect.height) / 2
    } else {
      nextTop = Math.min(Math.max(nextTop, minY), maxY)
    }

    setOffset((o) => ({
      x: o.x + (nextLeft - pRect.left),
      y: o.y + (nextTop - pRect.top),
    }))
  }

  function handlePointerEnd(e) {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    dragState.current = null
    setDragging(false)
  }

  return (
    <div
      ref={panelRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className={`relative select-none touch-none ${dragging ? 'z-30 cursor-grabbing' : 'z-10 cursor-grab'}`}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: dragging ? 'none' : 'transform 250ms ease-out',
        willChange: 'transform',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-royal-400/40 to-royal-600/20 blur-lg" />

      <div
        className={`relative overflow-hidden rounded-xl2 border shadow-2xl backdrop-blur-md transition-colors ${dragging ? 'border-white/40 bg-royal-950/85' : 'border-white/20 bg-royal-950/80'}`}
      >
        {/* Command background image */}
        <div aria-hidden="true" className="absolute inset-0">
          <img
            src={commandBg}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-royal-950/70 via-royal-950/50 to-royal-950/30" />
          <div className="absolute inset-0 bg-royal-950/10" />
        </div>

        <div className="relative flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-royal-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-royal-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-royal-600/70" />
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-300">
            {t('landing.hero.cmd.title')}
            <GripVertical size={13} className={dragging ? 'text-white' : 'text-royal-400'} />
          </span>
        </div>

        <div className="relative grid grid-cols-2 gap-3 p-5">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[11px] text-royal-300">{t('landing.hero.cmd.facilities')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white drop-shadow">2,481</p>
            <p className="mt-0.5 text-[11px] font-medium text-royal-400">+120 {t('landing.hero.cmd.facilitiesSub')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[11px] text-royal-300">{t('landing.hero.cmd.geotag')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white drop-shadow">96.2%</p>
            <p className="mt-0.5 text-[11px] font-medium text-royal-400">{t('landing.hero.cmd.geotagSub')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[11px] text-royal-300">{t('landing.hero.cmd.grievances')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white drop-shadow">1,204</p>
            <p className="mt-0.5 text-[11px] font-medium text-royal-400">{t('landing.hero.cmd.grievancesSub')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[11px] text-royal-300">{t('landing.hero.cmd.proposals')}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white drop-shadow">23</p>
            <p className="mt-0.5 text-[11px] font-medium text-royal-400">{t('landing.hero.cmd.proposalsSub')}</p>
          </div>
        </div>

        {/* mini density grid */}
        <div className="relative border-t border-white/10 bg-royal-950/25 p-5 backdrop-blur-sm">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-royal-300">{t('landing.hero.cmd.coverage')}</p>
          <div className="grid grid-cols-12 gap-1.5">
            {Array.from({ length: 36 }).map((_, i) => {
              const level = ((i * 7) % 11) / 10
              return (
                <span
                  key={i}
                  className="h-6 rounded-[4px]"
                  style={{
                    background: `rgba(140, 180, 250, ${0.15 + level * 0.6})`,
                  }}
                />
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-royal-400">
            <span>{t('landing.hero.cmd.low')}</span>
            <div className="flex gap-1">
              {[0.2, 0.4, 0.6, 0.8].map((o) => (
                <span key={o} className="h-2.5 w-5 rounded-sm" style={{ background: `rgba(140,180,250,${o})` }} />
              ))}
            </div>
            <span>{t('landing.hero.cmd.high')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Home / Hero
   ───────────────────────────────────────────────────────────── */
function Hero() {
  const sectionRef = useRef(null)
  const { t } = useI18n()

  return (
    <section id="home" ref={sectionRef} className="relative scroll-mt-24 overflow-hidden text-white">
      {/* Background image */}
      <div aria-hidden="true" className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        {/* Polished royal-blue scrims for legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-royal-950/80 via-royal-950/55 to-royal-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-royal-950/70 via-transparent to-royal-950/20" />
        <div className="absolute inset-0 bg-royal-950/10" />
        {/* subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
        }} />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 pb-20 pt-16 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-10">
        {/* Left copy */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
            <MapPinned size={13} className="text-royal-300" />
            {t('landing.hero.badge')}
          </p>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(8,20,60,0.55)] sm:text-5xl xl:text-[3.4rem]">
            {t('landing.hero.title1')}
            <span className="block bg-gradient-to-r from-white via-royal-100 to-royal-200 bg-clip-text text-transparent">
              {t('landing.hero.title2')}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-royal-100">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[14px] font-semibold text-royal-900 shadow-lg shadow-royal-950/40 transition-all hover:-translate-y-0.5 hover:bg-royal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('landing.hero.ctaServices')} <ArrowRight size={16} />
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/[0.08] px-5 py-3 text-[14px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {t('landing.signin')}
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-2 py-3 text-[13.5px] font-medium text-royal-100 transition-colors hover:text-white"
            >
              {t('landing.hero.ctaHow')} <ChevronRight size={16} />
            </a>
          </div>

          {/* Trust chips */}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-royal-100">
            {HERO_CHIPS.map((key) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-royal-300" /> {t(key)}
              </span>
            ))}
          </div>
        </div>

        {/* Right — District Command preview panel (draggable within Home) */}
        <div className="relative" aria-hidden="true">
          <DraggableCommandPanel sectionRef={sectionRef} />
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative border-t border-white/10 bg-royal-950/70 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {HERO_STATS.map((s) => (
            <div key={s.labelKey} className="text-center md:text-left">
              <p className="font-display text-2xl font-bold text-white drop-shadow sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-[12px] font-medium uppercase tracking-wide text-royal-200">{t(s.labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   Quick services
   ───────────────────────────────────────────────────────────── */
function QuickServices() {
  const { t } = useI18n()
  return (
    <section id="services" className="scroll-mt-24 bg-royal-50/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t('landing.services.eyebrow')}
          title={t('landing.services.title')}
          subtitle={t('landing.services.subtitle')}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ key, icon: Icon, tagKey }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-xl2 border border-royal-100 bg-white p-6 shadow-[0_1px_2px_rgba(10,26,74,0.05)] transition-all hover:-translate-y-1 hover:border-royal-300 hover:shadow-[0_18px_40px_-16px_rgba(19,42,114,0.28)]"
            >
              <div className="absolute right-5 top-5 rounded-full bg-royal-50 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-royal-600">
                {t(tagKey)}
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-royal-800 text-white transition-colors group-hover:bg-royal-700">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 font-display text-[17px] font-semibold text-royal-950">{t(`landing.services.${key}.title`)}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">{t(`landing.services.${key}.text`)}</p>
              <Link to="/login" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-royal-700 hover:text-royal-900">
                {t('landing.services.signin')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   Sectors
   ───────────────────────────────────────────────────────────── */
function Sectors() {
  const { t } = useI18n()
  return (
    <section id="sectors" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t('landing.sectors.eyebrow')}
          title={t('landing.sectors.title')}
          subtitle={t('landing.sectors.subtitle')}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-xl2 border border-royal-100 bg-royal-50/40 p-6 transition-colors hover:border-royal-200 hover:bg-royal-50">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-royal-800 shadow-sm">
                  <Icon size={18} />
                </div>
                <h3 className="font-display text-[15.5px] font-semibold text-royal-950">{t(`landing.sectors.${key}.title`)}</h3>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{t(`landing.sectors.${key}.text`)}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-medium text-royal-700 ring-1 ring-royal-100">
                <Building2 size={11} /> {t(`landing.sectors.${key}.detail`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   How it works — four-phase flow
   ───────────────────────────────────────────────────────────── */
function HowItWorks() {
  const { t } = useI18n()
  return (
    <section id="how" className="relative scroll-mt-24 overflow-hidden bg-royal-950 py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-royal-600/20 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-royal-500/15 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          light
          eyebrow={t('landing.how.eyebrow')}
          title={t('landing.how.title')}
          subtitle={t('landing.how.subtitle')}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {FLOW_STEPS.map(({ key, icon: Icon, step }, i) => (
            <div key={key} className="relative rounded-xl2 border border-white/10 bg-white/[0.05] p-6 backdrop-blur transition-colors hover:border-royal-400/50 hover:bg-white/[0.09]">
              {i < FLOW_STEPS.length - 1 && (
                <div aria-hidden="true" className="absolute -right-3.5 top-1/2 hidden h-px w-7 bg-gradient-to-r from-royal-400/70 to-transparent xl:block" />
              )}
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-royal-600 text-white shadow-lg shadow-royal-950/50">
                  <Icon size={20} />
                </div>
                <span className="font-mono text-[13px] font-semibold text-royal-400/80">{step}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-white">{t(`landing.how.${key}.title`)}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-royal-200">{t(`landing.how.${key}.text`)}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl2 border border-royal-500/30 bg-royal-900/60 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center gap-3">
              <Workflow size={28} className="text-royal-300" />
              <h3 className="font-display text-lg font-semibold text-white">{t('landing.how.engine')}</h3>
            </div>
            <ol className="flex flex-wrap items-center gap-y-2 text-[12.5px] text-royal-200">
              {WORKFLOW_STEP_KEYS.map((key, i, arr) => (
                <li key={key} className="flex items-center">
                  <span className="rounded-md bg-white/10 px-2.5 py-1 font-medium">{t(key)}</span>
                  {i < arr.length - 1 && <ChevronRight size={14} className="mx-1 text-royal-500" />}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   Portals
   ───────────────────────────────────────────────────────────── */
function Portals() {
  const { t } = useI18n()
  return (
    <section id="portals" className="scroll-mt-24 bg-royal-50/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={t('landing.portals.eyebrow')}
          title={t('landing.portals.title')}
          subtitle={t('landing.portals.subtitle')}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PORTALS.map(({ key, icon: Icon, tone, path }) => {
            const p = `landing.portals.${key}`
            return (
              <div key={key} className="group flex flex-col rounded-xl2 border border-royal-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(19,42,114,0.28)]">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-[17px] font-semibold text-royal-950">{t(`${p}.name`)}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{t(`${p}.desc`)}</p>
                <ul className="mt-4 space-y-2 text-[12.5px] text-slate-700">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-royal-500" />
                      {t(`${p}.p${n}`)}
                    </li>
                  ))}
                </ul>
                <Link to={path} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-royal-700 hover:text-royal-900">
                  {t('landing.portals.signin')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   About / Principles
   ───────────────────────────────────────────────────────────── */
function About() {
  const { t } = useI18n()
  return (
    <section id="about" className="scroll-mt-24 bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow={t('landing.about.eyebrow')}
              title={t('landing.about.title')}
              subtitle={t('landing.about.subtitle')}
            />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {PRINCIPLES.map(({ key, icon: Icon }) => (
                <div key={key} className="flex gap-3.5">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-royal-50 text-royal-700">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="font-display text-[14.5px] font-semibold text-royal-950">{t(`landing.about.pr.${key}.title`)}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-600">{t(`landing.about.pr.${key}.text`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pilot snapshot card */}
          <div className="lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-xl2 border border-royal-100 bg-royal-950 text-white">
              <div className="border-b border-white/10 px-6 py-5">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-royal-300">
                  <MapPinned size={13} /> {t('landing.about.snapshot')}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold">{t('landing.about.pilot')}</h3>
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-2">
                {SNAPSHOT_STATS.map(([v, l]) => (
                  <div key={l} className="bg-royal-950 px-6 py-5">
                    <p className="font-display text-2xl font-bold text-white">{v}</p>
                    <p className="mt-0.5 text-[12px] text-royal-300">{t(l)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 px-6 py-4 text-[12px] leading-relaxed text-royal-300">
                {t('landing.about.custody')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   CTA band
   ───────────────────────────────────────────────────────────── */
function CtaBand() {
  const { t } = useI18n()
  return (
    <section className="bg-royal-50/60 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-r from-royal-800 to-royal-600 px-8 py-12 text-center shadow-xl sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }} />
          <div className="relative">
            <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">{t('landing.cta.title')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-royal-100">
              {t('landing.cta.subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-royal-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-royal-50">
                {t('landing.cta.primary')} <ArrowRight size={16} />
              </Link>
              <a href="#services" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-white/10">
                {t('landing.cta.secondary')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────
   Footer
   ───────────────────────────────────────────────────────────── */
function SiteFooter() {
  const { t } = useI18n()
  const portalKeys = ['citizen', 'executive', 'linedept', 'inspector']
  const footLinks = ['landing.footer.accessibility', 'landing.footer.privacy', 'landing.footer.terms', 'landing.footer.disclaimer', 'landing.footer.sitemap']
  return (
    <footer id="contact" className="scroll-mt-24 bg-royal-950 pt-16 text-royal-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 pb-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center text-royal-200">
                <Emblem className="h-11 w-11" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[15px] font-bold text-white">NDISP 2.0</span>
                <span className="block text-[10.5px] text-royal-400">{t('app.fullName')}</span>
              </span>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-royal-300">
              {t('landing.footer.tagline')}
            </p>
            <div className="mt-5 flex gap-2.5">
              {[Globe2, MessageCircle, Phone].map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-lg border border-royal-800 text-royal-300 transition-colors hover:border-royal-500 hover:text-white" aria-label="External link">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">{t('landing.footer.quickLinks')}</h3>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {NAV_LINKS.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <a href={`#${l.id}`} className="inline-flex items-center gap-1.5 text-royal-300 transition-colors hover:text-white">
                    <ChevronRight size={12} className="text-royal-500" /> {t(l.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">{t('landing.footer.portals')}</h3>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {portalKeys.map((k) => (
                <li key={k}>
                  <Link to="/login" className="inline-flex items-center gap-1.5 text-royal-300 transition-colors hover:text-white">
                    <ChevronRight size={12} className="text-royal-500" /> {t(`landing.portals.${k}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">{t('landing.footer.help')}</h3>
            <ul className="mt-4 space-y-3 text-[12.5px] text-royal-300">
              <li className="flex items-start gap-2.5">
                <Phone size={14} className="mt-0.5 shrink-0 text-royal-400" />
                <span>{t('landing.footer.helpdesk')} <span className="font-medium text-white">1800-XXX-XXXX</span><br />({t('landing.footer.tollfree')})</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={14} className="mt-0.5 shrink-0 text-royal-400" />
                <a href="mailto:helpdesk@ndisp.gov.in" className="hover:text-white transition-colors">helpdesk@ndisp.gov.in</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinned size={14} className="mt-0.5 shrink-0 text-royal-400" />
                <span>{t('landing.footer.address')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-royal-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="text-center text-[11.5px] leading-relaxed text-royal-400">
            {t('landing.footer.copyright1')}
            <span className="mx-2 opacity-50">·</span>
            {t('landing.footer.copyright2')}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] text-royal-500">
            {footLinks.map((k, i) => (
              <span key={k} className="flex items-center gap-x-6">
                {i > 0 && <span className="opacity-50">·</span>}
                <a href="#" className="hover:text-royal-300">{t(k)}</a>
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─────────────────────────────────────────────────────────────
   Landing page composition
   ───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-white font-body text-royal-950">
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-royal-900 focus:px-4 focus:py-2 focus:text-white"
      >
        {t('landing.skip')}
      </a>
      <SiteHeader />
      <main>
        <Hero />
        <QuickServices />
        <Sectors />
        <HowItWorks />
        <Portals />
        <About />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}

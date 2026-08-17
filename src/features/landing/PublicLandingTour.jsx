import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapPinned, X } from 'lucide-react'
import Button from '../../components/ui/Button'

// Lightweight first-visit tour for the public landing page. The full citizen
// tour system lives in the signed-in portal; this standalone tour keeps the
// public page dependency-free. It is never forced again after completion
// (localStorage 'ndisp-public-tour-completed') and can be reopened from the
// header. All motion here is opacity/transform — the global reduced-motion
// rule shortens it to nothing.
const STORAGE_KEY = 'ndisp-public-tour-completed'
const SPOTLIGHT_PAD = 8

const STEPS = [
  { id: 'welcome', title: 'Welcome to NDISP', text: 'The National District Information & Service Platform connects you with your district. Let us show you around.' },
  { id: 'search', title: 'Find Services', target: '[data-tour-target="hero-search"]', text: 'Search for hospitals, schools and other services — results come from live district data.' },
  { id: 'map', title: 'Search Facilities', target: '[data-tour-target="hero-map"]', text: 'Hospitals, schools, water points and more — everything in your district, mapped in one place.' },
  { id: 'complaint', title: 'Register a Complaint', target: '[data-tour-target="service-complaint"]', text: 'See something that needs attention? Tell the right department about it.' },
  { id: 'track', title: 'Track Your Request', target: '[data-tour-target="complaint-section"]', text: 'From Submitted to Resolved, follow your request through every stage.' },
  { id: 'account', title: 'Create an Account', target: '[data-tour-target="create-account"]', text: 'Sign up to register complaints, track requests and stay informed. Public information stays open to everyone.' },
]

export function hasCompletedTour() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

export default function PublicLandingTour({ open, onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const focusRef = useRef(null)

  const step = STEPS[stepIndex]

  const next = useCallback(() => {
    if (stepIndex >= STEPS.length - 1) {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
      onClose()
      return
    }
    setStepIndex((value) => value + 1)
  }, [stepIndex, onClose])

  const close = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* private mode */ }
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    focusRef.current = document.activeElement
    setStepIndex(0)
    const onKey = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft' && stepIndex > 0) setStepIndex((value) => value - 1)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      focusRef.current?.focus?.()
    }
  }, [open, stepIndex, next, close])

  useEffect(() => {
    if (!open || !step?.target) { setTargetRect(null); return }
    let raf = 0
    const measure = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = document.querySelector(step.target)
        if (!el) return
        const rect = el.getBoundingClientRect()
        // Hidden targets (e.g. the hero visual collapsed on mobile) are
        // skipped so the tour never points at an invisible element.
        if (rect.width <= 2 || rect.height <= 2) {
          setTargetRect(null)
          setStepIndex((value) => Math.min(STEPS.length - 1, value + 1))
          return
        }
        setTargetRect(rect)
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(raf)
    }
  }, [open, step])

  const position = useMemo(() => {
    if (!targetRect) return null
    const width = Math.min(360, window.innerWidth - 24)
    const height = 240
    const margin = 8
    const left = Math.max(margin, Math.min(window.innerWidth - width - margin, targetRect.left + targetRect.width / 2 - width / 2))
    const below = targetRect.bottom + 12 + height <= window.innerHeight - margin
    const top = below ? targetRect.bottom + 12 : Math.max(margin, targetRect.top - height - 12)
    return { left, top: Math.min(top, window.innerHeight - height - margin) }
  }, [targetRect])

  if (!open || !step) return null

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="NDISP tour">
      <div className="fixed inset-0 bg-ink-950/40" />
      {targetRect && (
        <div
          className="pointer-events-none fixed rounded-2xl border-2 border-saffron-500"
          style={{ left: targetRect.left - SPOTLIGHT_PAD, top: targetRect.top - SPOTLIGHT_PAD, width: targetRect.width + SPOTLIGHT_PAD * 2, height: targetRect.height + SPOTLIGHT_PAD * 2 }}
        />
      )}

      <div
        className="ndisp-fade-in fixed rounded-xl border border-ink-200 bg-white p-5 shadow-popover"
        style={{ left: position?.left ?? 12, top: position?.top ?? Math.max(12, window.innerHeight / 2 - 95), width: Math.min(360, window.innerWidth - 24) }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-900 text-saffron-400"><MapPinned size={17} /></span>
          <button onClick={close} aria-label="Close tour" className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-800"><X size={16} /></button>
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">Tour · Step {stepIndex + 1} of {STEPS.length}</p>
        <h3 className="mt-1 text-[15px] font-bold text-ink-950">{step.title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button size="sm" variant="ghost" onClick={close}>Skip tour</Button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setStepIndex((value) => Math.max(0, value - 1))} disabled={stepIndex === 0}>Back</Button>
            <Button size="sm" variant={stepIndex === STEPS.length - 1 ? 'saffron' : 'primary'} onClick={next}>{stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
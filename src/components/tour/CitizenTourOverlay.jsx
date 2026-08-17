import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TOURS } from './citizenTourConfig'
import { useTourStore } from './tourStore'
import CitizenTourTooltip from './CitizenTourTooltip'

// TARGET_DETECT_WINDOW: how long to keep waiting for a step target
// (route render, sidebar open animation, wizard step change).
const TARGET_DETECT_WINDOW = 7000
const SPOTLIGHT_PAD = 8

const devLog = (...args) => {
  if (import.meta.env.DEV) console.warn('[CitizenTour]', ...args)
}

// An element is "visible" only when it actually intersects the viewport.
// The Explore Map sidebar stays mounted while collapsed (clipped off via
// width 0 / translate), so its own rect decides visibility for children.
function isVisible(el) {
  const rect = el.getBoundingClientRect()
  if (rect.width <= 1 || rect.height <= 1) return false
  const sidebar = el.closest('[data-tour-sidebar]')
  if (sidebar) {
    const side = sidebar.getBoundingClientRect()
    if (side.width <= 2) return false
    if (side.right <= 0 || side.left >= window.innerWidth) return false
    return true
  }
  return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth
}

function findTarget(step) {
  const selectors = step.targets || []
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el && isVisible(el)) return el
  }
  return null
}

function ensureInView(el) {
  const rect = el.getBoundingClientRect()
  const margin = 24
  const needsScroll =
    rect.top < margin || rect.bottom > window.innerHeight - margin || rect.left < margin || rect.right > window.innerWidth - margin
  if (needsScroll) {
    try {
      el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })
    } catch {
      /* older browsers */
    }
  }
}

// Pick the best tooltip anchor for the current target rect.  Large targets
// (the map, a full-width panel) dock the tooltip instead of hugging an edge.
function computePlacement(rect) {
  const viewport = { width: window.innerWidth, height: window.innerHeight }
  const W = Math.min(340, viewport.width - 24)
  const H = 208
  const GAP = 12
  const M = 8
  const large = rect.width * rect.height > viewport.width * viewport.height * 0.5
  const clampX = (left) => Math.max(M, Math.min(viewport.width - W - M, left))

  if (large) {
    return { left: viewport.width < 768 ? M : clampX(rect.left + rect.width / 2 - W / 2), top: viewport.height - H - M }
  }
  if (rect.bottom + GAP + H <= viewport.height - M) {
    return { left: clampX(rect.left + rect.width / 2 - W / 2), top: rect.bottom + GAP }
  }
  if (rect.top - GAP - H >= M) {
    return { left: clampX(rect.left + rect.width / 2 - W / 2), top: rect.top - GAP - H }
  }
  if (rect.right + GAP + W <= viewport.width - M) {
    return { left: rect.right + GAP, top: Math.max(M, Math.min(viewport.height - H - M, rect.top)) }
  }
  if (rect.left - GAP - W >= M) {
    return { left: rect.left - GAP - W, top: Math.max(M, Math.min(viewport.height - H - M, rect.top)) }
  }
  return { left: M, top: viewport.height - H - M }
}

export default function CitizenTourOverlay() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTourId = useTourStore((s) => s.activeTourId)
  const stepIndex = useTourStore((s) => s.stepIndex)
  const next = useTourStore((s) => s.next)
  const back = useTourStore((s) => s.back)
  const skipTour = useTourStore((s) => s.skipTour)
  const closeTour = useTourStore((s) => s.closeTour)
  const finishTour = useTourStore((s) => s.finishTour)

  const tour = useMemo(() => TOURS.find((t) => t.id === activeTourId) || null, [activeTourId])
  const step = useMemo(() => (tour ? tour.steps[stepIndex] : null), [tour, stepIndex])

  const [targetRect, setTargetRect] = useState(null)
  const targetElRef = useRef(null)
  const pendingClickRef = useRef(false)
  const previousFocusRef = useRef(null)

  // Escape closes the tour (§31, §46 K).  Focus is moved into the tooltip so
  // keyboard users can reach Back/Next/Skip without tabbing through the page.
  useEffect(() => {
    if (!tour) return
    previousFocusRef.current = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') closeTour()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (document.activeElement && document.activeElement.classList.contains('citizen-tour-tooltip')) {
        previousFocusRef.current?.focus?.()
      }
    }
  }, [tour, closeTour])

  // Step lifecycle: navigate when needed → open sidebar → click prerequisite →
  // find target (retry) → highlight; missing targets skip gracefully (§28, §44).
  useEffect(() => {
    if (!tour || !step) return
    let cancelled = false
    let start = performance.now()
    let raf = 0

    const tick = () => {
      if (cancelled) return

      // Completion step: nothing to highlight, show the tooltip directly.
      if (step.done) {
        targetElRef.current = null
        setTargetRect(null)
        return
      }

      // Cross-route target: navigate and keep waiting for the page to render.
      // A tour may accept several equivalent routes (e.g. the Explore Map
      // renders at both /citizen/map and /citizen/facilities) — never
      // redirect the citizen between identical pages.
      if (tour.route) {
        const onAcceptedRoute = location.pathname === tour.route || (tour.routes || []).includes(location.pathname)
        if (!onAcceptedRoute) {
          navigate(tour.route, { replace: stepIndex === 0 })
          raf = requestAnimationFrame(tick)
          return
        }
      }

      // Targets inside the collapsed Explore Map sidebar: open it first and
      // wait for the width/transform animation to finish.
      if (step.opensSidebar) {
        const sidebar = document.querySelector('[data-tour-sidebar]')
        if (sidebar && sidebar.dataset.tourSidebar !== 'open') {
          window.dispatchEvent(new Event('ndisp-tour-open-sidebar'))
          raf = requestAnimationFrame(tick)
          return
        }
      }

      // One-time prerequisite click (complaint wizard "Next" button only).
      if (step.click && !pendingClickRef.current) {
        const clickable = document.querySelector(step.click)
        if (clickable) {
          pendingClickRef.current = true
          clickable.click()
        }
      }

      const el = findTarget(step)
      if (el) {
        if (el !== targetElRef.current) {
          targetElRef.current = el
          ensureInView(el)
          setTargetRect(el.getBoundingClientRect())
        }
        const tooltipEl = document.querySelector('.citizen-tour-tooltip')
        tooltipEl?.focus?.()
        return
      }

      if (performance.now() - start > TARGET_DETECT_WINDOW) {
        // If the very first step can't be found, the page probably doesn't
        // match the tour — abort quietly instead of clicking through every
        // step with nothing highlighted.
        if (stepIndex === 0) {
          devLog('tour', tour.id, 'first step target missing; aborting tour')
          useTourStore.getState().skipTour()
          return
        }
        devLog('step', step.id, 'target not found; skipping to next step')
        useTourStore.getState().next()
        return
      }

      raf = requestAnimationFrame(tick)
    }

    pendingClickRef.current = false
    targetElRef.current = null
    setTargetRect(null)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, step, location.pathname])

  // Keep the spotlight pinned to the target while scrolling/resizing.
  useEffect(() => {
    if (!targetElRef.current) return
    let raf = 0
    const refresh = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = targetElRef.current
        if (el && isVisible(el)) setTargetRect(el.getBoundingClientRect())
      })
    }
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
      cancelAnimationFrame(raf)
    }
  }, [tour, stepIndex])

  const position = useMemo(
    () => (targetRect ? computePlacement(targetRect) : { left: 0, top: 0 }),
    [targetRect]
  )

  if (!tour || !step) return null

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Click shield: blocks the page while the tour is open so the citizen
          never accidentally clicks something under the overlay. */}
      <div className="fixed inset-0" />

      {/* Spotlight: the dimmed page around a clear, visible target. */}
      {targetRect && (
        <div
          className="fixed pointer-events-none"
          style={{
            left: targetRect.left - SPOTLIGHT_PAD,
            top: targetRect.top - SPOTLIGHT_PAD,
            width: targetRect.width + SPOTLIGHT_PAD * 2,
            height: targetRect.height + SPOTLIGHT_PAD * 2,
            borderRadius: 14,
            border: '2px solid rgba(224,122,44,0.85)',
            boxShadow: '0 0 0 9999px rgba(15,23,42,0.45)',
          }}
        />
      )}

      {/* Tooltip renders only once the target is visible (or on the final
          completion step) — never at a wrong position mid-navigation. */}
      {(targetRect || step.done) && (
        <CitizenTourTooltip
          step={step}
          stepNumber={stepIndex}
          stepCount={tour.steps.length}
          position={step.done ? { left: Math.max(12, window.innerWidth / 2 - 170), top: Math.max(12, window.innerHeight / 2 - 140) } : position}
          onBack={back}
          onNext={next}
          onSkip={skipTour}
          onClose={closeTour}
          onFinish={finishTour}
        />
      )}
    </div>
  )
}
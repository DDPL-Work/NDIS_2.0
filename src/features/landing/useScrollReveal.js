import { useEffect } from 'react'

// Adds .in-view to every .ndisp-scroll-reveal element as it enters the
// viewport. Stays inert (elements remain visible) under prefers-reduced-motion
// and for users who never scroll. Uses the native IntersectionObserver — no
// animation dependency.
export default function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef?.current
    if (!root) return
    const targets = root.querySelectorAll('.ndisp-scroll-reveal')
    if (!targets.length) return
    const revealAll = () => targets.forEach((target) => target.classList.add('in-view'))
    if (typeof IntersectionObserver === 'undefined') { revealAll(); return }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced) { revealAll(); return }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [rootRef])
}
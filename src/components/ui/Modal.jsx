import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Responsive dialog: centered card on desktop, full-width bottom sheet on
// mobile. Focus is trapped inside, initially placed on the first meaningful
// control, restored on close; ESC and backdrop-click close; body scroll is locked.
//
// Focus lifecycle: the effect below depends ONLY on `open`. Parent re-renders
// while the modal is open (form typing, select changes, validation, data
// arrivals) must never re-run it — re-running would re-trigger the initial
// focus write and steal focus from the active form control.
//
// Mobile sizing uses dvh (not vh) so the sheet never slips behind the browser
// URL bar, and the default z-index sits above the citizen bottom navigation
// (z-160) and in-map sheets (z-150) so no mobile overlay can obscure a modal.
//
// `scrollBody={false}` hands scrolling to a child that manages its own single
// scroll region (e.g. ComplaintDetailHub) — the outer body stops scrolling so
// nested scroll containers never trap touch/wheel input.
export default function Modal({ open, onClose, title, children, footer, width = 'max-w-lg', zIndex = 'z-[200]', scrollBody = true }) {
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const previouslyFocused = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement
    const panel = panelRef.current
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab' || !panel) return
      const focusables = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) { e.preventDefault(); return }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => {
      const all = panel?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!all || !all.length) { panel?.focus?.(); return }
      // The header close button precedes the dialog body in the DOM, so the
      // first focusable is NOT the right initial target — land on the first
      // meaningful control (the form's first field) instead.
      const first = [...all].find((el) => el !== closeBtnRef.current) || all[0]
      first.focus?.()
    })
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused.current?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={`fixed inset-0 ${zIndex} flex items-end justify-center sm:items-center p-3 sm:p-4`}>
      <div className="absolute inset-0 bg-ink-950/40 animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${width} rounded-t-2xl sm:rounded-2xl bg-white shadow-popover animate-fade-in max-h-[calc(100dvh-1.5rem)] sm:max-h-[85vh] flex flex-col outline-none`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 shrink-0">
          <h3 className="text-[15px] font-semibold text-ink-950 break-words">{title}</h3>
          <button ref={closeBtnRef} type="button" aria-label="Close" onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700">
            <X size={16} />
          </button>
        </div>
        {scrollBody
          ? <div className="px-5 py-4 overflow-y-auto">{children}</div>
          : <div className="flex-1 min-h-0 overflow-hidden">{children}</div>}
        {footer && <div className="px-5 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] border-t border-ink-100 flex flex-wrap items-center justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
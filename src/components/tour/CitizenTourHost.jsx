import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { TOURS } from './citizenTourConfig'
import { isTourDone, useTourStore } from './tourStore'
import { useAuthStore } from '../../app/store/authStore'
import CitizenTourOverlay from './CitizenTourOverlay'

// Route → feature tour id.  Only tours whose feature actually exists are
// listed; routes that reuse a page (e.g. /citizen/facilities renders the
// Explore Map) reuse the same tour.
const FEATURE_TOUR_BY_ROUTE = [
  { prefix: '/citizen/map', tourId: 'map' },
  { prefix: '/citizen/facilities', tourId: 'map' },
  { prefix: '/citizen/register', tourId: 'complaint' },
  { prefix: '/citizen/complaints', tourId: 'my-complaints' },
  { prefix: '/citizen/track', tourId: 'track' },
  { prefix: '/citizen/schemes', tourId: 'schemes' },
  { prefix: '/citizen/notifications', tourId: 'notifications' },
  { prefix: '/citizen/profile', tourId: 'profile' },
]

function WelcomeModal({ onStart, onSkip }) {
  return (
    <Modal open onClose={onSkip} title="Welcome to the Citizen Portal" width="max-w-md">
      <div className="space-y-4">
        <p className="text-[13.5px] leading-relaxed text-ink-600">
          Welcome to the Citizen Portal 👋
          <br />
          <br />
          This portal helps you find government services, report problems and track your complaints.
        </p>
        <p className="text-[12.5px] text-ink-500">Let us show you around.</p>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
        <Button variant="ghost" size="sm" onClick={onSkip} aria-label="Skip for now">
          Skip for now
        </Button>
        <Button onClick={onStart} aria-label="Start tour">
          Start Tour
        </Button>
      </div>
    </Modal>
  )
}

function ReplayModal({ onClose }) {
  const startTour = useTourStore((s) => s.startTour)
  return (
    <Modal open onClose={onClose} title="Take a Tour" width="max-w-md">
      <p className="text-[12.5px] text-ink-500">Choose a tour to replay. You can stop it anytime.</p>
      <div className="mt-3 space-y-1.5">
        {TOURS.map((tour) => (
          <div key={tour.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 px-3.5 py-2.5">
            <div>
              <p className="text-[13px] font-semibold text-ink-900">{tour.label}</p>
              <p className="text-[11px] text-ink-400">{tour.steps.length} step{tour.steps.length === 1 ? '' : 's'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => startTour(tour.id)} aria-label={`Start ${tour.label} tour`}>
              Start
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

// Citizen-only tour host.  Rendered inside CitizenShell, so only authenticated
// citizens ever see the welcome modal or the tour overlay.
export default function CitizenTourHost() {
  const location = useLocation()
  const authStatus = useAuthStore((s) => s.status)
  const welcomeVisible = useTourStore((s) => s.welcomeVisible)
  const replayVisible = useTourStore((s) => s.replayVisible)
  const showWelcome = useTourStore((s) => s.showWelcome)
  const skipWelcome = useTourStore((s) => s.skipWelcome)
  const startTour = useTourStore((s) => s.startTour)
  const activeTourId = useTourStore((s) => s.activeTourId)

  const triggerTimer = useRef(null)

  // FIRST VISIT → welcome modal (only once per TOUR_VERSION; skip/finish
  // persist so it never appears again on refresh).
  useEffect(() => {
    if (authStatus !== 'authenticated') return
    if (isTourDone('main') || welcomeVisible) return
    const timer = setTimeout(showWelcome, 600)
    return () => clearTimeout(timer)
  }, [authStatus, welcomeVisible, showWelcome])

  // Progressive feature tours: first visit to a feature page starts only that
  // feature's tour — never while another tour or the welcome modal is open,
  // and only if the citizen hasn't already finished/skipped it.
  useEffect(() => {
    if (authStatus !== 'authenticated') return
    if (activeTourId || welcomeVisible) return
    const match = FEATURE_TOUR_BY_ROUTE.find((entry) => location.pathname === entry.prefix || location.pathname.startsWith(entry.prefix + '/'))
    if (!match || isTourDone(match.tourId)) return
    clearTimeout(triggerTimer.current)
    triggerTimer.current = setTimeout(() => {
      if (!useTourStore.getState().activeTourId && !useTourStore.getState().welcomeVisible) {
        startTour(match.tourId)
      }
    }, 800)
    return () => clearTimeout(triggerTimer.current)
  }, [location.pathname, authStatus, activeTourId, welcomeVisible, startTour])

  return (
    <>
      {welcomeVisible && <WelcomeModal onStart={() => startTour('main')} onSkip={skipWelcome} />}
      {replayVisible && <ReplayModal onClose={() => useTourStore.getState().closeReplay()} />}
      {activeTourId && <CitizenTourOverlay />}
    </>
  )
}
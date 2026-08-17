import { create } from 'zustand'
import { TOURS, TOUR_VERSION, TOUR_STORAGE_KEY } from './citizenTourConfig'

// Tour completion/skip state — persisted per tour, versioned so a major
// portal change (TOUR_VERSION bump) can offer the tours again.  Follows the
// app-wide localStorage convention (ndisp.* keys).  read/write failures are
// swallowed: the tour must never break the portal.
function readTourState() {
  try {
    const raw = localStorage.getItem(TOUR_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || parsed.version !== TOUR_VERSION) return { completed: [], skipped: [] }
    return { completed: parsed.completed || [], skipped: parsed.skipped || [] }
  } catch {
    return { completed: [], skipped: [] }
  }
}

function writeTourState(state) {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ version: TOUR_VERSION, ...state }))
  } catch {
    /* storage may be unavailable */
  }
}

function markCompleted(tourId) {
  const state = readTourState()
  const completed = state.completed.includes(tourId) ? state.completed : [...state.completed, tourId]
  writeTourState({ completed, skipped: state.skipped.filter((id) => id !== tourId) })
}

function markSkipped(tourId) {
  const state = readTourState()
  const skipped = state.skipped.includes(tourId) ? state.skipped : [...state.skipped, tourId]
  writeTourState({ completed: state.completed.filter((id) => id !== tourId), skipped })
}

export const isTourDone = (tourId) => {
  const state = readTourState()
  return state.completed.includes(tourId) || state.skipped.includes(tourId)
}

export const useTourStore = create((set, get) => ({
  activeTourId: null,
  stepIndex: 0,
  welcomeVisible: false,
  replayVisible: false,

  showWelcome: () => set({ welcomeVisible: true }),
  hideWelcome: () => set({ welcomeVisible: false }),

  // "Skip for now" on the welcome modal persists the skip so the welcome
  // never reappears on refresh; the citizen can replay from Help.
  skipWelcome: () => {
    markSkipped('main')
    set({ welcomeVisible: false })
  },

  openReplay: () => set({ replayVisible: true }),
  closeReplay: () => set({ replayVisible: false }),

  // Start a tour at step 0.  Replay from Help/Take a Tour always works.
  startTour: (tourId) =>
    set({ activeTourId: tourId, stepIndex: 0, welcomeVisible: false, replayVisible: false }),

  next: () => {
    const { activeTourId, stepIndex } = get()
    const tour = TOURS.find((t) => t.id === activeTourId)
    if (!tour) return
    if (stepIndex >= tour.steps.length - 1) {
      markCompleted(tour.id)
      set({ activeTourId: null, stepIndex: 0 })
    } else {
      set({ stepIndex: stepIndex + 1 })
    }
  },

  back: () => {
    const { stepIndex } = get()
    if (stepIndex > 0) set({ stepIndex: stepIndex - 1 })
  },

  // Skip/Close persist the skip so the tour is not forced again on refresh
  // or on the next visit; the citizen can always replay from Help.
  skipTour: () => {
    const { activeTourId } = get()
    if (activeTourId) markSkipped(activeTourId)
    set({ activeTourId: null, stepIndex: 0 })
  },

  closeTour: () => get().skipTour(),

  finishTour: () => {
    const { activeTourId } = get()
    if (activeTourId) markCompleted(activeTourId)
    set({ activeTourId: null, stepIndex: 0 })
  },
}))
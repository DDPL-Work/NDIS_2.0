// Lightweight data invalidation bus for the real API layer.  The project has
// no React Query/SWR; screens refresh via useAsync(deps).  API mutation
// methods call touch(scope) after a successful backend write, incrementing a
// per-scope version counter that dependent screens include in their fetch
// deps — the same reactive pattern as the rest of the Zustand architecture.
import { create } from 'zustand'

export const DATA_SCOPES = {
  PLANNING: 'planning',
  PROPOSALS: 'proposals',
  PROJECTS: 'projects',
  SITE_DIARIES: 'site-diaries',
  MEASUREMENT_BOOKS: 'measurement-books',
  BILLS: 'bills',
  RISKS: 'risks',
  REPORTS: 'reports',
  DASHBOARD: 'dashboard',
  FACILITIES: 'facilities',
  GIS: 'gis',
  COMPLAINTS: 'complaints',
  TIMELINE: 'timeline',
  NOTIFICATIONS: 'notifications',
  EMPLOYEES: 'employees',
  BUDGET: 'budget',
}

export const useDataVersion = create((set) => ({
  versions: {},
  touch(scope) {
    if (!scope) return
    set((state) => ({ versions: { ...state.versions, [scope]: (state.versions[scope] || 0) + 1 } }))
  },
}))

// Convenience for non-hook call sites (services, API modules).
export const invalidateData = (scope) => useDataVersion.getState().touch(scope)

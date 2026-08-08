import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../app/store/authStore'
import { createFacilitySlug } from '../utils/createFacilitySlug'
import { ROLES } from '../config/constants'

// Single shared facility-click behaviour (production NDISP).  Every facility
// interaction — marker click, sidebar card click, search result click — goes
// through this one handler so the role decision is never duplicated:
//   citizen        → navigate to /citizen/facility/:slug (FacilityDetail page)
//   every other role (DM/ADM/Executive/Collector/Department Officer)
//                  → open the right-side inspection panel (SituationMatrix)
export function useFacilityClickHandler({ onOpenPanel } = {}) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)

  return useCallback(
    (facility) => {
      if (!facility) return
      if (role === ROLES.CITIZEN) {
        const slug = facility.slug || createFacilitySlug(facility) || facility.id
        if (import.meta.env.DEV) console.info('[GIS diagnostics] facility click → navigate', { role, id: facility.id, slug, target: `/citizen/facility/${slug}` })
        navigate(`/citizen/facility/${slug}`)
        return
      }
      if (import.meta.env.DEV) console.info('[GIS diagnostics] facility click → open panel', { role, id: facility.id })
      onOpenPanel?.(facility)
    },
    [role, navigate, onOpenPanel]
  )
}

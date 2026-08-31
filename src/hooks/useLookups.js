// Centralized lookup hooks — replace hardcoded DEPARTMENT_MAP and DISTRICTS
// lookups with backend-hydrated data. These hooks build lookup maps from the
// cached master data and provide stable references across re-renders.

import { useMemo } from 'react'
import { useDepartments as useMasterDepartments, useDistricts as useMasterDistricts } from './useMasterData'

// Build a lookup map keyed by department id (string) for O(1) access.
export function departmentMapFrom(departments = []) {
  return Object.fromEntries(departments.map((d) => [String(d.id), d]))
}

// Build a lookup map keyed by district id (string) for O(1) access.
export function districtMapFrom(districts = []) {
  return Object.fromEntries(districts.map((d) => [String(d.id), d]))
}

// Hook: provides a stable department map from backend data.
// Usage: const deptMap = useDepartmentMap(); const dept = deptMap[departmentId];
export function useDepartmentMap() {
  const { data: departments } = useMasterDepartments()
  return useMemo(() => departmentMapFrom(departments || []), [departments])
}

// Hook: provides a stable district map from backend data.
// Usage: const distMap = useDistrictMap(); const dist = distMap[districtId];
export function useDistrictMap() {
  const { data: districts } = useMasterDistricts()
  return useMemo(() => districtMapFrom(districts || []), [districts])
}

// Hook: provides the user's district center coordinates from backend data.
// Returns [lng, lat] or null if not available.
export function useDistrictCenter(districtId) {
  const { data: districts } = useMasterDistricts()
  return useMemo(() => {
    if (!districtId || !districts?.length) return null
    const district = districts.find((d) => String(d.id) === String(districtId))
    return district?.center || district?.centroid || null
  }, [districts, districtId])
}

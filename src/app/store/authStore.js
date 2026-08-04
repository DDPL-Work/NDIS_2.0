import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLES, ROLE_PORTAL, DEPARTMENTS } from '../../config/constants'

// Auth is mocked (no real credential exchange) — this store stands in for the
// JWT claims payload described in LLD Vol 2 §14.4 (sub, role, district_id,
// department_id, permissions[]) so the rest of the app can be written exactly
// as it would be against a real session.
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, // { name, role, districtId, departmentId }
      signInAs(role, extra = {}) {
        const base = {
          [ROLES.CITIZEN]: { name: 'Guest Citizen', districtId: 'nalanda' },
          [ROLES.FIELD_ENGINEER]: { name: 'Field Engineer', districtId: 'nalanda', departmentId: DEPARTMENTS[0].id },
          [ROLES.DEPT_OFFICER]: { name: 'Department Officer', districtId: 'nalanda', departmentId: DEPARTMENTS[0].id },
          [ROLES.ADM]: { name: 'Additional District Magistrate', districtId: 'nalanda' },
          [ROLES.DM]: { name: 'Dr. Ashok Kumar Sinha', districtId: 'nalanda' },
          [ROLES.STATE_ADMIN]: { name: 'State Admin', districtId: 'nalanda' },
        }[role]
        set({ user: { role, ...base, ...extra } })
        return ROLE_PORTAL[role]
      },
      setDistrict(districtId) {
        set((s) => ({ user: s.user ? { ...s.user, districtId } : s.user }))
      },
      setDepartment(departmentId) {
        set((s) => ({ user: s.user ? { ...s.user, departmentId } : s.user }))
      },
      signOut() {
        set({ user: null })
      },
    }),
    { name: 'ndisp-auth' }
  )
)

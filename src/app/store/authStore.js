import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLES, ROLE_PORTAL, DEPARTMENTS } from '../../config/constants'

// Mock JWT Token Generator with Full Claims Payload (LLD Vol 2 §14.4)
function generateMockJwt(role, base) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(
    JSON.stringify({
      sub: `USR-${Math.floor(10000 + Math.random() * 90000)}`,
      name: base.name,
      role: role,
      districtId: base.districtId || 'nalanda',
      departmentId: base.departmentId || null,
      jurisdiction: base.jurisdiction || { block: 'Silao', village: 'Rajgir' },
      permissions: base.permissions || ['READ_PUBLIC'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  )
  const signature = 'mock_sig_' + Math.random().toString(36).substring(7)
  return `${header}.${payload}.${signature}`
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, // { name, role, districtId, departmentId, jurisdiction, permissions, token }

      signInAs(role, extra = {}) {
        const rolePresets = {
          [ROLES.CITIZEN]: {
            name: 'Sunita Devi (Citizen)',
            districtId: 'nalanda',
            jurisdiction: { block: 'Silao', village: 'Rajgir', ward: 'Ward 02' },
            permissions: ['CITIZEN_READ', 'COMPLAINT_WRITE', 'TRACK_PUBLIC'],
          },
          [ROLES.DISTRICT_COLLECTOR]: {
            name: 'Dr. Ashok Kumar Sinha (Collector)',
            districtId: 'nalanda',
            jurisdiction: { district: 'Nalanda', level: 'District Executive' },
            permissions: ['ALL_READ', 'ALL_WRITE', 'COLLECTOR_EXEC', 'ESCALATION_OVERRIDE'],
          },
          [ROLES.DM]: {
            name: 'Priyanka Sharma (DM)',
            districtId: 'nalanda',
            jurisdiction: { district: 'Nalanda' },
            permissions: ['ALL_READ', 'APPROVAL_WRITE', 'DIRECTIVE_TASK'],
          },
          [ROLES.ADM]: {
            name: 'Rajeshwar Prasad (ADM)',
            districtId: 'nalanda',
            jurisdiction: { district: 'Nalanda' },
            permissions: ['ALL_READ', 'DELEGATED_APPROVAL'],
          },
          [ROLES.DEPT_HEAD]: {
            name: 'Eng. Vijay Kumar (Dept Head)',
            districtId: 'nalanda',
            departmentId: DEPARTMENTS[0].id,
            jurisdiction: { department: 'Water & Sanitation' },
            permissions: ['DEPT_READ', 'DEPT_WRITE', 'ASSIGN_OFFICER'],
          },
          [ROLES.DEPT_OFFICER]: {
            name: 'Anil Mehta (Officer)',
            districtId: 'nalanda',
            departmentId: DEPARTMENTS[0].id,
            jurisdiction: { block: 'Silao' },
            permissions: ['DEPT_READ', 'COMPLAINT_PROCESS', 'SCHEDULE_INSPECTION'],
          },
          [ROLES.ENGINEER]: {
            name: 'Ravi Prakash (Assistant Engineer)',
            districtId: 'nalanda',
            departmentId: DEPARTMENTS[0].id,
            jurisdiction: { block: 'Silao' },
            permissions: ['ENGINEER_READ', 'WORK_EXECUTE', 'INSPECTION_WRITE'],
          },
          [ROLES.FIELD_INSPECTOR]: {
            name: 'Manoj Singh (Field Inspector)',
            districtId: 'nalanda',
            departmentId: DEPARTMENTS[0].id,
            jurisdiction: { block: 'Silao', village: 'Rajgir' },
            permissions: ['FIELD_READ', 'EVIDENCE_UPLOAD', 'GEO_VERIFY'],
          },
          [ROLES.SUPERVISOR]: {
            name: 'Kavita Kumari (Field Supervisor)',
            districtId: 'nalanda',
            departmentId: DEPARTMENTS[0].id,
            jurisdiction: { block: 'Silao' },
            permissions: ['FIELD_SUPERVISE', 'EVIDENCE_VERIFY'],
          },
          [ROLES.STATE_ADMIN]: {
            name: 'Sanjeev Nayan (State Admin)',
            districtId: 'nalanda',
            jurisdiction: { state: 'Bihar' },
            permissions: ['STATE_READ', 'CROSS_DISTRICT_ANALYTICS'],
          },
          [ROLES.SYSTEM_ADMIN]: {
            name: 'Admin System Control',
            districtId: 'nalanda',
            jurisdiction: { system: 'Global' },
            permissions: ['SYSADMIN', 'AUDIT_FULL', 'SCHEMA_CONFIG'],
          },
        }

        const base = rolePresets[role] || { name: 'Guest User', districtId: 'nalanda' }
        const userObj = { role, ...base, ...extra }
        userObj.token = generateMockJwt(role, userObj)

        set({ user: userObj })
        return ROLE_PORTAL[role] || 'citizen'
      },

      hasPermission(permission) {
        const user = get().user
        if (!user) return false
        if (user.permissions?.includes('SYSADMIN') || user.permissions?.includes('ALL_READ')) return true
        return user.permissions?.includes(permission)
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
    { name: 'ndisp-auth-v2' }
  )
)

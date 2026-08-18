// Master data store — Departments, Districts, Financial Years, Budget Heads,
// Schemes. BACKEND-INTEGRATED: departments (GET /api/departments/), schemes
// (GET/POST/PATCH /api/schemes/) and users (GET/POST/PATCH /api/users/) are
// hydrated from the live backend; mutations write through the same APIs.
// Districts, financial years and budget heads are configuration constants —
// no backend endpoint is documented for them (BACKEND GAP for CRUD).
import { create } from 'zustand'
import { FINANCIAL_YEARS as FY_SEED, BUDGET_HEADS } from '../../../config/stateConstants'
import { SEED_DISTRICTS } from './seed/stateSeedData'
import { backendDepartmentApi } from '../../../api/departmentApi'
import { backendBudgetApi } from '../../../api/budgetApi'
import { backendUserApi } from '../../../api/userApi'
import { BackendCapabilityError } from '../../../api/apiClient'

const mapDepartment = (dto) => ({
  id: String(dto.id),
  code: dto.raw?.code || String(dto.id).toUpperCase().slice(0, 4),
  name: dto.name || 'Unnamed department',
  type: dto.raw?.type || 'department',
  status: dto.raw?.status || 'active',
  head: dto.raw?.head || '',
  contact: dto.raw?.contact || '',
  phone: dto.raw?.phone || '',
  address: dto.raw?.address || '',
  parentId: dto.raw?.parent_id ?? null,
  raw: dto.raw || dto,
})

const mapScheme = (dto) => ({
  id: String(dto.id),
  code: dto.raw?.code || String(dto.id).toUpperCase().slice(0, 6),
  name: dto.schemeName || dto.raw?.name || 'Unnamed scheme',
  departmentId: dto.departmentId,
  departmentName: dto.departmentName || '',
  type: dto.raw?.type || 'state_scheme',
  fundingSource: dto.raw?.funding_source || 'state_budget',
  budgetHeadId: dto.head || 'bh-continuing',
  fy: dto.financialYear || '',
  status: dto.status || 'active',
  guidelines: dto.raw?.guidelines || '',
  eligibility: dto.raw?.eligibility || '',
  targetDistrictIds: dto.raw?.target_district_ids || null,
  raw: dto.raw || dto,
})

const mapUser = (dto) => ({
  id: String(dto.id),
  name: dto.fullName || dto.username || 'Unnamed user',
  username: dto.username || '',
  email: dto.email || '',
  role: dto.role || '',
  designation: dto.designation || '',
  departmentId: dto.departmentId ?? null,
  departmentName: dto.departmentName || '',
  districtId: dto.districtId ?? null,
  districtName: dto.districtName || '',
  status: dto.isActive ? 'active' : 'inactive',
  raw: dto.raw || dto,
})

export const useStateMasterStore = create((set, get) => ({
  departments: [],
  districts: SEED_DISTRICTS,
  schemes: [],
  schemeCategories: [],
  financialYears: FY_SEED,
  budgetHeads: BUDGET_HEADS,
  users: [],
  roles: [],
  lastAction: null,
  hydrationError: null,

  async hydrateFromBackend() {
    try {
      const [departments, schemes, users] = await Promise.all([
        backendDepartmentApi.list().catch(() => []),
        backendBudgetApi.schemes.list().catch(() => []),
        backendUserApi.list().catch(() => []),
      ])
      set({
        departments: departments.map(mapDepartment),
        schemes: schemes.map(mapScheme),
        users: users.map(mapUser),
        hydrationError: null,
      })
    } catch (error) {
      set({ hydrationError: error })
    }
  },

  setBudgetHeads(heads) { set({ budgetHeads: heads }) },
  setUsers(users) { set({ users }) },
  setRoles(roles) { set({ roles }) },

  // Department CRUD — only GET /api/departments/ is documented (BACKEND GAP).
  async addDepartment() { throw new BackendCapabilityError('department master CRUD') },
  async updateDepartment() { throw new BackendCapabilityError('department master CRUD') },
  async toggleDepartmentStatus() { throw new BackendCapabilityError('department master CRUD') },

  // District CRUD — no backend endpoint is documented (BACKEND GAP).
  async addDistrict() { throw new BackendCapabilityError('district master CRUD') },
  async updateDistrict() { throw new BackendCapabilityError('district master CRUD') },

  // Scheme CRUD — backend /api/schemes/.
  async addScheme(scheme) {
    if (get().schemes.some((s) => s.id === String(scheme.id) || s.code === scheme.code)) throw new Error('Scheme ID or code already exists in the master.')
    const record = await backendBudgetApi.schemes.create({
      name: scheme.name,
      code: scheme.code,
      department: scheme.departmentId,
      type: scheme.type,
      funding_source: scheme.fundingSource,
      budget_head: scheme.budgetHeadId,
      financial_year: scheme.fy,
      status: scheme.status || 'active',
      guidelines: scheme.guidelines || '',
      eligibility: scheme.eligibility || '',
      target_district_ids: scheme.targetDistrictIds || null,
    })
    await get().hydrateFromBackend()
    return record
  },
  async updateScheme(id, updates) {
    const record = await backendBudgetApi.schemes.update(id, {
      name: updates.name,
      status: updates.status,
      guidelines: updates.guidelines,
      eligibility: updates.eligibility,
    })
    await get().hydrateFromBackend()
    return record
  },

  addFinancialYear(fy) {
    if (get().financialYears.some((f) => f.code === fy.code)) throw new Error('Financial year already exists.')
    set((s) => ({ financialYears: [...s.financialYears, fy] }))
  },

  addBudgetHead(head) {
    if (get().budgetHeads.some((h) => h.id === head.id)) throw new Error('Budget head already exists.')
    set((s) => ({ budgetHeads: [...s.budgetHeads, head] }))
  },

  reset() { set({ departments: [], districts: SEED_DISTRICTS, schemes: [], schemeCategories: [], financialYears: FY_SEED, budgetHeads: BUDGET_HEADS, users: [], roles: [] }) },
}))

export const masterDataSelectors = {
  departmentsByFY: () => (state) => state.departments,
  districtById: (id) => (state) => state.districts.find((d) => d.id === id),
  departmentById: (id) => (state) => state.departments.find((d) => d.id === id),
  schemeById: (id) => (state) => state.schemes.find((s) => s.id === id),
  schemesByDepartment: (departmentId) => (state) => state.schemes.filter((s) => s.departmentId === departmentId),
}

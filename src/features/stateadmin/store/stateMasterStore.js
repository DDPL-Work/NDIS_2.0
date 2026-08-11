// Master data store — Departments, Districts, Financial Years, Budget Heads,
// Schemes. All configurable by State Admin; nothing is hard-coded.
import { create } from 'zustand'
import { FINANCIAL_YEARS as FY_SEED, BUDGET_HEADS } from '../../../config/stateConstants'
import {
  SEED_DEPARTMENTS, SEED_DISTRICTS, SEED_SCHEMES, SEED_SCHEME_CATEGORIES, SEED_USERS,
} from './seed/stateSeedData'

export const useStateMasterStore = create((set, get) => ({
  departments: SEED_DEPARTMENTS,
  districts: SEED_DISTRICTS,
  schemes: SEED_SCHEMES,
  schemeCategories: SEED_SCHEME_CATEGORIES,
  financialYears: FY_SEED,
  budgetHeads: BUDGET_HEADS,
  users: SEED_USERS,
  roles: [],
  lastAction: null,

  setBudgetHeads(heads) { set({ budgetHeads: heads }) },
  setUsers(users) { set({ users }) },
  setRoles(roles) { set({ roles }) },

  addDepartment(department) {
    const exists = get().departments.some((d) => d.id === department.id || d.code === department.code)
    if (exists) throw new Error('Department ID or code already exists in the master.')
    set((s) => ({ departments: [...s.departments, department], lastAction: `created ${department.id}` }))
  },
  updateDepartment(id, updates) {
    set((s) => ({ departments: s.departments.map((d) => (d.id === id ? { ...d, ...updates } : d)) }))
  },
  toggleDepartmentStatus(id) {
    set((s) => ({ departments: s.departments.map((d) => (d.id === id ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' } : d)) }))
  },

  addDistrict(district) {
    const exists = get().districts.some((d) => d.id === district.id || d.code === district.code)
    if (exists) throw new Error('District ID or code already exists in the master.')
    set((s) => ({ districts: [...s.districts, district] }))
  },
  updateDistrict(id, updates) {
    set((s) => ({ districts: s.districts.map((d) => (d.id === id ? { ...d, ...updates } : d)) }))
  },

  addScheme(scheme) {
    const exists = get().schemes.some((s) => s.id === scheme.id || s.code === scheme.code)
    if (exists) throw new Error('Scheme ID or code already exists in the master.')
    set((s) => ({ schemes: [...s.schemes, scheme] }))
  },
  updateScheme(id, updates) {
    set((s) => ({ schemes: s.schemes.map((x) => (x.id === id ? { ...x, ...updates } : x)) }))
  },

  addFinancialYear(fy) {
    if (get().financialYears.some((f) => f.code === fy.code)) throw new Error('Financial year already exists.')
    set((s) => ({ financialYears: [...s.financialYears, fy] }))
  },

  addBudgetHead(head) {
    if (get().budgetHeads.some((h) => h.id === head.id)) throw new Error('Budget head already exists.')
    set((s) => ({ budgetHeads: [...s.budgetHeads, head] }))
  },

  reset() { set({ departments: SEED_DEPARTMENTS, districts: SEED_DISTRICTS, schemes: SEED_SCHEMES, schemeCategories: SEED_SCHEME_CATEGORIES, financialYears: FY_SEED, budgetHeads: [], users: [], roles: [] }) },
}))

export const masterDataSelectors = {
  departmentsByFY: () => (state) => state.departments,
  districtById: (id) => (state) => state.districts.find((d) => d.id === id),
  departmentById: (id) => (state) => state.departments.find((d) => d.id === id),
  schemeById: (id) => (state) => state.schemes.find((s) => s.id === id),
  schemesByDepartment: (departmentId) => (state) => state.schemes.filter((s) => s.departmentId === departmentId),
}
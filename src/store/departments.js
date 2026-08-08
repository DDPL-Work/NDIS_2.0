import { create } from 'zustand'
import { backendDepartmentApi } from '../api/departmentApi'

export const useDepartmentStore = create((set, get) => ({
  departments: [], selectedDepartments: [], loading: false, error: null, loaded: false,
  async load() {
    if (get().loading || get().loaded) return
    set({ loading: true, error: null })
    try { set({ departments: await backendDepartmentApi.list(), loaded: true, loading: false }) }
    catch (error) { set({ error, loading: false }) }
  },
  retry() { set({ loaded: false }); return get().load() },
  toggle(id) { set((state) => ({ selectedDepartments: state.selectedDepartments.includes(String(id)) ? state.selectedDepartments.filter((item) => item !== String(id)) : [...state.selectedDepartments, String(id)] })) },
  clearSelection() { set({ selectedDepartments: [] }) },
}))

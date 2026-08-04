import { createContext, useContext } from 'react'

export const DepartmentContext = createContext(null)

export function useDepartment() {
  const ctx = useContext(DepartmentContext)
  if (!ctx) {
    throw new Error('useDepartment must be used within a DepartmentWorkspaceProvider.')
  }
  return ctx
}

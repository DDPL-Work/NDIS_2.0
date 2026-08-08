import { useAsync } from './useAsync'
import { DepartmentRepository } from '../gis/repositories/DepartmentRepository'

const departmentSlug = (value) => String(value || '').toLowerCase().replace(/\s+(department|&)/g, '').replace(/[^a-z]/g, '')

// Build a lookup keyed by backend id AND name-slug so consumers that still
// carry legacy slug ids (e.g. facilities) resolve to the same department.
export function departmentMapFrom(departments = []) {
  return Object.fromEntries(departments.flatMap((d) => [
    [String(d.id), d],
    [departmentSlug(d.name), d],
  ]))
}

export function useDepartments() {
  return useAsync(() => DepartmentRepository.list(), [])
}

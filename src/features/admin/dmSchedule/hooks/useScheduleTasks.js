import { useMemo } from 'react'
import { useInspectionSchedules } from './useInspectionSchedules'
import { useInterventionProposals } from './useInterventionProposals'
import { useAuthStore } from '../../../../app/store/authStore'
import { buildScheduleTask, computeKpis } from '../utils/taskNormalizer'
import { FILTER_PRESETS } from '../constants'

export function useScheduleTasks() {
  const districtId = useAuthStore((s) => s.user?.districtId)

  const filters = useMemo(() => (districtId ? { district: districtId } : {}), [districtId])

  const inspectionsQuery = useInspectionSchedules(filters)
  const interventionsQuery = useInterventionProposals(filters)

  const loading = inspectionsQuery.isLoading || interventionsQuery.isLoading
  const isFetching = inspectionsQuery.isFetching || interventionsQuery.isFetching

  // Error isolation — one failed endpoint must not destroy the entire task list
  const errors = []
  if (inspectionsQuery.error) errors.push(inspectionsQuery.error)
  if (interventionsQuery.error) errors.push(interventionsQuery.error)

  const tasks = useMemo(() => {
    if (loading) return []

    // Use whatever data succeeded — do not require both to succeed
    const rawInspections = inspectionsQuery.data || []
    const rawInterventions = interventionsQuery.data || []

    return buildScheduleTask({
      interventions: rawInterventions,
      inspections: rawInspections,
      escalations: [],
    })
  }, [loading, inspectionsQuery.data, interventionsQuery.data])

  const kpis = useMemo(() => computeKpis(tasks), [tasks])

  return {
    tasks,
    kpis,
    loading,
    isFetching,
    errors,
    error: errors.length > 0 ? errors[0] : null,
    refetch: () => {
      inspectionsQuery.refetch()
      interventionsQuery.refetch()
    },
    inspections: inspectionsQuery.data || [],
    interventions: interventionsQuery.data || [],
  }
}

export function useFilteredTasks(tasks, { filterPreset, typeFilter, statusFilter, priorityFilter, searchQuery }) {
  return useMemo(() => {
    let result = [...tasks]

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (filterPreset === FILTER_PRESETS.TODAY) {
      result = result.filter((t) => t.dueDate && t.dueDate.split('T')[0] === today)
    } else if (filterPreset === FILTER_PRESETS.THIS_WEEK) {
      result = result.filter((t) => t.dueDate && t.dueDate.split('T')[0] <= weekEnd)
    } else if (filterPreset === FILTER_PRESETS.OVERDUE) {
      result = result.filter((t) => t.isOverdue)
    }

    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.facilityName && t.facilityName.toLowerCase().includes(q)) ||
          (t.department && t.department.toLowerCase().includes(q)) ||
          (t.departmentName && t.departmentName.toLowerCase().includes(q)) ||
          (t.departmentCode && t.departmentCode.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q)) ||
          (t.locationName && t.locationName.toLowerCase().includes(q)) ||
          (t.districtName && t.districtName.toLowerCase().includes(q)) ||
          (t.blockName && t.blockName.toLowerCase().includes(q)) ||
          (t.sourceId && t.sourceId.includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      )
    }

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    result.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      const pa = priorityOrder[a.priority] ?? 2
      const pb = priorityOrder[b.priority] ?? 2
      if (pa !== pb) return pa - pb
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })

    return result
  }, [tasks, filterPreset, typeFilter, statusFilter, priorityFilter, searchQuery])
}

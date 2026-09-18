// DM Schedule & Tasks — data fetching hook.
// Provides executive-level task groups, KPIs, and filtering.

import { useState, useMemo, useCallback } from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { useDataVersion, DATA_SCOPES } from '../../../app/store/dataVersionStore'
import { useAuthStore } from '../../../app/store/authStore'
import { fetchAllTasks } from './dmScheduleService'
import { computeTaskKpis, groupTasksForDmView } from './dmScheduleMapper'
import { TASK_STATUSES, FILTER_PRESETS } from './constants'

export function useDmSchedule() {
  const districtId = useAuthStore((s) => s.user?.districtId)
  const interventionsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.INTERVENTIONS] || 0)
  const inspectionsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.INSPECTIONS] || 0)
  const proposalsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.PROPOSALS] || 0)
  const complaintsVersion = useDataVersion((s) => s.versions[DATA_SCOPES.COMPLAINTS] || 0)

  const fetchTasks = useCallback(() => fetchAllTasks(districtId), [districtId])

  const { data: tasks, loading, error, refetch } = useAsync(fetchTasks, [
    interventionsVersion,
    inspectionsVersion,
    proposalsVersion,
    complaintsVersion,
    districtId,
  ])

  // Filters
  const [filterPreset, setFilterPreset] = useState(FILTER_PRESETS.ALL)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return []

    let result = [...tasks]

    // Preset filters
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (filterPreset === FILTER_PRESETS.TODAY) {
      result = result.filter((t) => t.dueDate && t.dueDate.split('T')[0] === today)
    } else if (filterPreset === FILTER_PRESETS.THIS_WEEK) {
      result = result.filter((t) => t.dueDate && t.dueDate.split('T')[0] <= weekEnd)
    } else if (filterPreset === FILTER_PRESETS.OVERDUE) {
      result = result.filter((t) => t.status === TASK_STATUSES.OVERDUE)
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => t.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.facilityName.toLowerCase().includes(q) ||
          t.departmentName.toLowerCase().includes(q) ||
          (t.village && t.village.toLowerCase().includes(q)) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Sort: overdue first, then by priority, then by due date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    result.sort((a, b) => {
      if (a.status === TASK_STATUSES.OVERDUE && b.status !== TASK_STATUSES.OVERDUE) return -1
      if (b.status === TASK_STATUSES.OVERDUE && a.status !== TASK_STATUSES.OVERDUE) return 1
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

  // Executive groups
  const groups = useMemo(() => groupTasksForDmView(filteredTasks), [filteredTasks])

  // KPIs
  const kpis = useMemo(() => computeTaskKpis(tasks || []), [tasks])

  const resetFilters = useCallback(() => {
    setFilterPreset(FILTER_PRESETS.ALL)
    setTypeFilter('all')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSearchQuery('')
  }, [])

  return {
    tasks: filteredTasks,
    allTasks: tasks || [],
    groups,
    kpis,
    loading,
    error,
    refetch,
    filters: { filterPreset, typeFilter, statusFilter, priorityFilter, searchQuery },
    setFilterPreset,
    setTypeFilter,
    setStatusFilter,
    setPriorityFilter,
    setSearchQuery,
    resetFilters,
  }
}

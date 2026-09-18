// Centralized query keys for TanStack Query.
// All consumers reference these instead of hardcoding arrays.

export const inspectionKeys = {
  all: ['inspections'],
  list: (filters) => ['inspections', 'list', filters],
  detail: (id) => ['inspections', 'detail', id],
}

export const interventionKeys = {
  all: ['interventions'],
  list: (filters) => ['interventions', 'list', filters],
  detail: (id) => ['interventions', 'detail', id],
}

export const complaintKeys = {
  all: ['complaints'],
  list: (filters) => ['complaints', 'list', filters],
  detail: (id) => ['complaints', 'detail', id],
  timeline: (id) => ['complaints', 'timeline', id],
}

export const scheduleTaskKeys = {
  all: ['scheduleTasks'],
  combined: (filters) => ['scheduleTasks', 'combined', filters],
}

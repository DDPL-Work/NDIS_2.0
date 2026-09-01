// Facility action workflow constants Ã¢â‚¬â€ configurable, facility-type agnostic.
// No hardcoded facility-specific logic. Labels adapt to actual backend data.

export const ACTION_TYPES = {
  PROPOSE: 'propose',
  INSPECT: 'inspect',
  ESCALATE: 'escalate',
}

export const ACTION_LABELS = {
  [ACTION_TYPES.PROPOSE]: 'Propose Intervention',
  [ACTION_TYPES.INSPECT]: 'Schedule Inspection',
  [ACTION_TYPES.ESCALATE]: 'Escalate Issue',
}

export const ACTION_DESCRIPTIONS = {
  [ACTION_TYPES.PROPOSE]: 'Create a plan to address this facility\'s identified gap.',
  [ACTION_TYPES.INSPECT]: 'Ask a field team to verify the situation on the ground.',
  [ACTION_TYPES.ESCALATE]: 'Send this issue to district administration for attention.',
}

export const INTERVENTION_CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure improvement' },
  { value: 'staffing', label: 'Additional staff' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'maintenance', label: 'Repair / maintenance' },
  { value: 'expansion', label: 'New facility / expansion' },
  { value: 'service', label: 'Service improvement' },
  { value: 'connectivity', label: 'Connectivity / accessibility' },
  { value: 'safety', label: 'Safety / hazard mitigation' },
  { value: 'other', label: 'Other' },
]

export const TIMELINE_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
]

export const PRIORITY_BAND_LABELS = {
  P1: 'Critical',
  P2: 'High',
  P3: 'Medium',
  P4: 'Low',
}

export const PRIORITY_BAND_TONES = {
  P1: 'negative',
  P2: 'warning',
  P3: 'info',
  P4: 'neutral',
}

// Error messages mapped to user-friendly text
export const ERROR_MESSAGES = {
  400: 'Please complete the required information before continuing.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong while submitting this request. Please try again.',
  NETWORK: 'Unable to connect to the server. Please check your connection and try again.',
  DEFAULT: 'An unexpected error occurred. Please try again.',
}

// Feedback system constants and type definitions

export const FEEDBACK_RESPONSE_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  RATING: 'rating',
  TEXT: 'text',
}

export const RESPONSE_TYPE_LABELS = {
  [FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE]: 'Single Choice',
  [FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [FEEDBACK_RESPONSE_TYPES.RATING]: 'Rating (1-5)',
  [FEEDBACK_RESPONSE_TYPES.TEXT]: 'Free Text',
}

export const RESPONSE_TYPE_ICONS = {
  [FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE]: 'Circle',
  [FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE]: 'CheckSquare',
  [FEEDBACK_RESPONSE_TYPES.RATING]: 'Star',
  [FEEDBACK_RESPONSE_TYPES.TEXT]: 'Type',
}

export const FEEDBACK_LOCATION_LEVELS = {
  DISTRICT: 'district',
  BLOCK: 'block',
  VILLAGE: 'village',
  FACILITY: 'facility',
}

export const FEEDBACK_AGGREGATION_GRANULARITY = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
}

// Helper to validate response based on type
export function validateResponse(responseType, value, options = []) {
  switch (responseType) {
    case FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE:
      return options.some((o) => o.value === value) ? null : 'Invalid option selected'
    case FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE: {
      if (!Array.isArray(value)) return 'Expected array of values'
      const invalid = value.find((v) => !options.some((o) => o.value === v))
      return invalid ? `Invalid option: ${invalid}` : null
    }
    case FEEDBACK_RESPONSE_TYPES.RATING: {
      const num = Number(value)
      return Number.isInteger(num) && num >= 1 && num <= 5 ? null : 'Rating must be 1-5'
    }
    case FEEDBACK_RESPONSE_TYPES.TEXT:
      return typeof value === 'string' ? null : 'Expected text value'
    default:
      return 'Unknown response type'
  }
}

// Helper to format response for display
export function formatResponse(responseType, value, options = []) {
  if (value === null || value === undefined) return '—'
  switch (responseType) {
    case FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE: {
      const opt = options.find((o) => o.value === value)
      return opt ? opt.label : value
    }
    case FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE: {
      if (!Array.isArray(value)) return '—'
      return value.map((v) => {
        const o = options.find((opt) => opt.value === v)
        return o ? o.label : v
      }).join(', ')
    }
    case FEEDBACK_RESPONSE_TYPES.RATING:
      return '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value))
    case FEEDBACK_RESPONSE_TYPES.TEXT:
      return value
    default:
      return String(value)
  }
}

// Get question set for a specific facility/service
export function getQuestionSetForContext(questionSets, context) {
  // context: { departmentId, serviceType, locationType, facilityId }
  if (!questionSets?.length) return null
  return questionSets.find((qs) => {
    if (context.departmentId && qs.departmentId !== context.departmentId) return false
    if (context.serviceType && qs.serviceType !== context.serviceType) return false
    if (context.locationType && qs.locationType !== context.locationType) return false
    if (qs.activeFrom && new Date(qs.activeFrom) > new Date()) return false
    if (qs.activeTo && new Date(qs.activeTo) < new Date()) return false
    return true
  }) || null
}
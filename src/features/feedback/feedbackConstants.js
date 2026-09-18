// Feedback system constants and type definitions

// Frontend canonical response types (lowercase)
export const FEEDBACK_RESPONSE_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  RATING: 'rating',
  RATING_5: 'rating_5',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  YES_NO: 'yes_no',
  NUMBER: 'number',
}

// Map backend uppercase response_type values to frontend canonical types
const BACKEND_TYPE_MAP = {
  SINGLE_CHOICE: FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE,
  MULTIPLE_CHOICE: FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE,
  RATING: FEEDBACK_RESPONSE_TYPES.RATING,
  RATING_5: FEEDBACK_RESPONSE_TYPES.RATING_5,
  TEXT: FEEDBACK_RESPONSE_TYPES.TEXT,
  TEXTAREA: FEEDBACK_RESPONSE_TYPES.TEXTAREA,
  YES_NO: FEEDBACK_RESPONSE_TYPES.YES_NO,
  NUMBER: FEEDBACK_RESPONSE_TYPES.NUMBER,
}

/**
 * Normalize a backend response_type string to the frontend canonical type.
 * Handles: "RATING_5", "rating_5", "SINGLE_CHOICE", "single_choice", etc.
 */
export function normalizeResponseType(raw) {
  if (!raw) return FEEDBACK_RESPONSE_TYPES.TEXT
  const upper = String(raw).toUpperCase()
  if (BACKEND_TYPE_MAP[upper]) return BACKEND_TYPE_MAP[upper]
  // If not in the map, check if the lowercase version is already a canonical type
  const lower = String(raw).toLowerCase()
  if (Object.values(FEEDBACK_RESPONSE_TYPES).includes(lower)) return lower
  if (import.meta.env?.DEV) console.warn('[NDISP Feedback] Unknown response_type:', raw)
  return FEEDBACK_RESPONSE_TYPES.TEXT
}

export const RESPONSE_TYPE_LABELS = {
  [FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE]: 'Single Choice',
  [FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice',
  [FEEDBACK_RESPONSE_TYPES.RATING]: 'Rating (1-5)',
  [FEEDBACK_RESPONSE_TYPES.RATING_5]: 'Rating (1-5)',
  [FEEDBACK_RESPONSE_TYPES.TEXT]: 'Free Text',
  [FEEDBACK_RESPONSE_TYPES.TEXTAREA]: 'Free Text',
  [FEEDBACK_RESPONSE_TYPES.YES_NO]: 'Yes / No',
  [FEEDBACK_RESPONSE_TYPES.NUMBER]: 'Number',
}

export const RESPONSE_TYPE_ICONS = {
  [FEEDBACK_RESPONSE_TYPES.SINGLE_CHOICE]: 'Circle',
  [FEEDBACK_RESPONSE_TYPES.MULTIPLE_CHOICE]: 'CheckSquare',
  [FEEDBACK_RESPONSE_TYPES.RATING]: 'Star',
  [FEEDBACK_RESPONSE_TYPES.RATING_5]: 'Star',
  [FEEDBACK_RESPONSE_TYPES.TEXT]: 'Type',
  [FEEDBACK_RESPONSE_TYPES.TEXTAREA]: 'Type',
  [FEEDBACK_RESPONSE_TYPES.YES_NO]: 'Circle',
  [FEEDBACK_RESPONSE_TYPES.NUMBER]: 'Hash',
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
    case FEEDBACK_RESPONSE_TYPES.RATING:
    case FEEDBACK_RESPONSE_TYPES.RATING_5: {
      const num = Number(value)
      return Number.isInteger(num) && num >= 1 && num <= 5 ? null : 'Rating must be 1-5'
    }
    case FEEDBACK_RESPONSE_TYPES.YES_NO:
      return value === 'YES' || value === 'NO' ? null : 'Please select Yes or No'
    case FEEDBACK_RESPONSE_TYPES.TEXT:
    case FEEDBACK_RESPONSE_TYPES.TEXTAREA:
      return typeof value === 'string' ? null : 'Expected text value'
    case FEEDBACK_RESPONSE_TYPES.NUMBER: {
      const n = Number(value)
      return Number.isFinite(n) ? null : 'Expected a valid number'
    }
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
    case FEEDBACK_RESPONSE_TYPES.RATING_5:
      return '★'.repeat(Number(value)) + '☆'.repeat(5 - Number(value))
    case FEEDBACK_RESPONSE_TYPES.YES_NO:
      return value === 'YES' ? 'Yes' : value === 'NO' ? 'No' : value
    case FEEDBACK_RESPONSE_TYPES.NUMBER:
      return String(value)
    case FEEDBACK_RESPONSE_TYPES.TEXT:
    case FEEDBACK_RESPONSE_TYPES.TEXTAREA:
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
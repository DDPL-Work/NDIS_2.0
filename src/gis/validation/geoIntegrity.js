import { distanceMeters } from '../../utils/geo'

export const WGS84 = 'WGS84 / EPSG:4326'
export const DUPLICATE_RADIUS_M = 25
export const VERIFICATION_STATES = Object.freeze({
  VERIFIED: 'VERIFIED',
  NOT_VERIFIED: 'NOT_VERIFIED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  REJECTED: 'REJECTED',
  PENDING: 'PENDING',
})

export const DISTRICT_VALIDATION_STATES = Object.freeze({
  VALID: 'VALID',
  OUTSIDE_DISTRICT: 'OUTSIDE_DISTRICT',
  VALIDATION_UNAVAILABLE: 'VALIDATION_UNAVAILABLE',
  PENDING: 'PENDING',
})

export function validateWgs84Coordinates({ latitude, longitude } = {}) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  const errors = {}
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.latitude = 'Latitude must be a number from -90 to 90.'
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.longitude = 'Longitude must be a number from -180 to 180.'
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    // The application contract is always [longitude, latitude].
    position: Object.keys(errors).length === 0 ? [lng, lat] : null,
    referenceSystem: WGS84,
  }
}

export function findPossibleDuplicates(position, records = [], radiusM = DUPLICATE_RADIUS_M) {
  if (!Array.isArray(position) || position.length < 2) return []
  return records
    .map((record) => {
      const candidate = record.position || (Number.isFinite(Number(record.lng)) && Number.isFinite(Number(record.lat))
        ? [Number(record.lng), Number(record.lat)]
        : (Number.isFinite(Number(record.longitude)) && Number.isFinite(Number(record.latitude))
          ? [Number(record.longitude), Number(record.latitude)]
          : null))
      if (!candidate) return null
      const distanceM = distanceMeters(position, candidate)
      return distanceM <= radiusM ? { record, position: candidate, distanceM } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceM - b.distanceM)
}

export function verificationState(value) {
  return Object.values(VERIFICATION_STATES).includes(value) ? value : VERIFICATION_STATES.PENDING
}

// A distance can inform review, but it must never produce VERIFIED in the UI.
export function photoReviewHint({ photoGps, submittedPin, toleranceM = 25 } = {}) {
  if (!photoGps) return { distanceM: null, suggestedState: VERIFICATION_STATES.NOT_VERIFIED }
  if (!submittedPin) return { distanceM: null, suggestedState: VERIFICATION_STATES.REVIEW_REQUIRED }
  const distanceM = distanceMeters(photoGps, submittedPin)
  return {
    distanceM,
    suggestedState: distanceM > toleranceM ? VERIFICATION_STATES.REVIEW_REQUIRED : VERIFICATION_STATES.PENDING,
  }
}

export function validateImportRows(rows = [], mapping = {}) {
  const summary = { valid: 0, invalidCoordinates: 0, outsideBoundary: 0, duplicates: 0, missingRequiredFields: 0, rows: [] }
  rows.forEach((row, index) => {
    const get = (key) => Array.isArray(row) ? row[mapping[key]] : row?.[mapping[key] || key]
    const missing = ['facility_name', 'category', 'latitude', 'longitude'].filter((key) => !String(get(key) ?? '').trim())
    const coordinate = validateWgs84Coordinates({ latitude: get('latitude'), longitude: get('longitude') })
    const result = { row: index + 2, missing, coordinate, districtStatus: DISTRICT_VALIDATION_STATES.PENDING }
    if (missing.length) summary.missingRequiredFields += 1
    if (!coordinate.valid) summary.invalidCoordinates += 1
    if (!missing.length && coordinate.valid) summary.valid += 1
    summary.rows.push(result)
  })
  return summary
}

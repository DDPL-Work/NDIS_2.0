import { makeRng, randInt } from '../../utils/random'

// LLD Vol 2 Ch 11 — Ingestion Contract: schema validation, geocoding, quarantine
// of rejected rows with reason codes. This mock simulates the pipeline's report
// without actually parsing a file, since the pilot ingestion is a batch CSV load.
const REASON_CODES = [
  'MISSING_MANDATORY_FIELD: facility_name',
  'GEOCODE_FAILED: address not resolvable to coordinates',
  'DUPLICATE_RECORD: matches existing facility_id',
  'INVALID_CATEGORY: category not in mst_asset_category',
  'GEO_TAG_VARIANCE_EXCEEDED: claimed location > 200m from EXIF GPS',
]

export function simulateCsvIngestion(fileName, departmentId) {
  const rng = makeRng(`${fileName}-${Date.now()}`)
  const totalRows = randInt(rng, 40, 320)
  const rejected = randInt(rng, 0, Math.round(totalRows * 0.12))
  const accepted = totalRows - rejected
  const rejectedRows = Array.from({ length: Math.min(rejected, 8) }, (_, i) => ({
    row: randInt(rng, 2, totalRows),
    reason: REASON_CODES[randInt(rng, 0, REASON_CODES.length - 1)],
  }))
  return {
    batchId: `BATCH-${departmentId.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    fileName,
    departmentId,
    totalRows,
    accepted,
    rejected,
    geocodedPct: Math.round((accepted / totalRows) * randInt(rng, 90, 99)),
    rejectedRows,
    completedAt: new Date().toISOString(),
  }
}

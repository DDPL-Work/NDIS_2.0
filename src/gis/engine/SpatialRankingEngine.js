import { distanceMeters } from '../../utils/geo'
export function rankSpatialResults(rows, { center, intent }) {
  return rows.map((row) => {
    const position = row.position || row.location?.position || row.gps
    const distanceM = center && position ? distanceMeters(center, position) : null
    return { ...row, position, distanceM, travelMinutes: distanceM == null ? null : Math.max(1, Math.round(distanceM / 500)) }
  }).sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
    .slice(0, intent.intent === 'nearest' ? 1 : 100)
}

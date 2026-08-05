import { parseSpatialIntent } from './SpatialIntentParser'
import { distanceMeters } from '../../utils/geo'

export function executeGISQuery(query, { facilities = [], complaints = [], projects = [], center, allowedDepartments = null } = {}) {
  const intent = parseSpatialIntent(query); let rows = intent.intent === 'complaints' ? complaints : intent.intent === 'projects' ? projects : facilities
  rows = rows.filter((row) => (!intent.departmentId || row.departmentId === intent.departmentId) && (!allowedDepartments || allowedDepartments.includes(row.departmentId)) && (!intent.village || String(row.village || row.location?.village || '').toLowerCase().includes(intent.village)))
  if (intent.highPriority) rows = rows.filter((row) => ['high', 'urgent', 'critical'].includes(row.priority))
  const results = rows.map((row) => { const position = row.position || row.location?.position || row.gps; const distanceM = center && position ? distanceMeters(center, position) : null; return { ...row, position, distanceM, travelMinutes: distanceM ? Math.max(1, Math.round(distanceM / 500)) : null } }).filter((row) => !intent.radiusKm || row.distanceM === null || row.distanceM <= intent.radiusKm * 1000).sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))
  return { intent, results: intent.intent === 'nearest' ? results.slice(0, 1) : results.slice(0, 100) }
}

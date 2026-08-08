function matchesFacility(row, intent) {
  const attrs = row.attributes || {}
  const aliases = { hospital: ['hospital'], phc: ['phc', 'primary health'], school: ['school', 'anganwadi', 'college'], water_tank: ['water_tank', 'tank', 'reservoir'], borewell: ['borewell', 'handpump'], pipeline: ['pipeline'], solar: ['solar'], tourism: ['heritage', 'museum', 'hotel', 'tourist'], road: ['road'], ambulance: ['ambulance'], shelter: ['shelter'] }
  const searchable = `${row.categoryId || ''} ${row.categoryLabel || ''} ${row.name || ''}`.toLowerCase()
  if (intent.entity && !(aliases[intent.entity] || [intent.entity]).some((alias) => searchable.includes(alias))) return false
  if (intent.oxygen && !['adequate', 'low'].includes(attrs.oxygen_supply_status)) return false
  if (intent.enrollmentBelow && !(attrs.student_count < intent.enrollmentBelow)) return false
  if (intent.capacityAboveKw && !(attrs.installed_capacity_kw > intent.capacityAboveKw)) return false
  if (intent.status && row.status !== intent.status) return false
  return true
}
export function executeSpatialQuery(intent, { facilities = [], complaints = [], projects = [], allowedLayers = null, center } = {}) {
  let source = intent.intent === 'complaints' ? complaints : intent.intent === 'projects' ? projects : facilities
  source = source.filter((row) => !allowedLayers || allowedLayers.includes(row.departmentId))
  source = source.filter((row) => !intent.departmentId || row.departmentId === intent.departmentId)
  source = source.filter((row) => !intent.location || `${row.village || ''} ${row.location?.village || ''} ${row.districtId || ''}`.toLowerCase().includes(intent.location.replace('biharsharif', 'bihar sharif')))
  source = source.filter((row) => !intent.highPriority || ['high', 'urgent', 'critical'].includes(row.priority))
  source = source.filter((row) => intent.intent === 'complaints' || intent.intent === 'projects' || matchesFacility(row, intent))
  const results = source.filter((row) => {
    const p = row.position || row.location?.position || row.gps
    if (!intent.radiusKm || !center || !p) return true
    const dx = (p[0] - center[0]) * 100, dy = (p[1] - center[1]) * 111
    return Math.sqrt(dx * dx + dy * dy) <= intent.radiusKm
  })
  return { results, total: results.length }
}

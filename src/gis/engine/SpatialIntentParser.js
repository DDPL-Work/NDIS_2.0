const DEPT_TERMS = { hospital: 'health', phc: 'health', oxygen: 'health', ambulance: 'health', school: 'education', teacher: 'education', handpump: 'water', pipeline: 'water', tank: 'water', water: 'water', solar: 'solar', battery: 'solar', tourism: 'tourism', temple: 'tourism', road: 'pwd', pothole: 'pwd', street: 'electricity', transformer: 'electricity', garbage: 'urban', drain: 'urban' }
export function parseSpatialIntent(query = '') {
  const text = query.toLowerCase(); const departmentId = Object.entries(DEPT_TERMS).find(([term]) => text.includes(term))?.[1]
  const radius = Number(text.match(/within\s+(\d+(?:\.\d+)?)\s*km/)?.[1] || text.match(/(\d+(?:\.\d+)?)\s*km/)?.[1] || 0)
  const village = ['rajgir', 'bihar sharif', 'silao', 'harnaut', 'sohsarai'].find((place) => text.includes(place))
  return { raw: query, intent: text.includes('nearest') ? 'nearest' : text.includes('within') || radius ? 'within' : text.includes('complaint') ? 'complaints' : text.includes('project') ? 'projects' : 'facilities', departmentId, radiusKm: radius, village, highPriority: text.includes('high priority') || text.includes('urgent'), needsHeatmap: text.includes('heatmap') || text.includes('density') }
}

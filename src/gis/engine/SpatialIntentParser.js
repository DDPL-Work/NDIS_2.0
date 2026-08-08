const ENTITY_TERMS = {
  hospital: ['hospital', 'district hospital'], phc: ['phc', 'primary health centre', 'primary health center'],
  school: ['school', 'anganwadi', 'college'], water_tank: ['water tank', 'tank', 'reservoir'],
  borewell: ['borewell', 'handpump', 'hand pump'], pipeline: ['pipeline', 'piped water'],
  solar: ['solar plant', 'solar park', 'solar'], tourism: ['tourist place', 'tourism', 'temple', 'museum'],
  road: ['road', 'roads'], ambulance: ['ambulance'], complaint: ['complaint', 'complaints', 'grievance'],
  project: ['project', 'projects'], officer: ['officer', 'officers'], shelter: ['flood shelter', 'shelter'],
}

const DEPARTMENT_TERMS = { health: ['hospital', 'phc', 'oxygen', 'ambulance', 'blood bank', 'doctor'], education: ['school', 'teacher', 'enrollment', 'anganwadi'], water: ['water', 'handpump', 'borewell', 'pipeline', 'tank', 'arsenic', 'fluoride'], solar: ['solar', 'battery', 'generation'], tourism: ['tourism', 'temple', 'museum', 'hotel'], electricity: ['transformer', 'street light', 'feeder'], pwd: ['road', 'bridge'], urban: ['garbage', 'drain'] }
const KNOWN_LOCATIONS = ['bihar sharif', 'biharsharif', 'rajgir', 'silao', 'harnaut', 'sohsarai', 'hilsa', 'islampur', 'nalanda']

function firstMatch(table, text) { return Object.entries(table).find(([, terms]) => terms.some((term) => text.includes(term)))?.[0] || null }
function comparison(text, words) { const match = text.match(new RegExp(`(?:${words.join('|')})\\s*(?:than|above|below|over|under)?\\s*(\\d+(?:\\.\\d+)?)`, 'i')); return match ? Number(match[1]) : null }

export function parseSpatialIntent(query = '') {
  const text = query.toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const radiusKm = Number(text.match(/(?:within|near|around)?\s*(\d+(?:\.\d+)?)\s*(?:km|kilomet(?:er|re)s?)/)?.[1] || 0)
  const entity = firstMatch(ENTITY_TERMS, text)
  const departmentId = firstMatch(DEPARTMENT_TERMS, text)
  const location = KNOWN_LOCATIONS.find((place) => text.includes(place)) || null
  const intent = text.includes('route') || text.includes('directions') ? 'route'
    : text.includes('heatmap') || text.includes('density') || text.includes('cluster') ? 'analytics'
      : entity === 'complaint' ? 'complaints' : entity === 'project' ? 'projects'
        : text.includes('nearest') || text.includes('closest') ? 'nearest' : radiusKm ? 'within' : 'search'
  const enrollmentBelow = text.match(/enrollment\s+(?:below|under|less than)\s*(\d+)/)?.[1]
  const budgetAboveCrore = text.match(/(?:costing|budget)\s+(?:above|over|more than)\s*(\d+(?:\.\d+)?)\s*crore/)?.[1]
  return {
    raw: query, normalized: text, intent, entity, departmentId, location,
    radiusKm, highPriority: /high priority|urgent|critical/.test(text),
    status: text.includes('under construction') || text.includes('ongoing') ? 'under_construction' : text.includes('delayed') ? 'delayed' : null,
    noToilets: /no toilets?|without toilets?/.test(text), noDoctor: /no doctor|without doctor/.test(text),
    oxygen: /oxygen/.test(text), enrollmentBelow: enrollmentBelow ? Number(enrollmentBelow) : null,
    capacityAboveKw: /above\s*(\d+(?:\.\d+)?)\s*mw/.test(text) ? Number(text.match(/above\s*(\d+(?:\.\d+)?)\s*mw/)?.[1]) * 1000 : null,
    budgetAbove: budgetAboveCrore ? Number(budgetAboveCrore) * 10000000 : comparison(text, ['budget', 'costing']),
    needsHeatmap: intent === 'analytics', date: text.includes('today') ? 'today' : null,
  }
}

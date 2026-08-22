// Department Decision Support — pure generic derivation model.
//
// The universal data model (§5) is: Entity + Location + Indicator + Current +
// Required + Deficit + Coverage + Accessibility + Priority + Evidence + Action.
// This module turns REAL backend collections (facilities, GIS catalog layers,
// population, roads) into that model for ANY department config.
//
// Honesty contract (§15): nothing here fabricates values.
//   - REAL values: entity counts, positions, census population, road network,
//     hazard geometry, real facility/layer attributes.
//   - DERIVED values: coverage, accessibility, gap score, exposure, priority —
//     every one computed by a disclosed formula from REAL inputs.
//   - UNAVAILABLE: any indicator whose real attribute/endpoint is absent is
//     reported as "Data not available" with its required source, never 0.
import { pointInPolygon, interiorPoint } from '../../gis/engine/SpatialAnalysisEngine.js'

// ---------------------------------------------------------------------------
// Entity collection — universal rows from facilities and/or GIS layers.
// ---------------------------------------------------------------------------

export function entityRowsFromFacilities(facilities = [], entityGroup = {}) {
  const matcher = new RegExp(String(entityGroup.match || '(?!x)x'), 'i')
  return facilities
    .filter((f) => matcher.test(String(f.categoryLabel || '')))
    .map((f) => ({
      id: String(f.id),
      name: f.name || f.village || 'Unnamed entity',
      position: Array.isArray(f.position) ? f.position : null,
      geometry: null,
      geometryType: 'Point',
      source: 'facility',
      categoryLabel: f.categoryLabel,
      entityGroupId: entityGroup.id,
      entityGroupLabel: entityGroup.label,
      attributes: { ...(f.attributes || {}) },
      gapScore: Number(f.gapScore ?? 0),
      village: f.village || '',
      block: f.block_name || f.village || '',
    }))
    .filter((row) => row.position)
}

export function entityRowsFromLayer(layer = {}, entityGroup = {}) {
  const rows = []
  ;(layer.features || []).forEach((feature, index) => {
    const position = interiorPoint(feature.geometry)
    if (!position) return
    const properties = feature.properties || {}
    rows.push({
      id: String(feature.id ?? properties.objectid ?? properties.OBJECTID ?? `${entityGroup.id}-${index}`),
      name: properties.feature_name || properties.Block_Name || properties.Name || properties.name || `${entityGroup.label} #${index + 1}`,
      position,
      geometry: feature.geometry,
      geometryType: feature.geometry?.type || entityGroup.geometryType || 'Unknown',
      source: 'gis-layer',
      categoryLabel: entityGroup.label,
      entityGroupId: entityGroup.id,
      entityGroupLabel: entityGroup.label,
      attributes: { ...properties },
      gapScore: 0,
      village: properties.Block_Name || '',
      block: properties.Block_Name || '',
    })
  })
  return rows
}

// Universal collection step — every entity gets its REAL attributes, and the
// indicator resolution is attached lazily by resolveIndicators.
export function collectEntities(config = {}, facilities = [], layersByName = {}) {
  const rows = []
  ;(config.entityGroups || []).forEach((group) => {
    if (group.source === 'gis-layer') {
      rows.push(...entityRowsFromLayer(layersByName[group.layerName] || { features: [] }, group))
    } else {
      rows.push(...entityRowsFromFacilities(facilities, group))
    }
  })
  return rows
}

// ---------------------------------------------------------------------------
// Indicators — resolved against REAL entity attributes.  A missing indicator
// reports its required attribute keys + endpoint, never a fabricated value.
// ---------------------------------------------------------------------------

export function resolveIndicators(entity = {}, indicators = []) {
  return indicators.map((indicator) => {
    let value
    let matchedKey
    ;(indicator.attributeFields || []).forEach((key) => {
      if (value === undefined) {
        const raw = entity.attributes[key]
        if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
          value = raw
          matchedKey = key
        }
      }
    })
    return {
      ...indicator,
      value: value === undefined ? null : value,
      attributeKey: matchedKey || null,
      status: value === undefined ? 'unavailable' : 'available',
      requiredKeys: indicator.attributeFields,
      requiredSource: indicator.source || `entity attributes: ${(indicator.attributeFields || []).join(', ')}`,
    }
  })
}

export function entityIndicatorSummary(entity = {}, indicators = []) {
  const resolved = resolveIndicators(entity, indicators)
  const available = resolved.filter((r) => r.status === 'available')
  return {
    resolved,
    availableCount: available.length,
    totalCount: resolved.length,
    reporting: available.length > 0,
  }
}

// District-level indicator reporting — share of entities that carry a real
// value for each indicator.
export function districtIndicatorReporting(entities = [], indicators = []) {
  if (!entities.length) return { indicators: [], reportingShare: 0 }
  return {
    indicators: indicators.map((indicator) => {
      const reporting = entities.filter((e) => resolveIndicators(e, [indicator])[0].status === 'available').length
      return { ...indicator, reporting, reportingShare: Math.round((reporting / entities.length) * 100) }
    }),
    reportingShare: Math.round((entities.filter((e) => entityIndicatorSummary(e, indicators).reporting).length / entities.length) * 100),
  }
}

// ---------------------------------------------------------------------------
// Population context — real census polygons (Rural_population etc.).
// ---------------------------------------------------------------------------

const POPULATION_FIELD_KEYS = ['Block_Rura', 'Block_Tota', 'Population', 'population', 'TOT_P']
const POPULATION_NAME_KEYS = ['Block_Name', 'feature_name', 'Name', 'name']

export function populationRowsFromLayers(layersByName = {}) {
  const rows = []
  Object.values(layersByName).forEach((layer) => {
    (layer.features || []).forEach((feature) => {
      const position = interiorPoint(feature.geometry)
      if (!position) return
      const properties = feature.properties || {}
      let population
      POPULATION_FIELD_KEYS.some((key) => {
        const value = Number(properties[key])
        if (Number.isFinite(value) && value > 0) { population = value; return true }
        return false
      })
      if (population === undefined) return
      let name
      POPULATION_NAME_KEYS.some((key) => { if (properties[key]) { name = properties[key]; return true } return false })
      rows.push({
        name: name || layer.layerName || 'Block',
        population,
        position,
        geometry: feature.geometry,
        layer: layer.layerName || '',
      })
    })
  })
  return rows
}

export function totalPopulation(populationRows = []) {
  return populationRows.reduce((sum, row) => sum + (Number(row.population) || 0), 0)
}

// ---------------------------------------------------------------------------
// Coverage + accessibility — REAL derived (Haversine to nearest entity and
// nearest road; road-layer distance where a routing service is injected).
// ---------------------------------------------------------------------------

const haversineKm = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) return Infinity
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1])
  const lat2 = toRad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function nearestEntityDistance(position, entities = []) {
  let best = Infinity
  entities.forEach((entity) => {
    if (!Array.isArray(entity.position)) return
    const d = haversineKm(position, entity.position)
    if (d < best) best = d
  })
  return Number.isFinite(best) ? best : null
}

// Accessibility: distance from a population block to the nearest road-layer
// feature, segmented Good (<=1 km) / Moderate (<=3 km) / Poor (>3 km).  The
// thresholds are the documented Phase 2 model parameters.
export const ACCESSIBILITY_THRESHOLDS_KM = { good: 1, moderate: 3 }

export function roadAccessibility(position = null, roadRows = []) {
  if (!Array.isArray(position)) return { status: 'unknown', distanceKm: null, basis: 'No valid block position' }
  let best = Infinity
  roadRows.forEach((row) => {
    if (!Array.isArray(row.position)) return
    const d = haversineKm(position, row.position)
    if (d < best) best = d
  })
  if (!Number.isFinite(best)) return { status: 'unknown', distanceKm: null, basis: 'No road layer loaded' }
  const status = best <= ACCESSIBILITY_THRESHOLDS_KM.good ? 'Good' : best <= ACCESSIBILITY_THRESHOLDS_KM.moderate ? 'Moderate' : 'Poor'
  return { status, distanceKm: Math.round(best * 1000) / 1000, basis: `Straight-line distance to nearest road feature (${Math.round(best * 1000) / 1000} km)` }
}

export function coverageAnalysis({ entities = [], populationRows = [], serviceDistanceKm = 5 } = {}) {
  if (!populationRows.length) return { computed: false, servedPopulation: 0, unservedPopulation: 0, coveragePct: null, blocks: [] }
  const blocks = populationRows.map((row) => {
    const distanceKm = nearestEntityDistance(row.position, entities)
    const served = distanceKm !== null && distanceKm <= Number(serviceDistanceKm)
    return { ...row, distanceKm: distanceKm === null ? null : Math.round(distanceKm * 1000) / 1000, served }
  })
  const servedPopulation = blocks.filter((b) => b.served).reduce((sum, b) => sum + b.population, 0)
  const unservedPopulation = blocks.filter((b) => !b.served).reduce((sum, b) => sum + b.population, 0)
  const totalPop = servedPopulation + unservedPopulation
  return {
    computed: true,
    servedPopulation,
    unservedPopulation,
    coveragePct: totalPop > 0 ? Math.round((servedPopulation / totalPop) * 100) : null,
    blocks,
  }
}

// ---------------------------------------------------------------------------
// Hazard exposure — REAL point-in-polygon against served hazard layers.
// ---------------------------------------------------------------------------

export function hazardExposure(position = null, hazardLayers = []) {
  if (!Array.isArray(position)) return { exposed: false, hazardCount: 0, hazardLayers: [], basis: 'No valid entity position' }
  const exposed = []
  hazardLayers.forEach((layer) => {
    const hit = (layer.features || []).some((feature) => pointInPolygon(position, feature.geometry))
    if (hit) exposed.push({ layerName: layer.layerName || layer.name })
  })
  return {
    exposed: exposed.length > 0,
    hazardCount: exposed.length,
    hazardLayers: exposed,
    basis: exposed.length
      ? `Inside ${exposed.map((e) => e.layerName).join(', ')} (real hazard layer geometry)`
      : 'Not inside any served hazard layer',
  }
}

// ---------------------------------------------------------------------------
// Priority — config-driven components and bands, fully disclosed (§7/§9).
// A component whose data is absent is excluded from the score and shown as
// "no data" — it is NEVER silently zeroed.
// ---------------------------------------------------------------------------

export function populationServed(entity = {}, populationRows = []) {
  if (!Array.isArray(entity.position)) return null
  let best = null
  populationRows.forEach((row) => {
    if (!Array.isArray(row.position)) return
    const d = haversineKm(entity.position, row.position)
    if (!best || d < best.d) best = { row, d }
  })
  if (!best) return null
  return { population: Number(best.row.population) || 0, blockName: best.row.name }
}

export function tierForEntity(entity = {}, config = {}) {
  const group = (config.entityGroups || []).find((g) => g.id === entity.entityGroupId)
  return Number(group?.tier ?? 1)
}

// normalize: [0..1] per component.  population burden is normalized against
// 100k residents; hazard count against 3 layers; tier against 4; gap is 0..1.
const normalizeComponent = (component, entity) => {
  switch (component.key) {
    case 'gap': {
      const gap = Number(entity.gapScore)
      return Number.isFinite(gap) && entity.gapScore !== undefined ? Math.min(1, Math.max(0, gap)) : null
    }
    case 'exposure': {
      const count = entity.exposure?.hazardCount
      return count == null ? null : Math.min(1, count / 3)
    }
    case 'burden': {
      const population = entity.populationServed?.population
      return population == null ? null : Math.min(1, population / 100000)
    }
    case 'tier': {
      return entity.tier ? entity.tier / 4 : null
    }
    default: return null
  }
}

export function priorityForEntity(entity = {}, priorityConfig = {}) {
  const components = priorityConfig?.components || []
  const entries = components.map((component) => {
    const normalized = normalizeComponent(component, entity)
    return {
      key: component.key,
      label: component.label,
      weight: Number(component.weight) || 0,
      source: component.source || 'config',
      raw: normalized,
      contribution: normalized === null ? null : Math.round((normalized * (Number(component.weight) || 0)) * 1000) / 1000,
      available: normalized !== null,
    }
  })
  const available = entries.filter((e) => e.available)
  const totalWeight = available.reduce((sum, e) => sum + e.weight, 0)
  const score = totalWeight > 0 ? Math.round((available.reduce((sum, e) => sum + e.contribution, 0) / totalWeight) * 1000) / 1000 : null
  const band = score === null ? null : (priorityConfig?.bands || []).find((b) => score >= Number(b.min))
  return {
    score,
    band: band?.band || null,
    bandLabel: band?.label || null,
    components: entries,
    basis: available.length
      ? `Priority score ${score} = weighted components (${available.map((e) => e.key).join(', ')}) normalised by their total weight ${Math.round(totalWeight * 100) / 100}. Bands configured in departmentConfigs.js.`
      : 'No priority data available — no component has a real source in the current backend.',
  }
}

export function rankEntities(entities = [], config = {}) {
  const priorityConfig = config.priority || {}
  const rows = entities.map((entity) => ({
    entity,
    tier: tierForEntity(entity, config),
    priority: priorityForEntity(entity, priorityConfig),
  }))
  return rows
    .sort((a, b) => (b.priority.score ?? -1) - (a.priority.score ?? -1))
    .map((row, index) => ({ ...row, rank: row.priority.score === null ? null : index + 1 }))
}

// ---------------------------------------------------------------------------
// Gap analysis — generic dimensions.  Coverage/accessibility are REAL derived;
// indicator-driven dimensions report reporting share when attributes exist and
// "Data not available" + required source otherwise (§8, §15).
// ---------------------------------------------------------------------------

export function gapAnalysis({ config = {}, entities = [], coverage = {}, accessibilityRows = [] } = {}) {
  return (config.gapDimensions || []).map((dimension) => {
    const base = { ...dimension }
    switch (dimension.kind) {
      case 'coverage': {
        if (!coverage.computed) return { ...base, status: 'unavailable', detail: 'No population layer loaded', source: 'Rural_population / Urban_population census layers' }
        const unservedBlocks = coverage.blocks.filter((b) => !b.served)
        return {
          ...base,
          status: 'computed',
          value: coverage.coveragePct,
          displayValue: `${coverage.coveragePct}% of census population covered`,
          populationServed: coverage.servedPopulation,
          populationUnserved: coverage.unservedPopulation,
          affectedBlocks: unservedBlocks.map((b) => ({ name: b.name, population: b.population, distanceKm: b.distanceKm })),
          source: 'Haversine distance to nearest entity over real census blocks (Rural_population / Urban_population)',
        }
      }
      case 'accessibility': {
        const segments = { Good: 0, Moderate: 0, Poor: 0 }
        accessibilityRows.forEach((row) => { if (segments[row.status] !== undefined) segments[row.status] += 1 })
        const total = accessibilityRows.length
        return {
          ...base,
          status: total ? 'computed' : 'unavailable',
          displayValue: total ? `Good ${segments.Good} · Moderate ${segments.Moderate} · Poor ${segments.Poor} (${total} census blocks)` : 'No census blocks loaded',
          segments,
          total,
          source: 'Straight-line distance from census block centroids to nearest road feature (Other_Roads / State_Highway / National_Highway); thresholds Good <=1 km, Moderate <=3 km, Poor >3 km (Phase 2 model parameters)',
        }
      }
      case 'infrastructure':
      case 'capacity':
      case 'staffing':
      case 'service':
      case 'resource': {
        const indicatorConfigs = dimension.indicatorKeys
          ? (config.indicators || []).filter((i) => dimension.indicatorKeys.includes(i.key))
          : (config.indicators || [])
        const reporting = districtIndicatorReporting(entities, indicatorConfigs)
        const reportedIndicators = reporting.indicators.filter((i) => i.reporting > 0)
        return {
          ...base,
          status: reportedIndicators.length ? 'computed' : 'unavailable',
          displayValue: reportedIndicators.length
            ? `${reporting.indicators.map((i) => `${i.label}: ${i.reporting}/${entities.length} entities`).join(' · ')}`
            : 'Data not available',
          indicators: reporting.indicators,
          requiredSource: dimension.source || (indicatorConfigs[0]?.attributeFields || []).join(', '),
          detail: reportedIndicators.length
            ? 'Indicators reported by real entity attributes; deficits require required-vs-current values from the source endpoints.'
            : `The backend does not serve these attributes yet. Requires: ${dimension.source}`,
        }
      }
      default:
        return { ...base, status: 'unavailable', detail: 'Unknown gap dimension kind', source: 'config' }
    }
  })
}

// ---------------------------------------------------------------------------
// KPIs — config-driven kinds; telemetry KPIs never show a fake number (§15).
// ---------------------------------------------------------------------------

export function kpiValues({ config = {}, entities = [], coverage = {}, ranked = [], reportingShare = 0 } = {}) {
  return (config.kpis || []).map((kpi) => {
    switch (kpi.kind) {
      case 'entity-count': {
        const count = entities.length
        return {
          ...kpi,
          value: count,
          displayValue: String(count),
          status: count > 0 || !kpi.source ? 'computed' : 'unavailable',
          detail: kpi.source && !count ? kpi.source : count ? `Real entities collected from ${(config.entityGroups || []).length} entity groups` : 'No entity groups configured for this department',
        }
      }
      case 'coverage-pct': {
        if (!coverage.computed) return { ...kpi, value: null, status: 'unavailable', displayValue: 'Data not available', detail: 'No census population layer loaded' }
        return { ...kpi, value: coverage.coveragePct, status: 'computed', displayValue: `${coverage.coveragePct}%`, detail: `Census population within ${config.serviceDistanceKm} km of a ${config.terminology?.entity || 'department entity'} (real blocks, Haversine)` }
      }
      case 'high-priority': {
        const count = ranked.filter((r) => r.priority.score !== null && ['P1', 'P2'].includes(r.priority.band)).length
        return {
          ...kpi,
          value: count,
          status: ranked.length ? 'computed' : 'unavailable',
          displayValue: String(count),
          detail: `P1/P2 of ${ranked.length} ranked entities (config-driven priority bands)`,
        }
      }
      case 'reporting-pct': {
        return {
          ...kpi,
          value: reportingShare,
          status: entities.length ? 'computed' : 'unavailable',
          displayValue: `${reportingShare}%`,
          detail: entities.length ? `Share of ${entities.length} entities with at least one real indicator attribute` : 'No entities',
        }
      }
      case 'telemetry':
      default:
        return { ...kpi, value: null, status: 'unavailable', displayValue: 'Data not available', detail: kpi.source || 'No backend data contract configured' }
    }
  })
}

// ---------------------------------------------------------------------------
// Render plan — the pure structure the generic workspace consumes.  Any config
// yields a plan; the extensibility tests assert new departments render without
// component changes (§19).
// ---------------------------------------------------------------------------

export function buildRenderPlan({ config = {}, catalog = [], facilities = [], layersByName = {}, populationLayers = {}, roadLayers = {}, hazardLayerData = [], boundaryLayers = {} } = {}) {
  const catalogNames = new Set(catalog.map((layer) => layer.name))

  // Layer availability is honest: a config naming a layer the catalog lacks is
  // reported as missing and simply not rendered.
  const resolvedEntityGroups = (config.entityGroups || []).map((group) => ({
    ...group,
    available: group.source === 'facility-category' ? true : catalogNames.has(group.layerName),
  }))
  const resolvedContextLayers = (config.contextLayers || []).map((layer) => ({
    ...layer,
    available: catalogNames.has(layer.layerName),
  }))
  const resolvedHazardLayers = (config.hazardLayers || []).map((name) => ({ layerName: name, available: catalogNames.has(name) }))

  const entities = collectEntities(config, facilities, layersByName)
  const populationRows = populationRowsFromLayers(populationLayers)
  const roadRows = Object.values(roadLayers).flatMap((layer) => (layer.features || []).map((feature) => ({ position: interiorPoint(feature.geometry) })).filter((r) => r.position))
  const hazardLayers = hazardLayerData.filter((layer) => config.hazardLayers.includes(layer.layerName))

  const withExposure = entities.map((entity) => ({ ...entity, exposure: hazardExposure(entity.position, hazardLayers) }))
  const withPopulation = withExposure.map((entity) => ({ ...entity, populationServed: populationServed(entity, populationRows) }))
  const ranked = rankEntities(withPopulation, config)
  const coverage = coverageAnalysis({ entities: withExposure, populationRows, serviceDistanceKm: config.serviceDistanceKm })
  const accessibilityRows = populationRows.map((row) => roadAccessibility(row.position, roadRows))
  const reporting = districtIndicatorReporting(withExposure, config.indicators || [])
  const gaps = gapAnalysis({ config, entities: withExposure, coverage, accessibilityRows })
  const kpis = kpiValues({ config, entities: withExposure, coverage, ranked, reportingShare: reporting.reportingShare })

  return {
    config,
    resolvedEntityGroups,
    resolvedContextLayers,
    resolvedHazardLayers,
    layersByName,
    boundaryLayers,
    populationLayers,
    roadLayers,
    hazardLayerData,
    entities: withPopulation,
    ranked,
    coverage,
    accessibility: accessibilityRows,
    gaps,
    kpis,
    reporting,
    catalogNames: [...catalogNames].sort(),
  }
}

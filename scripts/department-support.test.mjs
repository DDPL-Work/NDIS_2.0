// Phase 3 acceptance tests — ONE generic Department Decision Support workspace
// across MULTIPLE departments (§20).
//
//   node --experimental-loader ./scripts/esm-loader.mjs scripts/department-support.test.mjs
//
// Coverage:
//   - Department identity / config contract for Health, Education, Water,
//     Urban Dev & Infrastructure, Public Works & Transport (+ extras)
//   - Correct layers (every referenced GIS layer exists in the REAL catalog)
//   - Correct indicators / KPIs / priorities / gaps
//   - No cross-department data leakage (category matches are disjoint)
//   - RBAC: DM can switch departments; dept officer cannot access others
//   - Honesty: unavailable telemetry is never shown as a number
//   - Extensibility: an unknown department renders the same plan via the
//     default config — no new components required (§19)
import assert from 'node:assert/strict'
import {
  DEPARTMENT_CONFIGS,
  getDepartmentConfig,
  defaultDepartmentConfig,
  canAccessDepartment,
  accessibleDepartmentConfigs,
  DISTRICT_OVERSIGHT_ROLES,
} from '../src/features/departmentsupport/departmentConfigs.js'
import {
  entityRowsFromFacilities,
  entityRowsFromLayer,
  collectEntities,
  resolveIndicators,
  entityIndicatorSummary,
  districtIndicatorReporting,
  populationRowsFromLayers,
  totalPopulation,
  coverageAnalysis,
  roadAccessibility,
  hazardExposure,
  priorityForEntity,
  rankEntities,
  gapAnalysis,
  kpiValues,
  buildRenderPlan,
  ACCESSIBILITY_THRESHOLDS_KM,
} from '../src/features/departmentsupport/departmentModel.js'

let passed = 0
const check = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`) }

// ---------------------------------------------------------------------------
// REAL catalog layer names (probed live from GET /api/gis/catalog/ on
// 2026-08).  Configs may only reference layers that exist here.
// ---------------------------------------------------------------------------
const REAL_CATALOG_NAMES = [
  'Block_boundary', 'District_boundary', 'Headquarters', 'RF_PF_boundary', 'Bank', 'Church', 'Circuit_house',
  'Industry', 'Inspection_Bungalow', 'Market', 'Mosque', 'Occupational_Structure', 'Places_of_Tourist_Interest',
  'PoliceStation', 'PostOffice', 'Temple', 'Rural_population', 'Urban_population', 'Collage', 'School', 'University',
  'Isohyet_Lines', 'Isotherm_Lines', 'Landuse_NALANDA_NRSC', 'Rainfall_Zone', 'Relief', 'Rocks', 'Slope', 'Soil',
  'Earthquake', 'Flood_hazard', 'Wind_Hazard', 'Blood_Bank', 'Community_Health_centre', 'Dispensary', 'Hospital',
  'Primary_Health_centre', 'Veterinary_Hospital', 'Canal_poly', 'GroundWater_Potential', 'River', 'River_line',
  'Spring', 'Tubewell', 'Water_Table_Contour', 'Waterbody', 'Well', 'National_Highway', 'Other_Roads',
  'Railway_line', 'Railway_station', 'State_Highway',
]

const ACCEPTANCE_DEPARTMENTS = ['health', 'education', 'water', 'urban', 'pwd']
const SECTION_KEYS = ['situation', 'map', 'priorities', 'gaps', 'resources', 'citizen', 'projects', 'actions']

// ---------------------------------------------------------------------------
// 1. Department identity + configuration contract (§20)
// ---------------------------------------------------------------------------
check('all 5 acceptance departments are registered', () => {
  ACCEPTANCE_DEPARTMENTS.forEach((id) => assert.ok(DEPARTMENT_CONFIGS[id], `missing config for ${id}`))
})

check('every registered config has the full contract shape', () => {
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    assert.ok(config.departmentId, 'departmentId')
    assert.ok(config.departmentName, 'departmentName')
    assert.ok(typeof config.description === 'string' && config.description.length > 0, 'description')
    assert.ok(config.terminology?.entity && config.terminology?.entities, 'terminology')
    assert.ok(Number(config.serviceDistanceKm) > 0, 'serviceDistanceKm')
    assert.ok(Array.isArray(config.entityGroups), 'entityGroups')
    assert.ok(Array.isArray(config.indicators), 'indicators')
    assert.ok(Array.isArray(config.kpis) && config.kpis.length > 0, 'kpis')
    assert.ok(Array.isArray(config.gapDimensions), 'gapDimensions')
    assert.ok(config.priority?.components?.length > 0, 'priority.components')
    assert.ok(config.priority?.bands?.length >= 4, 'priority.bands')
    assert.ok(Array.isArray(config.sections) && config.sections.length > 0, 'sections')
    config.sections.forEach((key) => assert.ok(SECTION_KEYS.includes(key), `unknown section key ${key}`))
  })
})

check('priority bands are ordered P1→P4 with configured thresholds', () => {
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    const bands = config.priority.bands
    assert.equal(bands[0].band, 'P1')
    assert.equal(bands.at(-1).band, 'P4')
    for (let i = 1; i < bands.length; i += 1) assert.ok(bands[i].min < bands[i - 1].min)
  })
})

check('priority components declare weight + data source (explainable)', () => {
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    config.priority.components.forEach((component) => {
      assert.ok(Number(component.weight) > 0, `${config.departmentId}: ${component.key} weight`)
      assert.ok(component.source && component.source.length > 0, `${config.departmentId}: ${component.key} source`)
    })
  })
})

// ---------------------------------------------------------------------------
// 2. Correct layers — every config layer exists in the REAL catalog (§20)
// ---------------------------------------------------------------------------
check('every entity GIS layer referenced by a config exists in the real catalog', () => {
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    config.entityGroups.forEach((group) => {
      if (group.source !== 'gis-layer') return
      assert.ok(REAL_CATALOG_NAMES.includes(group.layerName), `${config.departmentId}: missing layer ${group.layerName}`)
    })
  })
})

check('every context + hazard layer referenced by a config exists in the real catalog', () => {
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    config.contextLayers.forEach((layer) => {
      assert.ok(REAL_CATALOG_NAMES.includes(layer.layerName), `${config.departmentId}: missing context layer ${layer.layerName}`)
    })
    config.hazardLayers.forEach((name) => {
      assert.ok(REAL_CATALOG_NAMES.includes(name), `${config.departmentId}: missing hazard layer ${name}`)
    })
  })
})

check('electricity/solar configs honestly declare NO dedicated catalog layers', () => {
  assert.equal(DEPARTMENT_CONFIGS.electricity.entityGroups.length, 0)
  assert.equal(DEPARTMENT_CONFIGS.solar.entityGroups.length, 0)
})

check('configs that name layers absent from the catalog surface them honestly', () => {
  // forest references no 'Forest' layer (it does not exist) — Landuse + hazards only.
  assert.ok(!DEPARTMENT_CONFIGS.forest.entityGroups.some((g) => g.layerName === 'Forest'))
})

// ---------------------------------------------------------------------------
// 3. No unrelated department data (§20)
// ---------------------------------------------------------------------------
const REAL_CATEGORY_LABELS = [
  'Hospital', 'Primary Health Centre', 'Community Health Centre', 'Dispensary', 'Blood Bank', 'Veterinary Hospital',
  'School', 'Collage', 'University', 'Tubewell', 'Well', 'Spring', 'Waterbody', 'Headquarters', 'Market',
  'Policestation', 'Postoffice', 'Circuit House', 'Inspection Bungalow', 'Places Of Tourist Interest', 'Temple',
  'Mosque', 'Church', 'Industry', 'Railway Station', 'Bank',
]

check('facility-category claims are precise — each real category maps only to the departments that own it (shared custody documented)', () => {
  const claims = {}
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    config.entityGroups.filter((g) => g.source === 'facility-category').forEach((group) => {
      const matcher = new RegExp(String(group.match), 'i')
      REAL_CATEGORY_LABELS.forEach((label) => {
        if (matcher.test(label)) {
          claims[label] = claims[label] || []
          claims[label].push(`${config.departmentId}:${group.id}`)
        }
      })
    })
  })
  // Every claim must reference a real category; every claimed category is
  // captured.  'Waterbody' is deliberately NOT claimed as a facility category —
  // it is collected from the real Waterbody GIS polygon layer instead.
  assert.equal(Object.keys(claims).length, REAL_CATEGORY_LABELS.length - 1)
  assert.ok(!claims.Waterbody, 'Waterbody is collected from the Waterbody GIS layer, not a facility category')
  // Expected ownership (many-to-many is legitimate — e.g. Headquarters serves
  // urban infrastructure, revenue administration and district oversight).
  const owners = Object.fromEntries(Object.entries(claims).map(([label, list]) => [label, list.map((c) => c.split(':')[0]).sort()]))
  assert.deepEqual(owners.Hospital, ['health'])
  assert.deepEqual(owners.School, ['education'])
  assert.deepEqual(owners.Tubewell, ['water'])
  assert.deepEqual(owners.Headquarters, ['general', 'revenue', 'urban'])
  assert.deepEqual(owners.Policestation, ['general', 'urban'])
  assert.deepEqual(owners.Postoffice, ['general', 'urban'])
  assert.deepEqual(owners.Temple, ['tourism'])
  assert.deepEqual(owners.Mosque, ['tourism'])
  assert.deepEqual(owners.Church, ['tourism'])
  assert.deepEqual(owners.Bank, ['general'])
  // No category may be claimed by an unrelated department.
  assert.ok(!claims.School.some((c) => c.startsWith('health:')), 'schools never health')
  assert.ok(!claims.Hospital.some((c) => c.startsWith('education:')), 'hospitals never education')
  assert.ok(!claims.Tubewell.some((c) => c.startsWith('pwd:')), 'tubewells never pwd')
})

check('each acceptance department has at least one real entity group', () => {
  ACCEPTANCE_DEPARTMENTS.forEach((id) => assert.ok(DEPARTMENT_CONFIGS[id].entityGroups.length > 0, `${id} has no entity groups`))
})

// ---------------------------------------------------------------------------
// 4. Indicators — real attributes resolved, absent ones reported honestly
// ---------------------------------------------------------------------------
const fixtureFacilities = [
  { id: '1', name: 'Nalanda Hospital', categoryLabel: 'Hospital', position: [85.4434, 25.1372], village: 'Bihar Sharif', attributes: { bed_count: 120, doctor_count: 14 }, gapScore: 0.82 },
  { id: '2', name: 'Asthawan PHC', categoryLabel: 'Primary Health Centre', position: [85.39, 25.19], village: 'Asthawan', attributes: {}, gapScore: 0.55 },
  { id: '3', name: 'Rajgir School', categoryLabel: 'School', position: [85.41, 25.01], village: 'Rajgir', attributes: { teacher_count: 22 }, gapScore: 0.3 },
  { id: '4', name: 'Silao School', categoryLabel: 'School', position: [85.46, 25.08], village: 'Silao', attributes: {}, gapScore: 0.2 },
  { id: '5', name: 'Hilsa Tubewell', categoryLabel: 'Tubewell', position: [85.3, 25.27], village: 'Hilsa', attributes: { functional: 1 }, gapScore: 0.9 },
  { id: '6', name: 'Rahui Tubewell', categoryLabel: 'Tubewell', position: [85.5, 25.2], village: 'Rahui', attributes: {}, gapScore: 0.1 },
]

check('resolveIndicators: real attribute -> available with value + matched key', () => {
  const result = resolveIndicators(fixtureFacilities[0], DEPARTMENT_CONFIGS.health.indicators)
  const beds = result.find((i) => i.key === 'beds')
  assert.equal(beds.status, 'available')
  assert.equal(beds.value, 120)
  assert.equal(beds.attributeKey, 'bed_count')
})

check('resolveIndicators: absent attribute -> unavailable with required keys, never 0', () => {
  const result = resolveIndicators(fixtureFacilities[1], DEPARTMENT_CONFIGS.health.indicators)
  const beds = result.find((i) => i.key === 'beds')
  assert.equal(beds.status, 'unavailable')
  assert.equal(beds.value, null)
  assert.deepEqual(beds.requiredKeys, ['bed_count', 'beds'])
})

check('entityIndicatorSummary reports whether any indicator exists', () => {
  assert.equal(entityIndicatorSummary(fixtureFacilities[0], DEPARTMENT_CONFIGS.health.indicators).reporting, true)
  assert.equal(entityIndicatorSummary(fixtureFacilities[1], DEPARTMENT_CONFIGS.health.indicators).reporting, false)
})

check('districtIndicatorReporting computes real reporting share', () => {
  const healthEntities = collectEntities(DEPARTMENT_CONFIGS.health, fixtureFacilities, {})
  const reporting = districtIndicatorReporting(healthEntities, DEPARTMENT_CONFIGS.health.indicators)
  const beds = reporting.indicators.find((i) => i.key === 'beds')
  assert.equal(beds.reporting, 1) // only Nalanda Hospital carries bed_count
  assert.equal(beds.reportingShare, 50)
})

// ---------------------------------------------------------------------------
// 5. Universal data model — entity collection from facilities + layers
// ---------------------------------------------------------------------------
check('collectEntities resolves facility-category groups only for the department', () => {
  const health = collectEntities(DEPARTMENT_CONFIGS.health, fixtureFacilities, {})
  assert.equal(health.length, 2)
  assert.ok(health.every((e) => /hospital|primary health/i.test(e.categoryLabel)))
  const education = collectEntities(DEPARTMENT_CONFIGS.education, fixtureFacilities, {})
  assert.equal(education.length, 2)
  const water = collectEntities(DEPARTMENT_CONFIGS.water, fixtureFacilities, {})
  assert.equal(water.length, 2)
})

const layerFixture = (name, geometryType, features) => ({ layerName: name, category: '', geometryType, featureCount: features.length, features })

check('collectEntities resolves GIS-layer entity groups from real layer data', () => {
  const waterbodyLayer = layerFixture('Waterbody', 'Polygon', [
    { id: 'wb1', geometry: { type: 'Polygon', coordinates: [[[85.3, 25.1], [85.5, 25.1], [85.5, 25.3], [85.3, 25.3], [85.3, 25.1]]] }, properties: { feature_name: 'Kunjal Lake', Block_Name: 'Rajgir' } },
  ])
  const water = collectEntities(DEPARTMENT_CONFIGS.water, [], { Waterbody: waterbodyLayer })
  const lake = water.find((e) => e.name === 'Kunjal Lake')
  assert.ok(lake, 'lake entity collected')
  assert.equal(lake.source, 'gis-layer')
  assert.equal(lake.village, 'Rajgir')
  assert.equal(lake.geometryType, 'Polygon')
})

check('entityRowsFromLayer drops features without a usable interior point (no fabricated geometry)', () => {
  const bad = layerFixture('Canal_poly', 'Polygon', [
    { id: 'c1', geometry: null, properties: { feature_name: 'Ghost' } },
    { id: 'c2', geometry: { type: 'Point', coordinates: [85.4, 25.1] }, properties: { feature_name: 'Real' } },
  ])
  const rows = entityRowsFromLayer(bad, { id: 'canal', label: 'Canals' })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, 'Real')
})

// ---------------------------------------------------------------------------
// 6. Population + coverage — real derived
// ---------------------------------------------------------------------------
const populationLayer = layerFixture('Rural_population', 'Polygon', [
  { id: 'b1', geometry: { type: 'Polygon', coordinates: [[[85.35, 25.1], [85.45, 25.1], [85.45, 25.2], [85.35, 25.2], [85.35, 25.1]]] }, properties: { Block_Name: 'Asthawan', Block_Rura: 100000 } },
  { id: 'b2', geometry: { type: 'Polygon', coordinates: [[[85.3, 25.25], [85.35, 25.25], [85.35, 25.3], [85.3, 25.3], [85.3, 25.25]]] }, properties: { Block_Name: 'Hilsa', Block_Rura: 20000 } },
])

check('populationRowsFromLayers reads the real census field Block_Rura', () => {
  const rows = populationRowsFromLayers({ Rural_population: populationLayer })
  assert.equal(rows.length, 2)
  assert.equal(rows.find((r) => r.name === 'Hilsa').population, 20000)
  assert.equal(totalPopulation(rows), 120000)
})

check('coverageAnalysis computes served vs unserved census population', () => {
  const healthEntities = collectEntities(DEPARTMENT_CONFIGS.health, fixtureFacilities, {})
  const rows = populationRowsFromLayers({ Rural_population: populationLayer })
  const coverage = coverageAnalysis({ entities: healthEntities, populationRows: rows, serviceDistanceKm: 5 })
  assert.equal(coverage.computed, true)
  assert.ok(coverage.coveragePct >= 0 && coverage.coveragePct <= 100)
  // Hilsa (85.3,25.27) is far from both health facilities (Hilsa's only asset is a Tubewell)
  const hilsa = coverage.blocks.find((b) => b.name === 'Hilsa')
  assert.equal(hilsa.served, false)
})

check('roadAccessibility segments against the documented thresholds', () => {
  const roadRows = [{ position: [85.44, 25.13] }]
  assert.equal(roadAccessibility([85.44, 25.13], roadRows).status, 'Good')
  assert.equal(roadAccessibility([85.3, 25.27], roadRows).status, 'Poor')
  assert.deepEqual(ACCESSIBILITY_THRESHOLDS_KM, { good: 1, moderate: 3 })
})

// ---------------------------------------------------------------------------
// 7. Hazard exposure + priority — disclosed, config-driven
// ---------------------------------------------------------------------------
const floodLayer = layerFixture('Flood_hazard', 'Polygon', [
  { id: 'f1', geometry: { type: 'Polygon', coordinates: [[[85.2, 25.0], [85.6, 25.0], [85.6, 25.4], [85.2, 25.4], [85.2, 25.0]]] }, properties: {} },
])

check('hazardExposure uses real polygon containment', () => {
  assert.equal(hazardExposure([85.3, 25.27], [floodLayer]).exposed, true)
  assert.equal(hazardExposure([85.5, 25.2], [floodLayer]).exposed, true)
  assert.equal(hazardExposure([84.9, 25.2], [floodLayer]).exposed, false)
})

check('priorityForEntity: score from configured weights, P1/P2 bands, disclosed basis', () => {
  const config = DEPARTMENT_CONFIGS.health
  const entity = {
    id: '1', name: 'Nalanda Hospital', categoryLabel: 'Hospital',
    entityGroupId: 'hospital', gapScore: 0.82, tier: 4,
    exposure: { hazardCount: 1, hazardLayers: [{ layerName: 'Flood_hazard' }], exposed: true },
    populationServed: { population: 100000, blockName: 'Asthawan' },
  }
  const priority = priorityForEntity(entity, config.priority, config)
  assert.ok(priority.score !== null)
  // Disclosed formula: .82*.35 + (1/3)*.25 + 1*.25 + 1*.15 = 0.7703 → P2
  assert.equal(priority.band, 'P2')
  assert.ok(Math.abs(priority.score - 0.77) < 0.005)
  assert.ok(priority.basis.includes('weighted components'))
  assert.ok(priority.components.every((c) => c.available || c.contribution === null))
})

check('priorityForEntity never fabricates a score when no component has data', () => {
  const config = DEPARTMENT_CONFIGS.health
  const entity = { id: 'x', name: 'Ghost', entityGroupId: 'hospital', exposure: { hazardCount: null }, populationServed: null, gapScore: undefined, tier: undefined }
  const priority = priorityForEntity(entity, config.priority, config)
  assert.equal(priority.score, null)
  assert.equal(priority.band, null)
})

check('rankEntities sorts by score desc and keeps null-score entities honest', () => {
  const config = DEPARTMENT_CONFIGS.health
  const ranked = rankEntities(fixtureFacilities.slice(0, 2).map((f) => ({
    id: f.id, name: f.name, categoryLabel: f.categoryLabel, entityGroupId: 'hospital', position: f.position,
    attributes: f.attributes, gapScore: f.gapScore, tier: 4,
    exposure: { hazardCount: 2, hazardLayers: [], exposed: true },
    populationServed: { population: 100000, blockName: 'Asthawan' },
  })), config)
  assert.equal(ranked.length, 2)
  assert.equal(ranked[0].entity.name, 'Nalanda Hospital')
  // Disclosed formula: gap .82*0.35 + hazard 2/3*0.25 + pop 100k*0.25 + tier 1*0.15 = 0.8537 → P1
  assert.equal(ranked[0].priority.band, 'P1')
  assert.ok(Math.abs(ranked[0].priority.score - 0.854) < 0.01)
})

// ---------------------------------------------------------------------------
// 8. Gap analysis — real vs unavailable (§8/§15)
// ---------------------------------------------------------------------------
check('coverage gap is computed from real population blocks', () => {
  const healthEntities = collectEntities(DEPARTMENT_CONFIGS.health, fixtureFacilities, {})
  const rows = populationRowsFromLayers({ Rural_population: populationLayer })
  const coverage = coverageAnalysis({ entities: healthEntities, populationRows: rows, serviceDistanceKm: 5 })
  const gaps = gapAnalysis({ config: DEPARTMENT_CONFIGS.health, entities: healthEntities, coverage })
  const coverageGap = gaps.find((g) => g.key === 'coverage')
  assert.equal(coverageGap.status, 'computed')
  assert.equal(coverageGap.displayValue.includes('%'), true)
  assert.ok(coverageGap.affectedBlocks.some((b) => b.name === 'Hilsa'))
})

check('indicator-driven gap dimensions report Data not available + required source', () => {
  const healthEntities = collectEntities(DEPARTMENT_CONFIGS.health, fixtureFacilities, {})
  const gaps = gapAnalysis({ config: DEPARTMENT_CONFIGS.health, entities: healthEntities })
  const staffing = gaps.find((g) => g.key === 'staffing')
  assert.equal(staffing.status, 'computed') // Nalanda Hospital reports doctor_count
  const workload = gaps.find((g) => g.key === 'service')
  assert.equal(workload.status, 'unavailable')
  assert.ok(workload.requiredSource.includes('/health/workload/'), 'required source named')
  assert.equal(workload.displayValue, 'Data not available')
})

check('telemetry KPIs display Data not available with their endpoint, never a number', () => {
  const config = DEPARTMENT_CONFIGS.health
  const kpis = kpiValues({ config, entities: [], coverage: {}, ranked: [], reportingShare: 0 })
  const hr = kpis.find((k) => k.key === 'hr')
  assert.equal(hr.status, 'unavailable')
  assert.equal(hr.displayValue, 'Data not available')
  assert.ok(hr.detail.includes('GET /api/health/human-resources/'))
  const count = kpis.find((k) => k.key === 'entity-count')
  assert.equal(count.status, 'computed')
  assert.equal(count.value, 0)
})

// ---------------------------------------------------------------------------
// 9. RBAC (§16/§20) — DM district-wide, officers own-department-only
// ---------------------------------------------------------------------------
check('DM / Collector / ADM / State Admin may access every department', () => {
  ;['district_collector', 'dm', 'adm', 'state_admin', 'system_admin'].forEach((role) => {
    assert.equal(canAccessDepartment({ role }, 'health'), true)
    assert.equal(canAccessDepartment({ role }, 'water'), true)
    assert.equal(accessibleDepartmentConfigs({ role }).length, Object.keys(DEPARTMENT_CONFIGS).length)
  })
})

check('department officer can access ONLY their own department', () => {
  assert.equal(canAccessDepartment({ role: 'dept_head', departmentId: 'health' }, 'health'), true)
  assert.equal(canAccessDepartment({ role: 'dept_head', departmentId: 'health' }, 'education'), false)
  assert.equal(canAccessDepartment({ role: 'dept_officer', departmentId: 'water' }, 'education'), false)
  const switcher = accessibleDepartmentConfigs({ role: 'dept_head', departmentId: 'health' })
  assert.equal(switcher.length, 1)
  assert.equal(switcher[0].departmentId, 'health')
})

check('unbound department staff cannot view any departmental workspace', () => {
  assert.equal(canAccessDepartment({ role: 'dept_officer' }, 'health'), false)
  assert.equal(canAccessDepartment({ role: 'supervisor' }, 'general'), false)
  assert.equal(canAccessDepartment({ role: 'engineer' }, 'health'), false)
  assert.equal(canAccessDepartment(null, 'health'), false)
})

// ---------------------------------------------------------------------------
// 10. Extensibility (§19) — an unknown department renders via default config
// ---------------------------------------------------------------------------
check('default config exists for any unregistered department id', () => {
  const config = defaultDepartmentConfig('future-transport')
  assert.equal(config.departmentId, 'future-transport')
  assert.ok(config.sections.length > 0)
  assert.equal(config.entityGroups.length, 0)
})

check('buildRenderPlan renders the default config without errors (no new components)', () => {
  const plan = buildRenderPlan({ config: defaultDepartmentConfig('new-dept'), catalog: [], facilities: [], layersByName: {}, populationLayers: {}, roadLayers: {}, hazardLayerData: [] })
  assert.equal(plan.entities.length, 0)
  assert.ok(plan.kpis.every((k) => ['computed', 'unavailable'].includes(k.status)))
  assert.equal(plan.gaps[0].status, 'unavailable')
})

check('buildRenderPlan for each acceptance department resolves entity groups against the real catalog', () => {
  const catalog = REAL_CATALOG_NAMES.map((name) => ({ name }))
  ACCEPTANCE_DEPARTMENTS.forEach((id) => {
    const config = DEPARTMENT_CONFIGS[id]
    const plan = buildRenderPlan({ config, catalog, facilities: fixtureFacilities, layersByName: {}, populationLayers: {}, roadLayers: {}, hazardLayerData: [] })
    plan.resolvedEntityGroups.forEach((group) => assert.equal(group.available, true, `${id}: ${group.id} should resolve`))
  })
})

check('end-to-end render plan for health produces real KPIs, gaps and priority rows', () => {
  const config = DEPARTMENT_CONFIGS.health
  const plan = buildRenderPlan({
    config,
    catalog: REAL_CATALOG_NAMES.map((name) => ({ name })),
    facilities: fixtureFacilities,
    layersByName: {},
    populationLayers: { Rural_population: populationLayer },
    roadLayers: { Other_Roads: layerFixture('Other_Roads', 'LineString', [{ id: 'r1', geometry: { type: 'LineString', coordinates: [[85.3, 25.1], [85.5, 25.3]] }, properties: {} }]) },
    hazardLayerData: [floodLayer],
  })
  assert.equal(plan.entities.length, 2)
  assert.ok(plan.coverage.computed)
  assert.equal(plan.kpis.find((k) => k.key === 'entity-count').value, 2)
  assert.equal(plan.gaps.find((g) => g.key === 'coverage').status, 'computed')
  assert.equal(plan.gaps.find((g) => g.key === 'service').status, 'unavailable')
  assert.ok(plan.ranked.some((r) => r.entity.name === 'Nalanda Hospital' && r.priority.band === 'P2' && r.priority.score >= 0.7), 'flood-exposed high-gap hospital ranks P2 with the configured weights')
  assert.ok(plan.resolvedHazardLayers.every((h) => h.available))
})

// ---------------------------------------------------------------------------
// 11. Live backend cross-check (optional — skipped offline)
// ---------------------------------------------------------------------------
check('every config-referenced layer exists in the LIVE catalog (network)', async () => {
  let live
  try {
    const response = await fetch('https://nalanda.drdesigntech.com/api/gis/catalog/')
    live = await response.json()
  } catch {
    console.log('  - live catalog unreachable — offline check skipped')
    return
  }
  const liveNames = new Set(Object.values(live.categories || {}).flat().map((layer) => layer.layer_name))
  Object.values(DEPARTMENT_CONFIGS).forEach((config) => {
    config.entityGroups.filter((g) => g.source === 'gis-layer').forEach((group) => {
      assert.ok(liveNames.has(group.layerName), `${config.departmentId}: ${group.layerName} missing from live catalog`)
    })
    config.contextLayers.forEach((layer) => assert.ok(liveNames.has(layer.layerName), `${config.departmentId}: context ${layer.layerName} missing live`))
  })
  assert.ok(liveNames.size >= REAL_CATALOG_NAMES.length)
})

console.log(`\nDepartment Decision Support acceptance: ${passed} checks passed`)

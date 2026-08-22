// Department Decision Support — data access per department configuration.
//
// Performance rule (§18): only the SELECTED department's entity groups and
// context layers are loaded.  Every GET is cached (layer cache shared with the
// Spatial Analysis engine, facilities cache shared with the whole platform),
// so switching departments never re-downloads shared collections.
//
// Telemetry endpoints are PROBED once per department (GET → 404/405 means the
// contract is not deployed) and every probe result feeds the "Data not
// available" states with the exact dependency — never a fabricated number.
import { apiRequest } from './apiClient'
import { cachedFacilities } from './facilityCache'
import { loadCatalog, loadLayerFeatures } from './spatialAnalysisApi'

const probeCache = new Map()
const departmentDataCache = new Map()

async function probeEndpoint(endpoint) {
  if (probeCache.has(endpoint)) return probeCache.get(endpoint)
  let status
  try {
    await apiRequest(endpoint, { timeout: 10000 })
    status = 'available'
  } catch (error) {
    status = error?.status === 404 || error?.status === 405 ? 'not-deployed' : 'unverified'
  }
  probeCache.set(endpoint, status)
  return status
}

// A convenience map of the per-department telemetry contract.  Kept here so
// the workspace can explain WHY a domain is unavailable without hardcoding.
export async function probeDepartmentEndpoints(config = {}) {
  const endpoints = config.dataEndpoints || []
  const results = await Promise.all(
    endpoints.map(async (entry) => ({
      ...entry,
      status: await probeEndpoint(entry.endpoint),
    }))
  )
  return results
}

export async function loadDepartmentData(config = {}) {
  const departmentId = config.departmentId
  const cached = departmentDataCache.get(departmentId)
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return cached.data

  const [catalogResponse, facilities] = await Promise.all([loadCatalog(), cachedFacilities()])

  // loadCatalog() returns the mapped catalog object ({ categories, totalLayers,
  // raw }); buildRenderPlan consumes a flat list of { name, ... } layers.
  const catalog = Object.values(catalogResponse.categories || {}).flat()

  // Entity group layers (GIS layers only — facility categories resolve from
  // the already-mapped facilities collection).
  const gisEntityLayers = {}
  await Promise.all(
    (config.entityGroups || [])
      .filter((group) => group.source === 'gis-layer')
      .map(async (group) => {
        gisEntityLayers[group.layerName] = await loadLayerFeatures(group.layerName)
      })
  )

  // Context layers by role (population, roads, boundary) and hazard layers.
  const populationLayers = {}
  const roadLayers = {}
  const boundaryLayers = {}
  const hazardLayerData = []
  const contextNames = (config.contextLayers || []).map((layer) => layer.layerName)
  const allLayerNames = [...new Set([...contextNames, ...(config.hazardLayers || [])])]
  await Promise.all(
    allLayerNames.map(async (name) => {
      const data = await loadLayerFeatures(name)
      const context = (config.contextLayers || []).find((layer) => layer.layerName === name)
      if (context?.role === 'population') populationLayers[name] = data
      else if (context?.role === 'roads') roadLayers[name] = data
      else if (context?.role === 'boundary') boundaryLayers[name] = data
      if ((config.hazardLayers || []).includes(name)) hazardLayerData.push(data)
    })
  )

  // Telemetry probes MUST NOT gate the render: they only refine the "Data not
  // available" details that the sections already render honestly.  The probe
  // promise is resolved in the background and attached when ready.
  const endpointsPromise = probeDepartmentEndpoints(config)

  const data = {
    catalog,
    facilities,
    layersByName: gisEntityLayers,
    populationLayers,
    roadLayers,
    boundaryLayers,
    hazardLayerData,
    endpointsPromise,
  }
  departmentDataCache.set(departmentId, { at: Date.now(), data })
  return data
}

export function clearDepartmentDataCache() {
  departmentDataCache.clear()
  probeCache.clear()
}

// Citizen signals for a department — REAL complaints routed to its slug.
export function complaintsForDepartment(complaints = [], departmentId = '') {
  return (complaints || []).filter((complaint) => String(complaint.departmentSlug || complaint.departmentId || '') === String(departmentId))
}
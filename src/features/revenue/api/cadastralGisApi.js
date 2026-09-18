// Cadastral GIS API — Interfacing with authoritative backend endpoint GET /api/gis/layers/data_resi/
import { apiRequest, withQuery } from '../../../api/apiClient.js'

const CADASTRAL_RESI_ENDPOINT = '/gis/layers/data_resi/'

export function validateGeoJsonGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') return false
  if (!geometry.type || !Array.isArray(geometry.coordinates)) return false
  const validTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']
  return validTypes.includes(geometry.type)
}

export function normalizeCadastralFeatureCollection(geoJsonData) {
  if (!geoJsonData || typeof geoJsonData !== 'object') {
    return { type: 'FeatureCollection', features: [], diagnostics: { total: 0, valid: 0, invalid: 0 } }
  }

  const rawFeatures = Array.isArray(geoJsonData.features) 
    ? geoJsonData.features 
    : (Array.isArray(geoJsonData.data?.features)
      ? geoJsonData.data.features
      : (Array.isArray(geoJsonData.data)
        ? geoJsonData.data
        : (Array.isArray(geoJsonData) ? geoJsonData : [])))

  let validCount = 0
  let invalidCount = 0

  const features = rawFeatures.map((feat, idx) => {
    const properties = feat.properties || feat || {}
    const geometry = feat.geometry || (feat.lat && feat.lng ? { type: 'Point', coordinates: [Number(feat.lng), Number(feat.lat)] } : null)
    const isValidGeom = validateGeoJsonGeometry(geometry)

    if (isValidGeom) {
      validCount++
    } else {
      invalidCount++
    }

    const id = String(feat.id || properties.id || properties.plot_id || properties.property_id || `feat-${idx}`)
    const taxStatus = properties.taxStatus || ((properties.paid_status || properties.is_paid || properties.status === 'PAID') 
      ? 'paid' 
      : (properties.arrears > 0 ? 'arrears' : 'due'))

    return {
      type: 'Feature',
      id,
      geometry,
      properties: {
        ...properties,
        id,
        plotId: properties.plotId || properties.plot_id || properties.plot_no || id,
        ownerName: properties.ownerName || properties.owner_name || properties.owner || '',
        taxStatus,
        demand: Number(properties.demand || properties.tax_amount || 0),
        paid: Number(properties.paid || properties.paid_amount || 0),
        outstanding: Number(properties.outstanding || properties.due_amount || 0),
        totalArrears: Number(properties.totalArrears || properties.arrears || 0),
        isValidGeometry: isValidGeom
      }
    }
  })

  const collection = {
    type: 'FeatureCollection',
    features: features.filter(f => f.geometry && f.properties.isValidGeometry),
    diagnostics: {
      total: rawFeatures.length,
      valid: validCount,
      invalid: invalidCount
    }
  }

  if (import.meta.env.DEV) {
    console.info('[REVENUE GIS] Cadastral FeatureCollection normalized', {
      totalInput: rawFeatures.length,
      validCount,
      invalidCount,
      featureCount: collection.features.length,
      geometryTypes: [...new Set(collection.features.map(f => f.geometry?.type))]
    })
  }

  return collection
}

export const cadastralGisApi = {
  /**
   * Fetch cadastral residential layer polygons from GET /api/gis/layers/data_resi/
   * @param {Object} params - Optional query parameters
   */
  async fetchCadastralLayer(params = {}) {
    if (import.meta.env.DEV) {
      console.info('[REVENUE GIS] Sending request to GET /api/gis/layers/data_resi/', params)
    }
    try {
      const response = await apiRequest(withQuery(CADASTRAL_RESI_ENDPOINT, params), { timeout: 120000 })
      if (import.meta.env.DEV) {
        console.info('[REVENUE GIS] Cadastral API response received', response)
      }
      return normalizeCadastralFeatureCollection(response)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[REVENUE GIS] Cadastral API request failed', err)
      }
      throw err
    }
  }
}

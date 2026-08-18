// State GIS & Assets store (P8).
// BACKEND-INTEGRATED: the asset registry hydrates from the facility registry
// (GET /api/facilities/) and asset mutations write through the same API.
// Layer toggles are view configuration; asset records are never fabricated.
import { create } from 'zustand'
import { useStateFinanceStore } from './stateFinanceStore'
import { backendGisApi } from '../../../api/gisApi'
import { backendFacilityApi } from '../../../api/facilityApi'

export const ASSET_CATEGORIES = [
  { value: 'health_institution', label: 'Health Institution' },
  { value: 'education_institution', label: 'Education Institution' },
  { value: 'road_bridge', label: 'Road / Bridge' },
  { value: 'power_substation', label: 'Power Substation' },
  { value: 'water_plant', label: 'Water Supply Plant' },
  { value: 'solar_asset', label: 'Solar / Renewable Asset' },
  { value: 'civic_infrastructure', label: 'Civic Infrastructure' },
  { value: 'government_office', label: 'Government Office' },
  { value: 'tourism_asset', label: 'Tourism Asset' },
]

// Map layers are view toggles (configuration, not data).
export const SEED_GIS_LAYERS = [
  { id: 'boundaries', label: 'District Boundaries', type: 'polygon', visible: true },
  { id: 'assets', label: 'State Assets', type: 'point', visible: true },
  { id: 'projects', label: 'Projects', type: 'point', visible: false },
  { id: 'heat', label: 'Asset Density Heat', type: 'heat', visible: false },
]

const mapAsset = (facility) => ({
  id: facility.id,
  name: facility.name,
  category: facility.categoryId || 'civic_infrastructure',
  categoryLabel: facility.categoryLabel,
  departmentId: facility.departmentId || null,
  departmentName: facility.departmentName || '',
  districtId: facility.districtId || null,
  districtName: facility.districtName || '',
  lat: facility.latitude,
  lng: facility.longitude,
  valueCr: 0,
  condition: facility.attributes?.condition_rating || '',
  status: facility.status || 'active',
  lastInspection: '',
  owner: facility.departmentName || 'Department record',
  raw: facility.raw || facility,
})

export const useStateGisStore = create((set, get) => ({
  assets: [],
  layers: SEED_GIS_LAYERS,

  async hydrateFromBackend() {
    const facilities = await backendGisApi.facilities().catch(() => [])
    set({ assets: (facilities || []).map(mapAsset) })
  },

  async addAsset(asset) {
    const record = await backendFacilityApi.create({
      name: asset.name,
      category: asset.category,
      department: asset.departmentId || null,
      district: asset.districtId || null,
      latitude: asset.lat,
      longitude: asset.lng,
      status: 'active',
      attributes: { condition_rating: asset.condition || '', value_cr: asset.valueCr || 0 },
    })
    useStateFinanceStore.getState().writeAudit({ actor: asset.actor || {}, action: 'GIS_ASSET_CREATED', entity: 'gis_asset', entityId: record.id, newValue: record, reason: `Asset registered: ${record.name}` })
    await get().hydrateFromBackend()
    return record
  },
  async updateAsset(id, updates) {
    await backendFacilityApi.update(id, {
      name: updates.name,
      status: updates.status,
      latitude: updates.lat,
      longitude: updates.lng,
    })
    useStateFinanceStore.getState().writeAudit({ actor: updates.actor || {}, action: 'GIS_ASSET_UPDATED', entity: 'gis_asset', entityId: id, newValue: updates })
    await get().hydrateFromBackend()
  },
  async toggleAssetStatus(id) {
    const asset = get().assets.find((a) => a.id === id)
    if (!asset) return
    const status = asset.status === 'active' ? 'inactive' : 'active'
    await backendFacilityApi.update(id, { status })
    useStateFinanceStore.getState().writeAudit({ actor: {}, action: 'GIS_ASSET_STATUS', entity: 'gis_asset', entityId: id, oldValue: asset.status, newValue: status })
    await get().hydrateFromBackend()
  },
  setLayerVisible(id, visible) {
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, visible } : l)) }))
  },
}))

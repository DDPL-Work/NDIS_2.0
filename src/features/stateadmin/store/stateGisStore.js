// State GIS & Assets store (P8).
// Asset registry (lat/lng per asset, category + department + district scope)
// and togglable layer definitions for the map surface. Assets written here
// are reflected into the state admin audit trail.
import { create } from 'zustand'
import { useStateFinanceStore } from './stateFinanceStore'

export const SEED_ASSETS = [
  { id: 'AST-PAT-RMCH', name: 'Patna Medical College & Hospital', category: 'health_institution', departmentId: 'health', districtId: 'patna', lat: 25.608, lng: 85.138, valueCr: 350, installedYear: 1968, condition: 'good', status: 'active', lastInspection: '2026-06-15', owner: 'State Government' },
  { id: 'AST-NAL-DH', name: 'Nalanda District Hospital Complex', category: 'health_institution', departmentId: 'health', districtId: 'nalanda', lat: 25.136, lng: 85.441, valueCr: 120, installedYear: 1972, condition: 'fair', status: 'active', lastInspection: '2026-05-02', owner: 'State Government' },
  { id: 'AST-PAT-PMU', name: 'Patna Multi-Unit Housing Block', category: 'education_institution', departmentId: 'education', districtId: 'patna', lat: 25.594, lng: 85.116, valueCr: 45, installedYear: 2005, condition: 'good', status: 'active', lastInspection: '2026-04-18', owner: 'Education Dept' },
  { id: 'AST-NAL-MODEL', name: 'Nalanda Model School Complex', category: 'education_institution', departmentId: 'education', districtId: 'nalanda', lat: 25.17, lng: 85.44, valueCr: 28, installedYear: 2018, condition: 'excellent', status: 'active', lastInspection: '2026-07-01', owner: 'Education Dept' },
  { id: 'AST-PAT-MAH', name: 'Mahatma Gandhi Setu (Bridge)', category: 'road_bridge', departmentId: 'pwd', districtId: 'patna', lat: 25.625, lng: 85.215, valueCr: 210, installedYear: 1982, condition: 'fair', status: 'active', lastInspection: '2026-06-22', owner: 'PWD Department' },
  { id: 'AST-NAL-RAJGIR', name: 'Nalanda–Rajgir Road Spur (NH-33)', category: 'road_bridge', departmentId: 'pwd', districtId: 'nalanda', lat: 25.04, lng: 85.42, valueCr: 95, installedYear: 2003, condition: 'good', status: 'active', lastInspection: '2026-05-28', owner: 'PWD Department' },
  { id: 'AST-GYA-SUB', name: 'Gaya 132kV Grid Substation', category: 'power_substation', departmentId: 'electricity', districtId: 'gaya', lat: 24.795, lng: 84.998, valueCr: 75, installedYear: 1995, condition: 'good', status: 'active', lastInspection: '2026-07-12', owner: 'BSEB' },
  { id: 'AST-MFP-SUB', name: 'Muzaffarpur 220kV Grid Substation', category: 'power_substation', departmentId: 'electricity', districtId: 'muzaffarpur', lat: 26.13, lng: 85.41, valueCr: 130, installedYear: 1988, condition: 'fair', status: 'active', lastInspection: '2026-03-19', owner: 'BSEB' },
  { id: 'AST-PAT-WTP', name: 'Patna Water Treatment Plant (Phulwari)', category: 'water_plant', departmentId: 'water', districtId: 'patna', lat: 25.575, lng: 85.075, valueCr: 88, installedYear: 2009, condition: 'good', status: 'active', lastInspection: '2026-06-30', owner: 'PHED' },
  { id: 'AST-DRB-WTP', name: 'Darbhanga Cluster Water Supply Plant', category: 'water_plant', departmentId: 'water', districtId: 'darbhanga', lat: 26.15, lng: 85.89, valueCr: 52, installedYear: 2016, condition: 'excellent', status: 'active', lastInspection: '2026-07-20', owner: 'PHED' },
  { id: 'AST-BDG-SOLAR', name: 'Bodh Gaya Rooftop Solar Array', category: 'solar_asset', departmentId: 'solar', districtId: 'gaya', lat: 24.696, lng: 84.991, valueCr: 18, installedYear: 2024, condition: 'excellent', status: 'active', lastInspection: '2026-07-08', owner: 'BREDA' },
  { id: 'AST-MFP-PARK', name: 'Muzaffarpur Solid Waste Park', category: 'civic_infrastructure', departmentId: 'urban', districtId: 'muzaffarpur', lat: 26.11, lng: 85.38, valueCr: 60, installedYear: 2021, condition: 'fair', status: 'active', lastInspection: '2026-05-05', owner: 'ULB / Urban Dept' },
  { id: 'AST-PAT-CIRCUIT', name: 'Patna Assembly Circuit Office Complex', category: 'government_office', departmentId: null, districtId: 'patna', lat: 25.594, lng: 85.118, valueCr: 155, installedYear: 1975, condition: 'good', status: 'active', lastInspection: '2026-04-25', owner: 'General Administration Dept' },
  { id: 'AST-GYA-TOUR', name: 'Bodh Gaya Tourist Facilitation Centre', category: 'tourism_asset', departmentId: 'tourism', districtId: 'gaya', lat: 24.7, lng: 84.985, valueCr: 34, installedYear: 2011, condition: 'good', status: 'active', lastInspection: '2026-06-11', owner: 'Tourism Dept' },
]

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

// Map layers are data (toggles) — the renderer composes them from stores.
export const SEED_GIS_LAYERS = [
  { id: 'boundaries', label: 'District Boundaries', type: 'polygon', visible: true },
  { id: 'assets', label: 'State Assets', type: 'point', visible: true },
  { id: 'projects', label: 'Projects', type: 'point', visible: false },
  { id: 'heat', label: 'Asset Density Heat', type: 'heat', visible: false },
  { id: 'roads', label: 'Major Roads (illustrative)', type: 'line', visible: false },
]

export const useStateGisStore = create((set, get) => ({
  assets: SEED_ASSETS,
  layers: SEED_GIS_LAYERS,

  addAsset(asset) {
    const id = asset.id || `AST-${Date.now().toString(36).toUpperCase()}`
    const record = { id, status: 'active', ...asset }
    if (get().assets.some((a) => a.id === id)) throw new Error(`Asset ${id} already registered.`)
    set((s) => ({ assets: [record, ...s.assets] }))
    useStateFinanceStore.getState().writeAudit({ actor: asset.actor || {}, action: 'GIS_ASSET_CREATED', entity: 'gis_asset', entityId: id, newValue: record, reason: `Asset registered: ${record.name}` })
  },
  updateAsset(id, updates) {
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...updates } : a)) }))
    useStateFinanceStore.getState().writeAudit({ actor: updates.actor || {}, action: 'GIS_ASSET_UPDATED', entity: 'gis_asset', entityId: id, newValue: updates })
  },
  toggleAssetStatus(id) {
    const asset = get().assets.find((a) => a.id === id)
    if (!asset) return
    const status = asset.status === 'active' ? 'inactive' : 'active'
    set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, status } : a)) }))
    useStateFinanceStore.getState().writeAudit({ actor: {}, action: 'GIS_ASSET_STATUS', entity: 'gis_asset', entityId: id, oldValue: asset.status, newValue: status })
  },
  setLayerVisible(id, visible) {
    set((s) => ({ layers: s.layers.map((l) => (l.id === id ? { ...l, visible } : l)) }))
  },
}))
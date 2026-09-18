import { area as geoJsonArea } from '@turf/turf'

// Geometry may supply an approximate area when the backend has none. Tax is
// always an authoritative backend value; never manufacture it from area.
export function calculatePropertyTax(feature) {
  const suppliedArea = Number(feature?.properties?.area_sqft ?? feature?.properties?.estimated_area_sqft)
  let areaSqft = Number.isFinite(suppliedArea) && suppliedArea > 0 ? suppliedArea : 0
  if (!areaSqft && feature?.geometry) {
    try { areaSqft = geoJsonArea(feature) * 10.7639 } catch { areaSqft = 0 }
  }
  const suppliedTax = Number(feature?.properties?.tax_amount ?? feature?.properties?.estimated_tax ?? feature?.properties?.base_tax)
  const baseTax = Number.isFinite(suppliedTax) && suppliedTax >= 0 ? suppliedTax : null
  return { areaSqft: areaSqft ? Math.round(areaSqft * 100) / 100 : null, baseTax, cess: null, totalAmount: baseTax }
}

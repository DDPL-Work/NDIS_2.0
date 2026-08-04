// Approximate district boundary polygons for pilot districts (Nalanda, Rajgir).
// Production source: GeoServer WMTS from Survey of India / BHUVAN boundary tiles.
// These are bounding-box approximations sufficient for the pilot UI demonstration.
// Coordinates: [longitude, latitude] (GeoJSON convention).

export const DISTRICT_BOUNDARIES = {
  nalanda: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Nalanda', districtId: 'nalanda' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [85.1200, 25.0100],
            [85.1200, 25.3800],
            [85.5900, 25.3800],
            [85.7000, 25.2500],
            [85.6500, 25.0100],
            [85.3500, 24.9200],
            [85.1200, 25.0100],
          ]],
        },
      },
    ],
  },
  rajgir: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Rajgir', districtId: 'rajgir' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [85.3400, 24.9900],
            [85.3400, 25.1100],
            [85.5200, 25.1100],
            [85.5200, 24.9900],
            [85.3400, 24.9900],
          ]],
        },
      },
    ],
  },
  patna: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Patna', districtId: 'patna' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [84.8500, 25.4000],
            [84.8500, 25.7800],
            [85.4200, 25.7800],
            [85.4200, 25.4000],
            [84.8500, 25.4000],
          ]],
        },
      },
    ],
  },
  gaya: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: 'Gaya', districtId: 'gaya' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [84.6500, 24.5500],
            [84.6500, 25.0200],
            [85.3000, 25.0200],
            [85.3000, 24.5500],
            [84.6500, 24.5500],
          ]],
        },
      },
    ],
  },
}

export function getDistrictBoundary(districtId) {
  return DISTRICT_BOUNDARIES[districtId] || null
}

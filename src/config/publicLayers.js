// Public Layer Registry — defines which GIS layers are accessible to
// anonymous/public users. Only layers with public: true are exposed
// on the /explore map.
//
// Layer IDs must match the backend GIS catalog layer names.
export const PUBLIC_LAYERS = [
  {
    id: 'district-boundaries',
    label: 'District Boundaries',
    public: true,
    category: 'Boundaries',
  },
  {
    id: 'block-boundaries',
    label: 'Block Boundaries',
    public: true,
    category: 'Boundaries',
  },
  {
    id: 'village-boundaries',
    label: 'Village Boundaries',
    public: true,
    category: 'Boundaries',
  },
  {
    id: 'public-facilities',
    label: 'Public Facilities',
    public: true,
    category: 'Facilities',
  },
  {
    id: 'healthcare',
    label: 'Healthcare Facilities',
    public: true,
    category: 'Healthcare',
  },
  {
    id: 'education',
    label: 'Education Facilities',
    public: true,
    category: 'Education',
  },
  {
    id: 'government-services',
    label: 'Government Services',
    public: true,
    category: 'Services',
  },
  {
    id: 'tourism',
    label: 'Tourist Places',
    public: true,
    category: 'Tourism',
  },
  {
    id: 'water-supply',
    label: 'Water Supply',
    public: true,
    category: 'Infrastructure',
  },
  {
    id: 'roads',
    label: 'Road Network',
    public: true,
    category: 'Transport',
  },
]

// Returns a Set of public layer IDs for fast lookup
export function getPublicLayerIds() {
  return new Set(PUBLIC_LAYERS.filter((l) => l.public).map((l) => l.id))
}

// Filters a catalog to only include public layers
export function filterCatalogForPublic(catalog) {
  if (!catalog || !catalog.categories) return { categories: {} }
  const publicIds = getPublicLayerIds()
  const filteredCategories = {}

  for (const [category, layers] of Object.entries(catalog.categories)) {
    const publicLayers = (layers || []).filter((layer) => publicIds.has(layer.name))
    if (publicLayers.length > 0) {
      filteredCategories[category] = publicLayers
    }
  }

  return { ...catalog, categories: filteredCategories }
}

// Checks if a layer is public
export function isLayerPublic(layerName) {
  return getPublicLayerIds().has(layerName)
}
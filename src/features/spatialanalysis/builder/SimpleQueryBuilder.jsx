import { useState, useMemo, useCallback } from 'react'
import clsx from 'clsx'
import { Heart, Users, GraduationCap, MapPin, AlertTriangle, Search, ChevronDown, ChevronRight, Settings2, Sparkles } from 'lucide-react'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'

// ---------------------------------------------------------------------------
// Search templates — each maps a human question to a partial query structure.
// These translate directly into the existing spatialAnalysis query contract.
// ---------------------------------------------------------------------------

const SEARCH_TEMPLATES = [
  {
    id: 'health_access',
    icon: Heart,
    title: 'Health Access',
    description: 'Find villages with poor access to health facilities.',
    color: 'alert',
    defaultQuery: {
      targetLayerType: 'gis-layer',
      targetLayerId: 'Rural_population',
      referenceType: 'facility-category',
      referenceId: 'health',
      condition: 'within_radius',
      distanceKm: 5,
      filters: [
        { field: 'accessibility', operator: 'eq', value: 'Poor' },
      ],
    },
  },
  {
    id: 'population_services',
    icon: Users,
    title: 'Population & Services',
    description: 'Find highly populated areas with limited services.',
    color: 'saffron',
    defaultQuery: {
      targetLayerType: 'gis-layer',
      targetLayerId: 'Rural_population',
      referenceType: 'facility-category',
      referenceId: 'health',
      condition: 'within_radius',
      distanceKm: 10,
      filters: [
        { field: 'population', operator: 'gte', value: '1000' },
        { field: 'accessibility', operator: 'eq', value: 'Poor' },
      ],
    },
  },
  {
    id: 'education_access',
    icon: GraduationCap,
    title: 'Education Access',
    description: 'Find areas that may need better access to schools.',
    color: 'sky',
    defaultQuery: {
      targetLayerType: 'gis-layer',
      targetLayerId: 'Rural_population',
      referenceType: 'facility-category',
      referenceId: 'education',
      condition: 'within_radius',
      distanceKm: 3,
      filters: [],
    },
  },
  {
    id: 'nearby_locations',
    icon: MapPin,
    title: 'Nearby Locations',
    description: 'Find locations within a selected distance.',
    color: 'leaf',
    defaultQuery: {
      targetLayerType: 'gis-layer',
      targetLayerId: 'Rural_population',
      referenceType: 'facility-category',
      referenceId: 'health',
      condition: 'within_radius',
      distanceKm: 5,
      filters: [],
    },
  },
  {
    id: 'priority_areas',
    icon: AlertTriangle,
    title: 'Priority Areas',
    description: 'Find areas that may require urgent attention.',
    color: 'alert',
    defaultQuery: {
      targetLayerType: 'gis-layer',
      targetLayerId: 'Rural_population',
      referenceType: 'facility-category',
      referenceId: 'health',
      condition: 'within_radius',
      distanceKm: 10,
      filters: [
        { field: 'population', operator: 'gte', value: '500' },
      ],
    },
  },
  {
    id: 'custom',
    icon: Search,
    title: 'Custom Search',
    description: 'Build your own search.',
    color: 'ink',
    defaultQuery: {
      targetLayerType: 'gis-layer',
      targetLayerId: '',
      referenceType: 'facility-category',
      referenceId: '',
      condition: 'within_radius',
      distanceKm: 5,
      filters: [],
    },
  },
]

const CONDITION_OPTIONS = [
  { value: 'within_radius', label: 'Within' },
  { value: 'buffer', label: 'Inside buffer zone of' },
  { value: 'nearest', label: 'Nearest to' },
  { value: 'distance', label: 'Distance from' },
]

const DISTANCE_OPERATOR_OPTIONS = [
  { value: 'within', label: 'Within' },
  { value: 'more_than', label: 'More than' },
]

const POPULATION_OPERATOR_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'gte', label: 'At least' },
  { value: 'lte', label: 'At most' },
  { value: 'gt', label: 'More than' },
  { value: 'lt', label: 'Less than' },
]

const ACCESSIBILITY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Good', label: 'Good' },
]

// ---------------------------------------------------------------------------
// Example questions for the empty state
// ---------------------------------------------------------------------------

const EXAMPLE_QUESTIONS = [
  { text: 'Which villages have poor access to health facilities?', templateId: 'health_access' },
  { text: 'Which high-population villages are more than 5 km from a health facility?', templateId: 'population_services' },
  { text: 'Where should we prioritize intervention?', templateId: 'priority_areas' },
]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SimpleQueryBuilder({
  query,
  setQuery,
  layers,
  onExecute,
  loading,
  hasResults,
  onSwitchToAdvanced,
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const layerOptions = useMemo(() => [
    ...(layers?.gisLayers || []).map((l) => ({ value: `gis-layer:${l.id}`, label: l.name })),
    ...(layers?.facilityCategories || []).map((c) => ({ value: `facility-category:${c.id}`, label: c.name })),
  ], [layers])

  const referenceOptions = useMemo(() => [
    ...(layers?.facilityCategories || []).map((c) => ({ value: c.id, label: c.name })),
    { value: '__point', label: 'A specific location on the map' },
  ], [layers])

  // Current form state derived from query
  const formState = useMemo(() => {
    const targetId = query.targetLayer ? `${query.targetLayer.type}:${query.targetLayer.id}` : ''
    const refId = query.spatial?.reference?.id || ''
    const refType = query.spatial?.reference?.type || 'facility-category'
    const distKm = Number(query.spatial?.distanceKm) || 5
    const condition = query.spatial?.condition || 'within_radius'

    const filters = query.filters || []
    const popFilter = filters.find((f) => f.field === 'population')
    const accessFilter = filters.find((f) => f.field === 'accessibility')

    return {
      targetId,
      refId: refType === 'point' ? '__point' : refId,
      condition,
      distanceKm: distKm,
      populationOperator: popFilter?.operator || '',
      populationValue: popFilter?.value || '',
      accessibility: accessFilter?.value || '',
    }
  }, [query])

  // Apply a template to the query
  const applyTemplate = useCallback((template) => {
    setSelectedTemplate(template.id)
    const q = template.defaultQuery
    const targetLayer = layerOptions.find((o) => o.value === `${q.targetLayerType}:${q.targetLayerId}`)
    const referenceLayer = layerOptions.find((o) => o.value === `${q.referenceType}:${q.referenceId}`)

    setQuery((current) => ({
      ...current,
      targetLayer: targetLayer
        ? { type: q.targetLayerType, id: q.targetLayerId, name: targetLayer.label, geometryType: q.targetLayerType === 'gis-layer' ? 'Polygon' : 'Point' }
        : current.targetLayer,
      spatial: {
        ...current.spatial,
        condition: q.condition,
        distanceKm: q.distanceKm,
        reference: { type: q.referenceType, id: q.referenceId, name: referenceLayer?.label || q.referenceId, geometryType: 'Point', point: current.spatial?.reference?.point || null },
      },
      filters: q.filters.map((f, i) => ({ ...f, id: `simple-${i}-${Date.now()}`, logic: 'and' })),
      outputFields: ['name', 'population', 'nearestFacility', 'distanceKm', 'accessibility', 'gapScore', 'priorityScore'],
      sort: { field: 'priorityScore', direction: 'desc' },
      limit: 50,
    }))
    setShowFilters(q.filters.length > 0)
  }, [layerOptions, setQuery])

  // Handle example question click
  const handleExampleClick = useCallback((templateId) => {
    const template = SEARCH_TEMPLATES.find((t) => t.id === templateId)
    if (template) applyTemplate(template)
  }, [applyTemplate])

  // Patch helpers
  const patchTarget = useCallback((value) => {
    if (!value) {
      setQuery((c) => ({ ...c, targetLayer: null }))
      return
    }
    const [type, ...rest] = value.split(':')
    const id = rest.join(':')
    const layer = layerOptions.find((o) => o.value === value)
    setQuery((c) => ({
      ...c,
      targetLayer: { type, id, name: layer?.label || id, geometryType: type === 'gis-layer' ? 'Polygon' : 'Point' },
    }))
  }, [layerOptions, setQuery])

  const patchReference = useCallback((value) => {
    if (!value) {
      setQuery((c) => ({ ...c, spatial: { ...c.spatial, reference: { type: 'facility-category', id: '', name: '', geometryType: 'Point', point: null } } }))
      return
    }
    if (value === '__point') {
      setQuery((c) => ({ ...c, spatial: { ...c.spatial, reference: { type: 'point', id: 'point', name: 'Picked point', geometryType: 'Point', point: null } } }))
      return
    }
    const category = (layers?.facilityCategories || []).find((c) => c.id === value)
    setQuery((c) => ({
      ...c,
      spatial: { ...c.spatial, reference: { type: 'facility-category', id: value, name: category?.name || value, geometryType: 'Point', point: c.spatial?.reference?.point || null } },
    }))
  }, [layers, setQuery])

  const patchCondition = useCallback((value) => {
    setQuery((c) => ({ ...c, spatial: { ...c.spatial, condition: value } }))
  }, [setQuery])

  const patchDistance = useCallback((value) => {
    setQuery((c) => ({ ...c, spatial: { ...c.spatial, distanceKm: value } }))
  }, [setQuery])

  const patchPopulation = useCallback((operator, value) => {
    setQuery((c) => {
      const filters = (c.filters || []).filter((f) => f.field !== 'population')
      if (!operator || !value) return { ...c, filters }
      return { ...c, filters: [...filters, { id: `pop-${Date.now()}`, field: 'population', operator, value, logic: 'and' }] }
    })
  }, [setQuery])

  const patchAccessibility = useCallback((value) => {
    setQuery((c) => {
      const filters = (c.filters || []).filter((f) => f.field !== 'accessibility')
      if (!value) return { ...c, filters }
      return { ...c, filters: [...filters, { id: `acc-${Date.now()}`, field: 'accessibility', operator: 'eq', value, logic: 'and' }] }
    })
  }, [setQuery])

  const canExecute = formState.targetId && formState.refId && formState.refId !== '__point'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-semibold text-ink-950 flex items-center gap-2">
              <Sparkles size={18} className="text-saffron-500" /> Find Locations
            </h2>
            <p className="text-[13px] text-ink-500 mt-1">Use simple questions to identify areas that may need attention.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onSwitchToAdvanced} className="shrink-0 text-ink-500 hover:text-ink-800">
            <Settings2 size={14} /> Advanced
          </Button>
        </div>
      </div>

      {/* Step 1: What are you looking for? */}
      {!selectedTemplate && (
        <div className="rounded-xl border border-ink-200 bg-white p-5">
          <h3 className="text-[14px] font-semibold text-ink-900 mb-1">What would you like to find?</h3>
          <p className="text-[12.5px] text-ink-500 mb-4">Choose a question to get started.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SEARCH_TEMPLATES.map((template) => {
              const Icon = template.icon
              return (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={clsx(
                    'group text-left rounded-xl border p-4 transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20',
                    selectedTemplate === template.id
                      ? 'border-ink-900 bg-ink-50'
                      : 'border-ink-200 bg-white hover:border-ink-300'
                  )}
                >
                  <div className={clsx('grid h-9 w-9 place-items-center rounded-lg mb-2.5', {
                    'bg-alert-50 text-alert-600': template.color === 'alert',
                    'bg-saffron-50 text-saffron-600': template.color === 'saffron',
                    'bg-sky-50 text-sky-600': template.color === 'sky',
                    'bg-leaf-50 text-leaf-600': template.color === 'leaf',
                    'bg-ink-100 text-ink-600': template.color === 'ink',
                  })}>
                    <Icon size={16} />
                  </div>
                  <h4 className="text-[13.5px] font-semibold text-ink-900">{template.title}</h4>
                  <p className="text-[12px] text-ink-500 mt-0.5 leading-snug">{template.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Configure conditions */}
      {selectedTemplate && (
        <div className="rounded-xl border border-ink-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-ink-900">What conditions matter?</h3>
            <button onClick={() => setSelectedTemplate(null)} className="text-[12px] text-sky-700 hover:underline font-medium">
              ← Change question
            </button>
          </div>

          {/* Location type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-ink-700">Location type</label>
              <Select
                value={formState.targetId}
                onChange={patchTarget}
                options={[{ value: '', label: 'Select locations...' }, ...layerOptions]}
                className="w-full"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-ink-700">Service to compare with</label>
              <Select
                value={formState.refId}
                onChange={patchReference}
                options={[{ value: '', label: 'Select service...' }, ...referenceOptions]}
                className="w-full"
              />
            </div>
          </div>

          {/* Distance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-ink-700">Distance condition</label>
              <Select
                value={formState.condition}
                onChange={patchCondition}
                options={CONDITION_OPTIONS}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-ink-700">Distance (km)</label>
              <input
                type="number"
                min={0.1}
                max={200}
                step={0.5}
                value={formState.distanceKm}
                onChange={(e) => patchDistance(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              />
            </div>
          </div>

          {/* Additional conditions (collapsible) */}
          <div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-600 hover:text-ink-900 transition-colors"
            >
              {showFilters ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Additional conditions
              {(formState.populationOperator || formState.accessibility) && (
                <Badge tone="info" className="ml-1">
                  {[formState.populationOperator && 'Population', formState.accessibility && 'Accessibility'].filter(Boolean).join(' + ')}
                </Badge>
              )}
            </button>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-ink-100 bg-ink-50/40">
                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-medium text-ink-700">Population</label>
                  <div className="flex gap-2">
                    <Select
                      value={formState.populationOperator}
                      onChange={(op) => patchPopulation(op, formState.populationValue)}
                      options={POPULATION_OPERATOR_OPTIONS}
                      small
                      className="flex-shrink-0"
                    />
                    {formState.populationOperator && (
                      <input
                        type="number"
                        min={0}
                        value={formState.populationValue}
                        onChange={(e) => patchPopulation(formState.populationOperator, e.target.value)}
                        placeholder="e.g. 1000"
                        className="flex-1 min-w-0 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12.5px] font-medium text-ink-700">Accessibility</label>
                  <Select
                    value={formState.accessibility}
                    onChange={patchAccessibility}
                    options={ACCESSIBILITY_OPTIONS}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Execute */}
          <div className="flex items-center gap-3 pt-2 border-t border-ink-100">
            <Button
              size="md"
              variant="primary"
              onClick={onExecute}
              disabled={loading || !canExecute}
              loading={loading}
            >
              {loading ? 'Finding locations...' : 'Find Results'}
            </Button>
            {!canExecute && (
              <span className="text-[12px] text-ink-400">Select locations and a service to compare with.</span>
            )}
          </div>
        </div>
      )}

      {/* Example questions (empty state) */}
      {!selectedTemplate && !hasResults && (
        <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-5">
          <h3 className="text-[13px] font-semibold text-ink-700 mb-2">Start with a question</h3>
          <div className="space-y-1.5">
            {EXAMPLE_QUESTIONS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example.templateId)}
                className="w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink-600 hover:bg-white hover:text-ink-900 hover:border-ink-200 border border-transparent transition-colors"
              >
                <Search size={13} className="text-ink-400 shrink-0" />
                {example.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

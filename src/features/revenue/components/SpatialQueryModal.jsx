// SpatialQueryModal — Multi-Layer Spatial & Attribute Query Builder matching tax_revenue.html
import { useState, useRef, useEffect } from 'react'
import { Button, Input, Select } from '../../../components/ui'
import { taxRevenueApi } from '../api/taxRevenueApi'
import {
  X, Filter, Play, Layers, MapPin, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Database, Map, Users, Home
} from 'lucide-react'

const TARGET_LAYERS = [
  { value: 'data_resi', label: 'Residential Properties (data_resi)', icon: Home },
  { value: 'villages', label: 'Revenue Villages / Wards', icon: Map },
  { value: 'facilities', label: 'Health & Civic Facilities', icon: Users },
  { value: 'blocks', label: 'Administrative Blocks', icon: Database },
]

export function SpatialQueryModal({
  isOpen,
  onClose,
  onLocateResult,
}) {
  const [targetLayer, setTargetLayer] = useState('data_resi')
  const [distanceKm, setDistanceKm] = useState(5)
  const [popMin, setPopMin] = useState(1000)
  const [attributeField, setAttributeField] = useState('demand')
  const [attributeOperator, setAttributeOperator] = useState('>=')
  const [attributeValue, setAttributeValue] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [results, setResults] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [serviceAvailable, setServiceAvailable] = useState(null)
  const modalRef = useRef(null)

  // Check service availability on mount
  useEffect(() => {
    if (isOpen) {
      checkServiceAvailability()
    }
  }, [isOpen])

  const checkServiceAvailability = async () => {
    try {
      await taxRevenueApi.executeSpatialQuery({ target_layer: 'data_resi', spatial_filters: [], attribute_filters: [] })
      setServiceAvailable(true)
    } catch (e) {
      setServiceAvailable(false)
    }
  }

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  const handleExecuteQuery = async () => {
    setIsExecuting(true)
    setResults(null)
    setErrorMsg(null)

    try {
      const spatialFilters = []
      if (distanceKm > 0) {
        spatialFilters.push({ type: 'within_distance', distance_km: parseFloat(distanceKm) })
      }

      const attributeFilters = []
      if (attributeValue !== '') {
        attributeFilters.push({
          field: attributeField,
          operator: attributeOperator,
          value: isNaN(attributeValue) ? attributeValue : parseFloat(attributeValue),
        })
      }

      const data = await taxRevenueApi.executeSpatialQuery({
        target_layer: targetLayer,
        spatial_filters: spatialFilters,
        attribute_filters: attributeFilters,
      })

      const list = data?.results || (Array.isArray(data) ? data : [])
      if (list.length === 0) {
        setErrorMsg('No spatial features matched your compound query parameters.')
      } else {
        setResults(list)
      }
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setErrorMsg('Spatial query service endpoint not found. Backend service may not be deployed.')
        setServiceAvailable(false)
      } else {
        setErrorMsg(err.message || 'Spatial query analysis endpoint error.')
      }
    } finally {
      setIsExecuting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        className="relative bg-slate-950 border border-slate-800 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Multi-Layer Spatial & Attribute Query Builder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Service Status */}
          {serviceAvailable === false && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Spatial query service is not currently connected. Results shown are simulated.</span>
            </div>
          )}

          {/* Target Layer */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Target Cadastral / Spatial Layer
            </label>
            <Select
              value={targetLayer}
              onValueChange={setTargetLayer}
              options={TARGET_LAYERS.map(l => ({ value: l.value, label: l.label }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Spatial Constraint */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Spatial Proximity Constraint (km)
            </label>
            <Input
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Enter distance in km (0 to disable)"
            />
            <p className="text-[11px] text-slate-500 mt-1">Find features within this distance from reference point</p>
          </div>

          {/* Attribute Filters */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-400" />
              Attribute Filter
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={attributeField}
                onValueChange={setAttributeField}
                options={[
                  { value: 'demand', label: 'Tax Demand' },
                  { value: 'area_sqft', label: 'Area (sq ft)' },
                  { value: 'paid_amount', label: 'Paid Amount' },
                  { value: 'outstanding', label: 'Outstanding' },
                ]}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500"
              />
              <Select
                value={attributeOperator}
                onValueChange={setAttributeOperator}
                options={[
                  { value: '>=', label: '>=' },
                  { value: '<=', label: '<=' },
                  { value: '>', label: '>' },
                  { value: '<', label: '<' },
                  { value: '=', label: '=' },
                  { value: '!=', label: '!=' },
                ]}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-sky-500"
              />
              <Input
                type="text"
                value={attributeValue}
                onChange={(e) => setAttributeValue(e.target.value)}
                placeholder="Value"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleExecuteQuery}
            disabled={isExecuting || serviceAvailable === false}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Query...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Execute Compound Spatial Query
              </>
            )}
          </Button>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Output */}
          {results && (
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-sky-400 flex items-center justify-between">
                <span>Query Results Output</span>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {results.length} Matching Spatial Features
                </span>
              </h4>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {results.map((res, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/90 border border-slate-700 rounded-lg text-sm flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{res.name || res.plot_no || `Feature ${idx + 1}`}</p>
                      <p className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                        <span>Layer: {res.layer || targetLayer}</span>
                        <span>Distance: {res.distance_km ? `${res.distance_km} km` : 'N/A'}</span>
                        <span>Demand: {res.demand ? `₹${res.demand.toLocaleString()}` : 'N/A'}</span>
                        <span className="text-sky-400 font-semibold">Score: {res.gap_score || res.score || 'N/A'}</span>
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        onLocateResult?.(res);
                        onClose();
                      }}
                      className="gap-1 text-sky-400 border-sky-900/50 hover:bg-sky-900/20"
                    >
                      <MapPin className="w-3 h-3" />
                      Locate
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p><strong>Tip:</strong> Combine spatial proximity with attribute filters for targeted analysis.</p>
            <p>Example: "Find residential properties within 2km of a hospital with tax demand ≥ ₹50,000"</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpatialQueryModal
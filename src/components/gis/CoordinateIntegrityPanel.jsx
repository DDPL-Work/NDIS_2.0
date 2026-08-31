import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, MapPin, ShieldAlert, Loader2 } from 'lucide-react'
import MapView from '../map/MapView'
import Badge from '../ui/Badge'
import { DISTRICT_VALIDATION_STATES, DUPLICATE_RADIUS_M, findPossibleDuplicates, validateWgs84Coordinates, WGS84 } from '../../gis/validation/geoIntegrity'
import { useGisValidation } from '../../hooks/useGisValidation'

const boundaryLabel = {
  [DISTRICT_VALIDATION_STATES.VALID]: 'Valid',
  [DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT]: 'Outside district',
  [DISTRICT_VALIDATION_STATES.VALIDATION_UNAVAILABLE]: 'Validation unavailable',
  [DISTRICT_VALIDATION_STATES.PENDING]: 'Pending backend validation',
}

export default function CoordinateIntegrityPanel({ value = {}, onChange, records = [], districtStatus: districtStatusOverride, onOpenExisting }) {
  const coordinate = useMemo(() => validateWgs84Coordinates(value), [value.latitude, value.longitude])
  const { validateBoundary, boundaryStatus, boundaryLoading, checkDuplicate, duplicateWarning, duplicateFeatures, duplicateLoading, reset } = useGisValidation()
  const [backendBoundary, setBackendBoundary] = useState(null)

  const effectiveDistrictStatus = districtStatusOverride || backendBoundary || DISTRICT_VALIDATION_STATES.PENDING

  useEffect(() => {
    if (!coordinate.valid || !coordinate.position) {
      reset()
      setBackendBoundary(null)
      return
    }
    const lat = Number(value.latitude)
    const lng = Number(value.longitude)
    const timer = setTimeout(() => {
      validateBoundary({ latitude: lat, longitude: lng }).then((result) => {
        if (result) setBackendBoundary(result.inside_district ? DISTRICT_VALIDATION_STATES.VALID : DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT)
      })
      checkDuplicate({ latitude: lat, longitude: lng })
    }, 400)
    return () => clearTimeout(timer)
  }, [coordinate.valid, value.latitude, value.longitude])

  const clientDuplicates = useMemo(() => findPossibleDuplicates(coordinate.position, records), [coordinate.position, records])

  const allDuplicates = useMemo(() => {
    if (duplicateFeatures.length > 0) {
      return duplicateFeatures.map((f) => ({
        record: { id: f.id, name: f.name, categoryLabel: 'Feature' },
        position: null,
        distanceM: f.distance_m ?? null,
        source: 'backend',
      }))
    }
    return clientDuplicates.map((d) => ({ ...d, source: 'client' }))
  }, [duplicateFeatures, clientDuplicates])

  const facilities = useMemo(() => {
    const submitted = coordinate.position ? [{ id: 'submitted-pin', name: 'Submitted location', position: coordinate.position, categoryLabel: 'Submitted pin', departmentId: 'submitted' }] : []
    return [...submitted, ...clientDuplicates.map(({ record, position }) => ({ ...record, position, id: `duplicate-${record.id}` }))]
  }, [coordinate.position, clientDuplicates])

  const hasBackendDuplicate = duplicateFeatures.length > 0
  const hasClientDuplicate = clientDuplicates.length > 0

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-semibold text-ink-900">Location integrity</p>
          <p className="text-[11px] text-ink-500">{WGS84} · enter latitude/longitude; stored as [longitude, latitude].</p>
        </div>
        <Badge tone={coordinate.valid ? 'positive' : 'negative'}>{coordinate.valid ? 'Coordinate format valid' : 'Invalid coordinates'}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Latitude
          <input className="input-field mt-1" type="number" step="any" value={value.latitude ?? value.lat ?? ''} onChange={(event) => onChange({ ...value, latitude: event.target.value, lat: event.target.value })} placeholder="-90 to 90" />
          {coordinate.errors.latitude && <span className="mt-1 block normal-case text-alert-600">{coordinate.errors.latitude}</span>}
        </label>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Longitude
          <input className="input-field mt-1" type="number" step="any" value={value.longitude ?? value.lng ?? ''} onChange={(event) => onChange({ ...value, longitude: event.target.value, lng: event.target.value })} placeholder="-180 to 180" />
          {coordinate.errors.longitude && <span className="mt-1 block normal-case text-alert-600">{coordinate.errors.longitude}</span>}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[11.5px]">
        <ShieldAlert size={14} className="text-saffron-600" />
        <span className="font-medium text-ink-700">District boundary:</span>
        {boundaryLoading ? (
          <span className="flex items-center gap-1 text-ink-500"><Loader2 size={11} className="animate-spin" /> Validating…</span>
        ) : (
          <Badge tone={effectiveDistrictStatus === DISTRICT_VALIDATION_STATES.VALID ? 'positive' : effectiveDistrictStatus === DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT ? 'negative' : 'warning'}>{boundaryLabel[effectiveDistrictStatus] || boundaryLabel.PENDING}</Badge>
        )}
        {effectiveDistrictStatus === DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT && <span className="text-alert-600 font-medium">Coordinates are outside the district boundary.</span>}
      </div>

      {coordinate.position && (
        <div className="h-48 overflow-hidden rounded-lg border border-ink-200 bg-white">
          <MapView className="h-full" center={coordinate.position} zoom={15} facilities={facilities} radiusCenter={coordinate.position} radiusKm={DUPLICATE_RADIUS_M / 1000} />
        </div>
      )}

      {hasBackendDuplicate && (
        <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-saffron-800"><AlertTriangle size={14} /> Backend duplicate check — nearby records found</p>
          <div className="mt-2 space-y-1.5">
            {duplicateFeatures.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-2 text-[11.5px] text-ink-700">
                <span><b>{f.name || 'Unnamed feature'}</b></span>
                <span className="flex items-center gap-2"><b>{f.distance_m != null ? `${f.distance_m} m` : '—'}</b>{onOpenExisting && <button type="button" className="font-semibold text-ink-900 underline" onClick={() => onOpenExisting({ id: f.id, name: f.name })}>Open existing</button>}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasBackendDuplicate && hasClientDuplicate && (
        <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-saffron-800"><AlertTriangle size={14} /> Possible duplicate detected within {DUPLICATE_RADIUS_M} m (client check)</p>
          <div className="mt-2 space-y-1.5">
            {clientDuplicates.map(({ record, distanceM }) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-2 text-[11.5px] text-ink-700">
                <span><b>{record.name || 'Unnamed record'}</b> · {record.categoryLabel || record.category || record.type || 'Asset'} · {record.village || record.location || 'Location unavailable'}</span>
                <span className="flex items-center gap-2"><b>{distanceM.toFixed(1)} m</b>{onOpenExisting && <button type="button" className="font-semibold text-ink-900 underline" onClick={() => onOpenExisting(record)}>Open existing</button>}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {duplicateLoading && (
        <p className="flex items-center gap-1.5 text-[11px] text-ink-500"><Loader2 size={11} className="animate-spin" /> Checking for nearby records…</p>
      )}

      {coordinate.position && !hasBackendDuplicate && !hasClientDuplicate && !duplicateLoading && (
        <p className="flex items-center gap-1.5 text-[11px] text-ink-500"><MapPin size={12} /> No nearby records found.</p>
      )}
    </div>
  )
}

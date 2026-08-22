import { useMemo } from 'react'
import { AlertTriangle, MapPin, ShieldAlert } from 'lucide-react'
import MapView from '../map/MapView'
import Badge from '../ui/Badge'
import { DISTRICT_VALIDATION_STATES, DUPLICATE_RADIUS_M, findPossibleDuplicates, validateWgs84Coordinates, WGS84 } from '../../gis/validation/geoIntegrity'

const boundaryLabel = {
  [DISTRICT_VALIDATION_STATES.VALID]: 'Valid',
  [DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT]: 'Outside district',
  [DISTRICT_VALIDATION_STATES.VALIDATION_UNAVAILABLE]: 'Validation unavailable',
  [DISTRICT_VALIDATION_STATES.PENDING]: 'Pending validation',
}

export default function CoordinateIntegrityPanel({ value = {}, onChange, records = [], districtStatus = DISTRICT_VALIDATION_STATES.PENDING, onOpenExisting }) {
  const coordinate = useMemo(() => validateWgs84Coordinates(value), [value.latitude, value.longitude])
  const duplicates = useMemo(() => findPossibleDuplicates(coordinate.position, records), [coordinate.position, records])
  const facilities = useMemo(() => {
    const submitted = coordinate.position ? [{ id: 'submitted-pin', name: 'Submitted location', position: coordinate.position, categoryLabel: 'Submitted pin', departmentId: 'submitted' }] : []
    return [...submitted, ...duplicates.map(({ record, position }) => ({ ...record, position, id: `duplicate-${record.id}` }))]
  }, [coordinate.position, duplicates])

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
        <Badge tone={districtStatus === DISTRICT_VALIDATION_STATES.VALID ? 'positive' : districtStatus === DISTRICT_VALIDATION_STATES.OUTSIDE_DISTRICT ? 'negative' : 'warning'}>{boundaryLabel[districtStatus] || boundaryLabel.PENDING}</Badge>
        <span className="text-ink-500">Only the backend can confirm boundary validity.</span>
      </div>

      {coordinate.position && (
        <div className="h-48 overflow-hidden rounded-lg border border-ink-200 bg-white">
          <MapView className="h-full" center={coordinate.position} zoom={15} facilities={facilities} radiusCenter={coordinate.position} radiusKm={DUPLICATE_RADIUS_M / 1000} />
        </div>
      )}

      {duplicates.length > 0 && (
        <div className="rounded-lg border border-saffron-200 bg-saffron-50 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-saffron-800"><AlertTriangle size={14} /> Possible duplicate detected within {DUPLICATE_RADIUS_M} m</p>
          <div className="mt-2 space-y-1.5">
            {duplicates.map(({ record, distanceM }) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 rounded bg-white px-2.5 py-2 text-[11.5px] text-ink-700">
                <span><b>{record.name || 'Unnamed record'}</b> · {record.categoryLabel || record.category || record.type || 'Asset'} · {record.village || record.location || 'Location unavailable'}</span>
                <span className="flex items-center gap-2"><b>{distanceM.toFixed(1)} m</b>{onOpenExisting && <button type="button" className="font-semibold text-ink-900 underline" onClick={() => onOpenExisting(record)}>Open existing</button>}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {coordinate.position && !duplicates.length && <p className="flex items-center gap-1.5 text-[11px] text-ink-500"><MapPin size={12} /> No nearby records found in the loaded registry. The backend remains the final duplicate authority.</p>}
    </div>
  )
}

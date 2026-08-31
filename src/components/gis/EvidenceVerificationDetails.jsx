import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Badge from '../ui/Badge'
import { VERIFICATION_STATES } from '../../gis/validation/geoIntegrity'
import { backendGisApi } from '../../api/gisApi'

const TONE = {
  [VERIFICATION_STATES.VERIFIED]: 'positive',
  NOT_VERIFIED: 'neutral',
  REVIEW_REQUIRED: 'warning',
  [VERIFICATION_STATES.REJECTED]: 'negative',
  [VERIFICATION_STATES.PENDING]: 'info',
}

export default function EvidenceVerificationDetails({ evidence = {}, submittedPin, onVerify }) {
  const [backendResult, setBackendResult] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const photoGps = evidence.photoGps || evidence.position || null
  const state = backendResult?.status || evidence.verificationStatus || VERIFICATION_STATES.NOT_VERIFIED
  const distanceM = backendResult?.distance_offset_meters ?? evidence.distanceFromPinM ?? null

  const handleVerify = async () => {
    if (!submittedPin || !Number.isFinite(submittedPin[0]) || !Number.isFinite(submittedPin[1])) return
    setVerifying(true)
    try {
      const result = await backendGisApi.verifyGeotag({
        latitude: submittedPin[1],
        longitude: submittedPin[0],
      })
      setBackendResult(result)
      onVerify?.(result)
    } catch {
      setBackendResult(null)
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    setBackendResult(null)
  }, [submittedPin?.[0], submittedPin?.[1]])

  return (
    <div className="mt-2 rounded-lg border border-ink-100 bg-ink-50/70 p-2.5 text-[11px] text-ink-600">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-ink-800">Geotag verification</span>
        <div className="flex items-center gap-2">
          {verifying && <Loader2 size={12} className="animate-spin text-saffron-500" />}
          <Badge tone={TONE[state] || 'neutral'}>{(state || 'NOT_VERIFIED').replace(/_/g, ' ')}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Info label="EXIF availability" value={backendResult?.exif_latitude != null ? 'GPS extracted' : evidence.exifAvailable === true ? 'GPS found' : evidence.exifAvailable === false ? 'No GPS / not verified' : 'Pending extraction'} />
        <Info label="Photo GPS" value={backendResult ? `${Number(backendResult.exif_latitude).toFixed(6)}, ${Number(backendResult.exif_longitude).toFixed(6)}` : photoGps ? `${photoGps[1]?.toFixed?.(6)}, ${photoGps[0]?.toFixed?.(6)}` : 'Unavailable'} />
        <Info label="Submitted pin" value={backendResult ? `${Number(backendResult.submitted_latitude).toFixed(6)}, ${Number(backendResult.submitted_longitude).toFixed(6)}` : submittedPin ? `${submittedPin[1]?.toFixed?.(6)}, ${submittedPin[0]?.toFixed?.(6)}` : 'Unavailable'} />
        <Info label="Distance offset" value={distanceM != null ? `${Number(distanceM).toFixed(1)} m` : 'Pending'} />
        <Info label="District status" value={backendResult?.inside_district != null ? (backendResult.inside_district ? 'Inside district' : 'Outside district') : evidence.districtStatus || 'Pending backend validation'} />
        <Info label="25m duplicate" value={backendResult?.is_duplicate_25m != null ? (backendResult.is_duplicate_25m ? `${backendResult.nearby_duplicates?.length || 0} nearby records` : 'None') : 'Pending'} />
        <Info label="Verification source" value={evidence.verificationSource || (backendResult ? 'Backend verify-geotag' : 'Not yet verified')} />
        <Info label="Failure reason" value={backendResult?.failure_reason || 'None'} />
      </div>
      {backendResult?.nearby_duplicates?.length > 0 && (
        <div className="mt-2 rounded border border-saffron-200 bg-saffron-50 p-2">
          <p className="text-[11px] font-semibold text-saffron-800">Nearby features within 25m:</p>
          {backendResult.nearby_duplicates.slice(0, 5).map((f) => (
            <p key={f.id} className="text-[10.5px] text-ink-600">{f.name} · {f.distance_m}m</p>
          ))}
        </div>
      )}
      {!evidence.verificationStatus && !backendResult && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={!submittedPin || verifying}
          className="mt-2 w-full rounded-lg border border-saffron-300 bg-saffron-50 px-3 py-1.5 text-[11px] font-semibold text-saffron-800 hover:bg-saffron-100 disabled:opacity-50"
        >
          {verifying ? 'Verifying…' : 'Verify via backend'}
        </button>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return <p><span className="block text-[10px] uppercase tracking-wide text-ink-400">{label}</span>{value}</p>
}

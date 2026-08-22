import Badge from '../ui/Badge'
import { photoReviewHint, verificationState, VERIFICATION_STATES } from '../../gis/validation/geoIntegrity'

const TONE = { VERIFIED: 'positive', NOT_VERIFIED: 'neutral', REVIEW_REQUIRED: 'warning', REJECTED: 'negative', PENDING: 'info' }

export default function EvidenceVerificationDetails({ evidence = {}, submittedPin }) {
  const photoGps = evidence.photoGps || evidence.position || null
  const backendState = verificationState(evidence.verificationStatus)
  const review = photoReviewHint({ photoGps, submittedPin, toleranceM: evidence.toleranceM || 25 })
  const state = evidence.verificationStatus ? backendState : (photoGps ? VERIFICATION_STATES.PENDING : VERIFICATION_STATES.NOT_VERIFIED)
  const distanceM = evidence.distanceFromPinM ?? review.distanceM

  return (
    <div className="mt-2 rounded-lg border border-ink-100 bg-ink-50/70 p-2.5 text-[11px] text-ink-600">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-ink-800">Geotag verification</span>
        <Badge tone={TONE[state]}>{state.replace(/_/g, ' ')}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Info label="EXIF availability" value={evidence.exifAvailable === true ? 'GPS found' : evidence.exifAvailable === false ? 'No GPS / not verified' : 'Pending extraction'} />
        <Info label="Photo GPS" value={photoGps ? `${photoGps[1]?.toFixed?.(6)}, ${photoGps[0]?.toFixed?.(6)}` : 'Unavailable'} />
        <Info label="Submitted pin" value={submittedPin ? `${submittedPin[1]?.toFixed?.(6)}, ${submittedPin[0]?.toFixed?.(6)}` : 'Unavailable'} />
        <Info label="Distance" value={distanceM == null ? 'Pending' : `${Number(distanceM).toFixed(1)} m`} />
        <Info label="District status" value={evidence.districtStatus || 'Pending backend validation'} />
        <Info label="Verification source" value={evidence.verificationSource || 'Backend verification pending'} />
        <Info label="Verified at" value={evidence.verificationAt ? new Date(evidence.verificationAt).toLocaleString() : 'Pending'} />
      </div>
      {!evidence.verificationStatus && photoGps && <p className="mt-2 text-[10.5px] text-saffron-800">Distance is a review signal only ({review.suggestedState.replace(/_/g, ' ')}); this UI never marks evidence verified without a backend result.</p>}
    </div>
  )
}

function Info({ label, value }) {
  return <p><span className="block text-[10px] uppercase tracking-wide text-ink-400">{label}</span>{value}</p>
}

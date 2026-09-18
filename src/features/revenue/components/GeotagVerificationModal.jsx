// GeotagVerificationModal — Geotag EXIF Photo Verification & 25m Dedup matching tax_revenue.html
import { useState, useRef, useEffect } from 'react'
import { Button, Input } from '../../../components/ui'
import { taxRevenueApi } from '../api/taxRevenueApi'
import {
  X, Camera, ShieldCheck, AlertCircle, Loader2, MapPin,
  CheckCircle, XCircle, Info, AlertTriangle
} from 'lucide-react'

export function GeotagVerificationModal({
  isOpen,
  onClose,
}) {
  const [lat, setLat] = useState('25.198')
  const [lng, setLng] = useState('85.514')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
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
      await taxRevenueApi.verifyGeotag({ photo_path: 'test', latitude: 25.198, longitude: 85.514 })
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

  const handleVerify = async () => {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    if (isNaN(latitude) || isNaN(longitude)) {
      setErrorMsg('Please enter valid latitude and longitude coordinates')
      return
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setErrorMsg('Coordinates out of valid range')
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)
    setErrorMsg(null)

    try {
      const data = await taxRevenueApi.verifyGeotag({
        photo_path: 'site_inspection_evidence.jpg',
        latitude,
        longitude,
      })

      setVerificationResult(data)
    } catch (e) {
      if (e.message?.includes('404') || e.message?.includes('not found')) {
        setErrorMsg('Geotag verification service endpoint not found. Backend service may not be deployed.')
        setServiceAvailable(false)
      } else {
        setErrorMsg(e.message || 'Geotag verification API request failed.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'verified' || status === 'VERIFIED') return <CheckCircle className="w-4 h-4 text-emerald-400" />
    if (status === 'failed' || status === 'FAILED') return <XCircle className="w-4 h-4 text-red-400" />
    if (status === 'warning' || status === 'WARNING') return <AlertTriangle className="w-4 h-4 text-amber-400" />
    return <Info className="w-4 h-4 text-blue-400" />
  }

  const getStatusColor = (status) => {
    if (status === 'verified' || status === 'VERIFIED') return 'text-emerald-400 border-emerald-800 bg-emerald-950/50'
    if (status === 'failed' || status === 'FAILED') return 'text-red-400 border-red-800 bg-red-950/50'
    if (status === 'warning' || status === 'WARNING') return 'text-amber-400 border-amber-800 bg-amber-950/50'
    return 'text-blue-400 border-blue-800 bg-blue-950/50'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        className="relative bg-slate-950 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-white text-sm">Geotag EXIF Photo Verification & 25m Dedup</h3>
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
        <div className="p-5 space-y-4">
          {/* Service Status */}
          {serviceAvailable === false && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Geotag verification service is not currently connected. Results shown are simulated.</span>
            </div>
          )}

          {/* Input Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Submitted Latitude
              </label>
              <Input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g., 25.198123"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Submitted Longitude
              </label>
              <Input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g., 85.514321"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Execute Button */}
          <Button
            onClick={handleVerify}
            disabled={isVerifying || serviceAvailable === false}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Run Real EXIF & 25m Proximity Check
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

          {/* Verification Results */}
          {verificationResult && (
            <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-2">
              <div className={`flex items-center justify-between p-2 rounded ${getStatusColor(verificationResult.status || verificationResult.verification_status)}`}>
                <span className="text-slate-300 flex items-center gap-2">
                  {getStatusIcon(verificationResult.status || verificationResult.verification_status)}
                  Verification Status:
                </span>
                <span className="font-bold">
                  {verificationResult.status || verificationResult.verification_status || 'UNKNOWN'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-slate-800/50 rounded">
                  <span className="text-slate-400 block text-[10px]">EXIF Latitude</span>
                  <span className="font-mono text-white">{verificationResult.exif_latitude || verificationResult.exif_lat || 'N/A'}</span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded">
                  <span className="text-slate-400 block text-[10px]">EXIF Longitude</span>
                  <span className="font-mono text-white">{verificationResult.exif_longitude || verificationResult.exif_lng || 'N/A'}</span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded">
                  <span className="text-slate-400 block text-[10px]">Pin Offset</span>
                  <span className="font-semibold text-sky-400">
                    {verificationResult.distance_offset_meters !== undefined
                      ? `${verificationResult.distance_offset_meters} meters`
                      : verificationResult.offset_meters !== undefined
                        ? `${verificationResult.offset_meters} meters`
                        : 'N/A'}
                  </span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded">
                  <span className="text-slate-400 block text-[10px]">District Boundary</span>
                  <span className={`font-semibold ${verificationResult.inside_district ? 'text-emerald-400' : 'text-red-400'}`}>
                    {verificationResult.inside_district ? 'Inside Nalanda District' : 'OUTSIDE BOUNDARY'}
                  </span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded col-span-2">
                  <span className="text-slate-400 block text-[10px]">25m Duplicate Check</span>
                  <span className={`font-semibold ${verificationResult.is_duplicate_25m || verificationResult.duplicate_25m ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {verificationResult.is_duplicate_25m || verificationResult.duplicate_25m ? '⚠ DUPLICATE WARNING - Nearby feature within 25m' : 'No Nearby Duplicates'}
                  </span>
                </div>
              </div>

              {verificationResult.matched_feature && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs font-medium text-slate-400 mb-1">Matched Feature:</p>
                  <p className="text-sm text-white font-mono">{verificationResult.matched_feature.name || verificationResult.matched_feature.id}</p>
                  <p className="text-[11px] text-slate-400">Distance: {verificationResult.matched_feature.distance}m</p>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p><strong>Verification checks:</strong></p>
            <p>• EXIF GPS coordinates vs submitted coordinates</p>
            <p>• Offset distance calculation</p>
            <p>• Nalanda district boundary containment</p>
            <p>• 25m spatial duplicate detection against cadastral layer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeotagVerificationModal
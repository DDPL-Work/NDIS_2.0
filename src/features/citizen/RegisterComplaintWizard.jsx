import { useState, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, ArrowRight, ArrowLeft, MapPin, Navigation, Camera, FileText,
  ShieldCheck, QrCode, Download, Sparkles, AlertCircle, Building2, Eye, EyeOff
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import MapView from '../../components/map/MapView'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import StatusBadge from '../../components/ui/StatusBadge'
import { useAuthStore } from '../../app/store/authStore'
import { useComplaintEngine } from '../../app/store/complaintEngine'
import { useUiStore } from '../../app/store/uiStore'
import { CATEGORY_ROUTING_RULES, DEPARTMENTS, DEPARTMENT_MAP, ADMINISTRATIVE_STRUCTURE, PRIORITY_CONFIG } from '../../config/constants'
import { getAllFacilities } from '../../services/mock/facilities'
import { distanceMeters } from '../../utils/geo'

const WIZARD_STEPS = [
  { id: 1, label: 'Category & Details' },
  { id: 2, label: 'GIS & Location' },
  { id: 3, label: 'Evidence & Geotag' },
  { id: 4, label: 'Citizen Info' },
  { id: 5, label: 'Review & Submit' },
]

export default function RegisterComplaintWizard() {
  const user = useAuthStore((s) => s.user)
  const routeComplaintPayload = useComplaintEngine((s) => s.routeComplaintPayload)
  const pushToast = useUiStore((s) => s.pushToast)
  const navigate = useNavigate()
  const mapRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 State
  const [categoryId, setCategoryId] = useState(CATEGORY_ROUTING_RULES[0].categoryId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('high')

  // Step 2 Location State
  const [selectedPos, setSelectedPos] = useState([85.4211, 25.0294]) // Rajgir default
  const [districtId, setDistrictId] = useState('nalanda')
  const [blockId, setBlockId] = useState('silao')
  const [villageName, setVillageName] = useState('Rajgir')
  const [wardName, setWardName] = useState('Ward 02')
  const [streetAddress, setStreetAddress] = useState('Near Market Chowk')
  const [nearestLandmark, setNearestLandmark] = useState('Public Bus Stand')
  const [isLocating, setIsLocating] = useState(false)

  // Step 3 Attachments State
  const [attachments, setAttachments] = useState([
    {
      id: 'att-user-1',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=600&q=80',
      name: 'damage_photo_site.jpg',
      geotagged: true,
      coords: [85.4211, 25.0294],
      distMeters: 14,
      timestamp: new Date().toISOString(),
    },
  ])

  // Step 4 Citizen State
  const [citizenName, setCitizenName] = useState(user?.name || 'Sunita Devi')
  const [citizenPhone, setCitizenPhone] = useState('+91 9835210492')
  const [citizenEmail, setCitizenEmail] = useState('sunita.devi@bihar.gov.in')
  const [altPhone, setAltPhone] = useState('+91 9431029104')
  const [isMasked, setIsMasked] = useState(false)

  // Step 5 Result State
  const [createdTicket, setCreatedTicket] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-selected rule metadata
  const selectedRule = useMemo(() => {
    return CATEGORY_ROUTING_RULES.find((r) => r.categoryId === categoryId) || CATEGORY_ROUTING_RULES[0]
  }, [categoryId])

  const targetDept = DEPARTMENT_MAP[selectedRule.departmentId]

  // Nearest facility computation
  const nearestFacility = useMemo(() => {
    const facilities = getAllFacilities()
    if (!facilities.length || !selectedPos) return 'Government School Rajgir (280m)'
    let minDist = Infinity
    let closest = null
    facilities.forEach((f) => {
      const d = distanceMeters(selectedPos, f.position)
      if (d < minDist) {
        minDist = d
        closest = f
      }
    })
    return closest ? `${closest.name} (${Math.round(minDist)}m away)` : 'Local Panchayat Bhawan'
  }, [selectedPos])

  const handleMapClick = useCallback((lngLat) => {
    const pos = [lngLat.lng, lngLat.lat]
    setSelectedPos(pos)
  }, [])

  const handleLocateGps = useCallback(() => {
    setIsLocating(true)
    mapRef.current?.locateUser()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedPos([pos.coords.longitude, pos.coords.latitude])
          setIsLocating(false)
          pushToast('GPS location updated to current device position.', 'success')
        },
        () => setIsLocating(false)
      )
    } else {
      setIsLocating(false)
    }
  }, [pushToast])

  const handleSimulateFileUpload = () => {
    const newAtt = {
      id: `att-sim-${Date.now()}`,
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      name: `inspection_evidence_${Date.now()}.jpg`,
      geotagged: true,
      coords: selectedPos,
      distMeters: Math.floor(5 + Math.random() * 15),
      timestamp: new Date().toISOString(),
    }
    setAttachments((prev) => [...prev, newAtt])
    pushToast('Simulated geotagged photo capture attached.', 'info')
  }

  function handleFinalSubmit() {
    setIsSubmitting(true)
    setTimeout(() => {
      const payload = {
        categoryId,
        categoryName: selectedRule.categoryName,
        departmentId: selectedRule.departmentId,
        priority: priority || selectedRule.defaultPriority,
        title: title || selectedRule.categoryName,
        description: description || 'Reported via 5-step Citizen Complaint Wizard.',
        location: {
          position: selectedPos,
          state: 'Bihar',
          districtId,
          block: blockId,
          village: villageName,
          ward: wardName,
          address: streetAddress,
          nearestFacility,
          nearestLandmark,
        },
        citizen: {
          name: citizenName,
          phone: citizenPhone,
          email: citizenEmail,
          altPhone,
          isMasked,
        },
        attachments,
      }

      const ticket = routeComplaintPayload(payload)
      setCreatedTicket(ticket)
      setIsSubmitting(false)
      pushToast(`Complaint ${ticket.id} registered and routed!`, 'success')
    }, 600)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <PageHeader
        eyebrow="Citizen Portal · Part 3 Multi-Step Wizard"
        title="Register Infrastructure Grievance"
        description="Report a public infrastructure defect. Automatic routing engine assigns your ticket to the responsible department officer."
      />

      {/* Stepper Header */}
      {!createdTicket && (
        <div className="card p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-6 right-6 top-4 h-0.5 bg-ink-100 -z-0" />
            {WIZARD_STEPS.map((step) => {
              const isCurrent = step.id === currentStep
              const isDone = step.id < currentStep
              return (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div
                    className={`h-8 w-8 rounded-full grid place-items-center text-[12px] font-semibold transition-all ${
                      isDone
                        ? 'bg-leaf-600 text-white ring-2 ring-leaf-100'
                        : isCurrent
                        ? 'bg-saffron-500 text-white ring-4 ring-saffron-100 scale-110'
                        : 'bg-ink-100 text-ink-400 border border-ink-200'
                    }`}
                  >
                    {isDone ? <Check size={16} /> : step.id}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                      isDone ? 'text-leaf-800' : isCurrent ? 'text-saffron-600 font-semibold' : 'text-ink-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* STEP 1: CATEGORY & DETAILS */}
      {!createdTicket && currentStep === 1 && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-[15px] font-semibold text-ink-950">Step 1: Select Defect Category</h3>
            <p className="text-[12px] text-ink-500">Choose the problem category. Responsible department and SLA target will auto-assign.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CATEGORY_ROUTING_RULES.map((rule) => {
              const dept = DEPARTMENT_MAP[rule.departmentId]
              const isSelected = categoryId === rule.categoryId
              return (
                <button
                  key={rule.categoryId}
                  onClick={() => {
                    setCategoryId(rule.categoryId)
                    setPriority(rule.defaultPriority)
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected ? 'border-saffron-500 bg-saffron-50/40 ring-2 ring-saffron-200' : 'border-ink-200 bg-white hover:border-ink-300'
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white mt-0.5" style={{ background: dept?.color || '#546882' }}>
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-ink-900">{rule.categoryName}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-500">
                      <span>{dept?.label}</span>
                      <span>·</span>
                      <span className="font-semibold text-saffron-700">{rule.slaHours}h SLA</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Auto-Routing Preview Banner */}
          <div className="p-3.5 rounded-xl bg-ink-50 border border-ink-200 flex items-center justify-between text-[12.5px]">
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-saffron-500" />
              <div>
                <span className="font-semibold text-ink-900">Automatic Routing Assigned:</span>
                <span className="text-ink-600 ml-1.5">{targetDept?.label}</span>
              </div>
            </div>
            <Badge tone="warning">Target SLA: {selectedRule.slaHours} Hours</Badge>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Complaint Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${selectedRule.categoryName} at ${villageName}`}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-ink-700 mb-1">Detailed Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue, duration of failure, and safety hazards if any…"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: GIS & LOCATION */}
      {!createdTicket && currentStep === 2 && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="border-b border-ink-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-ink-950">Step 2: Pinpoint Defect GIS Location</h3>
              <p className="text-[12px] text-ink-500">Drop a pin on the map or use your device GPS location.</p>
            </div>
            <Button size="sm" variant="positive" icon={Navigation} loading={isLocating} onClick={handleLocateGps}>
              Use GPS Location
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-72 rounded-xl overflow-hidden card relative">
              <MapView
                ref={mapRef}
                center={selectedPos}
                zoom={14}
                onMapClick={handleMapClick}
                activeTool="radius"
                radiusCenter={selectedPos}
                radiusKm={0.5}
                className="h-full"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] font-mono text-ink-800 shadow-sm border border-ink-200">
                Pin: {selectedPos[1].toFixed(5)}°N, {selectedPos[0].toFixed(5)}°E
              </div>
            </div>

            <div className="space-y-3 text-[12px]">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Administrative Block</label>
                <Select
                  value={blockId}
                  onChange={setBlockId}
                  options={[
                    { value: 'silao', label: 'Silao Block' },
                    { value: 'biharsharif', label: 'Bihar Sharif Block' },
                    { value: 'harnaut', label: 'Harnaut Block' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Village / Settlement</label>
                <input
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-1.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Ward Number</label>
                <input
                  value={wardName}
                  onChange={(e) => setWardName(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-1.5"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900">
                <span className="font-semibold block text-[11.5px]">Nearest Spatial Facility:</span>
                <span className="text-[11px] text-sky-800 mt-0.5 block">{nearestFacility}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: EVIDENCE & GEOTAG */}
      {!createdTicket && currentStep === 3 && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="border-b border-ink-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-ink-950">Step 3: Attach Geo-Tagged Evidence</h3>
              <p className="text-[12px] text-ink-500">Upload site photos or video. Distance to dropped GIS pin is validated automatically.</p>
            </div>
            <Button size="sm" variant="saffron" icon={Camera} onClick={handleSimulateFileUpload}>
              Capture / Attach Photo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attachments.map((att) => (
              <div key={att.id} className="card p-3 flex gap-3 items-center border border-ink-200">
                <img src={att.url} alt={att.name} className="h-16 w-16 rounded-lg object-cover border border-ink-200 shrink-0" />
                <div className="min-w-0 flex-1 text-[12px]">
                  <p className="font-semibold text-ink-900 truncate">{att.name}</p>
                  <div className="flex items-center gap-1.5 text-leaf-700 font-medium text-[11px] mt-0.5">
                    <ShieldCheck size={13} /> Geo-Tagged (Valid distance {att.distMeters}m)
                  </div>
                  <p className="text-[10.5px] text-ink-400 font-mono mt-1">{new Date(att.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-leaf-50 border border-leaf-200 rounded-xl text-[12px] text-leaf-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-leaf-600 shrink-0" />
            <span>EXIF Geotag Verification Passed: Photo coordinates match dropped pin location within 50m tolerance.</span>
          </div>
        </div>
      )}

      {/* STEP 4: CITIZEN INFO */}
      {!createdTicket && currentStep === 4 && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-[15px] font-semibold text-ink-950">Step 4: Citizen Verification & Profile</h3>
            <p className="text-[12px] text-ink-500">Auto-filled from your authenticated citizen profile. Select masking preferences below.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12.5px]">
            <div>
              <label className="block font-semibold text-ink-700 mb-1">Full Name</label>
              <input value={citizenName} onChange={(e) => setCitizenName(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Mobile Number (SMS Updates)</label>
              <input value={citizenPhone} onChange={(e) => setCitizenPhone(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Email Address</label>
              <input value={citizenEmail} onChange={(e) => setCitizenEmail(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
            </div>

            <div>
              <label className="block font-semibold text-ink-700 mb-1">Alternate Contact</label>
              <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-ink-200 bg-ink-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMasked ? <EyeOff size={18} className="text-saffron-600" /> : <Eye size={18} className="text-ink-500" />}
              <div>
                <span className="font-semibold text-[13px] text-ink-900">Mask Identity on Public Portals</span>
                <p className="text-[11.5px] text-ink-500">Keep your contact details hidden from public viewers and general analytics.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isMasked}
              onChange={(e) => setIsMasked(e.target.checked)}
              className="h-5 w-5 accent-saffron-500 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {!createdTicket && currentStep === 5 && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-[15px] font-semibold text-ink-950">Step 5: Review & Submit Complaint</h3>
            <p className="text-[12px] text-ink-500">Verify details before routing ticket to department queue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px] p-4 bg-white border border-ink-200 rounded-xl">
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Category</span>
              <p className="font-semibold text-ink-900 mt-0.5">{selectedRule.categoryName}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Routing Target</span>
              <p className="font-semibold text-ink-900 mt-0.5">{targetDept?.label}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Location</span>
              <p className="font-semibold text-ink-900 mt-0.5">{villageName}, {wardName} ({blockId.toUpperCase()})</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Priority & SLA</span>
              <p className="font-semibold text-saffron-600 mt-0.5">{priority.toUpperCase()} ({selectedRule.slaHours}h target)</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL & QR CODE RESULT */}
      {createdTicket && (
        <div className="card p-8 text-center space-y-6 bg-white animate-fade-in">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-100 text-leaf-700">
            <Check size={32} />
          </div>

          <div>
            <span className="eyebrow text-leaf-700">Complaint Successfully Registered</span>
            <h2 className="text-2xl font-display font-semibold text-ink-950 mt-1">{createdTicket.title}</h2>
            <p className="text-[13px] text-ink-500 mt-1">Ticket Number: <span className="kbd-mono font-bold text-ink-900">{createdTicket.ticketNumber}</span></p>
          </div>

          <div className="max-w-md mx-auto card p-4 border border-ink-200 bg-ink-50/50 space-y-3">
            <div className="flex items-center justify-center gap-2 text-[12px] text-ink-600 font-mono">
              <span>Tracking Code:</span>
              <span className="font-bold text-ink-950 bg-white px-2 py-0.5 rounded border border-ink-200">{createdTicket.trackingCode}</span>
            </div>

            {/* Generated Simulated QR Code */}
            <div className="h-32 w-32 mx-auto bg-white p-2 border border-ink-200 rounded-xl grid place-items-center shadow-xs">
              <QrCode size={96} className="text-ink-950" />
            </div>

            <p className="text-[11px] text-ink-400">Scan QR Code or use Tracking Code on Citizen Portal to monitor live resolution workflow.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              variant="outline"
              icon={Download}
              onClick={() => pushToast('Downloading Official Complaint Acknowledgement PDF…', 'info')}
            >
              Download PDF Acknowledgement
            </Button>
            <Button variant="positive" onClick={() => navigate(`/citizen/track?code=${createdTicket.trackingCode}`)}>
              Track Live Status
            </Button>
          </div>
        </div>
      )}

      {/* Wizard Footer Navigation Controls */}
      {!createdTicket && (
        <div className="flex items-center justify-between pt-2">
          {currentStep > 1 ? (
            <Button variant="outline" icon={ArrowLeft} onClick={() => setCurrentStep((s) => s - 1)}>
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button icon={ArrowRight} onClick={() => setCurrentStep((s) => s + 1)}>
              Next Step
            </Button>
          ) : (
            <Button variant="positive" loading={isSubmitting} icon={Check} onClick={handleFinalSubmit}>
              Submit Complaint
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

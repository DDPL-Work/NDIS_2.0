import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, ArrowRight, ArrowLeft, Navigation, Camera, ShieldCheck, Download, Building2, Eye, EyeOff
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import MapView from '../../components/map/MapView'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { CATEGORY_ROUTING_RULES, DEPARTMENT_MAP, PRIORITY_CONFIG } from '../../config/constants'
import { gisApi, workflowApi } from '../../services/api'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { departmentSlugFromName, registerReferenceCatalog } from '../../api/mappers/complaintMapper'
import { backendMasterApi } from '../../api/masterApi'
import { useDepartmentStore } from '../../store/departments'
import { distanceMeters } from '../../utils/geo'

const WIZARD_STEPS = [
  { id: 1, label: 'Category & Details' },
  { id: 2, label: 'GIS & Location' },
  { id: 3, label: 'Evidence & Geotag' },
  { id: 4, label: 'Citizen Info' },
  { id: 5, label: 'Review & Submit' },
]

const CITIZEN_DEPARTMENTS = [
  ['water', 'Water & Sanitation (JJM)', 'Handpumps, pipelines, tanks and drinking water'], ['electricity', 'Electricity', 'Street lights, transformers and power supply'], ['health', 'Health & Family Welfare', 'Hospitals, ambulances and public health services'], ['education', 'School Education', 'Schools, classrooms and learning facilities'], ['pwd', 'Roads & Public Works', 'Roads, bridges and public buildings'], ['solar', 'Solar & Renewable Energy', 'Solar panels, batteries and renewable systems'], ['tourism', 'Tourism & Heritage', 'Visitor facilities, heritage sites and signs'], ['urban', 'Urban Local Body', 'Sanitation, drains and public spaces'],
]
const ISSUE_CATEGORIES = { water: ['Broken Handpump', 'Pipe Leakage', 'Motor Burnt', 'Water Contamination', 'Low Water Pressure', 'Pipeline Damage', 'Water Tank Overflow', 'Other'], electricity: ['Street Light', 'Transformer', 'Power Failure', 'Electric Pole', 'Electric Wire', 'Meter', 'Other'], health: ['Hospital Cleanliness', 'Medicine Shortage', 'Doctor Absent', 'Oxygen', 'Ambulance', 'Other'], education: ['School Toilet', 'Classroom Damage', 'Furniture', 'Teacher Absent', 'Drinking Water', 'Other'], pwd: ['Pothole', 'Bridge Damage', 'Road Blocked', 'Public Building Damage', 'Other'], solar: ['Solar Panel', 'Battery', 'Controller', 'Power Generation', 'Other'], tourism: ['Tourism Signboard', 'Lighting', 'Visitor Facility', 'Heritage Site', 'Other'], urban: ['Garbage', 'Drain Blockage', 'Sanitation', 'Street Cleaning', 'Other'] }
const FALLBACK_BLOCKS = [
  { value: 'silao', label: 'Silao Block' },
  { value: 'biharsharif', label: 'Bihar Sharif Block' },
  { value: 'harnaut', label: 'Harnaut Block' },
]
const routeFor = (departmentId, category) => CATEGORY_ROUTING_RULES.find((rule) => rule.departmentId === departmentId && rule.categoryName.toLowerCase().includes(category.toLowerCase().split(' ')[0])) || CATEGORY_ROUTING_RULES.find((rule) => rule.departmentId === departmentId) || { categoryId: `${departmentId}_${category.toLowerCase().replace(/\W+/g, '_')}`, categoryName: category, departmentId, defaultPriority: 'medium', slaHours: 24 }

export default function RegisterComplaintWizard() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)
  const navigate = useNavigate()
  const mapRef = useRef(null)

  // Service areas are driven by the backend department master data
  // (backend_guide.md §4.1 — GET /api/departments/), so the numeric FK sent
  // with the complaint is always the real backend department.
  const departments = useDepartmentStore((s) => s.departments)
  const loadDepartments = useDepartmentStore((s) => s.load)
  useEffect(() => { loadDepartments() }, [loadDepartments])

  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 State
  const [categoryId, setCategoryId] = useState(CATEGORY_ROUTING_RULES[0].categoryId)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(() => `${CATEGORY_ROUTING_RULES[0].categoryId}::${ISSUE_CATEGORIES[CATEGORY_ROUTING_RULES[0].departmentId][0]}`)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('water')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('high')

  // Step 2 Location State
  const [selectedPos, setSelectedPos] = useState([85.4211, 25.0294]) // Rajgir default
  const [districtId] = useState('nalanda')
  const [blockId, setBlockId] = useState('silao')
  const [villageName, setVillageName] = useState('Rajgir')
  const [wardName, setWardName] = useState('Ward 02')
  const [streetAddress] = useState('Near Market Chowk')
  const [nearestLandmark] = useState('Public Bus Stand')
  const [isLocating, setIsLocating] = useState(false)

  // Administrative-hierarchy masters (State -> District -> SubDivision ->
  // Block -> VillageWard).  These load the numeric PKs the complaint create
  // payload requires; when the backend does not expose the endpoints yet the
  // lists stay empty and the wizard falls back to the hardcoded options.
  const [subdivisionId, setSubdivisionId] = useState('')
  const [subdivisionOptions, setSubdivisionOptions] = useState([])
  const [subdivisionName, setSubdivisionName] = useState('Bihar Sharif')
  const [blockOptions, setBlockOptions] = useState([])
  const [villageWardOptions, setVillageWardOptions] = useState([])
  const [selectedVillageWard, setSelectedVillageWard] = useState('')

  // Resolve the citizen's district to its numeric PK from /api/districts/,
  // then load subdivisions -> blocks -> villages/wards for it.
  const hierarchyReady = useRef(false)
  useEffect(() => {
    if (hierarchyReady.current) return
    hierarchyReady.current = true
    ;(async () => {
      try {
        const districts = await backendMasterApi.districts()
        const district = districts.find((d) => new RegExp(String(districtId), 'i').test(d.name)) || districts.find((d) => d.id === '24') || districts[0]
        if (!district) return
        const subdivisions = await backendMasterApi.subdivisions({ district: district.id })
        if (!subdivisions.length) return
        setSubdivisionOptions(subdivisions)
        const firstSubdivision = subdivisions[0]
        setSubdivisionId(firstSubdivision.id)
        const blocks = await backendMasterApi.blocks({ subdivision: firstSubdivision.id })
        if (!blocks.length) return
        setBlockOptions(blocks)
        const firstBlock = blocks[0]
        setBlockId(firstBlock.id)
        const wards = await backendMasterApi.villageWards({ block: firstBlock.id })
        if (!wards.length) return
        setVillageWardOptions(wards)
        setSelectedVillageWard(wards[0].id)
      } catch (masterError) { /* fall back to hardcoded options */ }
    })()
  }, [districtId])

  useEffect(() => {
    if (!subdivisionId || !subdivisionOptions.length) return
    let cancelled = false
    backendMasterApi.blocks({ subdivision: subdivisionId }).then((blocks) => {
      if (cancelled) return
      setBlockOptions(blocks)
      if (blocks.length) setBlockId(blocks[0].id)
      else { setBlockId(''); setVillageWardOptions([]); setSelectedVillageWard('') }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [subdivisionId, subdivisionOptions.length])

  useEffect(() => {
    if (!blockId || !blockOptions.length) return
    let cancelled = false
    backendMasterApi.villageWards({ block: blockId }).then((wards) => {
      if (cancelled) return
      setVillageWardOptions(wards)
      if (wards.length) setSelectedVillageWard(wards[0].id)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [blockId, blockOptions.length])

  // Step 3 Attachments State
  const [attachments, setAttachments] = useState([])
  const fileInputRef = useRef(null)

  // Step 4 Citizen State
  const [citizenName, setCitizenName] = useState(user?.name || '')
  const [citizenPhone, setCitizenPhone] = useState('')
  const [citizenEmail, setCitizenEmail] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [isMasked, setIsMasked] = useState(false)

  // Step 5 Result State
  const [createdTicket, setCreatedTicket] = useState(null)
  const [nearbyFacilities, setNearbyFacilities] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-selected rule metadata
  const selectedRule = useMemo(() => {
    return CATEGORY_ROUTING_RULES.find((r) => r.categoryId === categoryId) || CATEGORY_ROUTING_RULES[0]
  }, [categoryId])

  // Department cards rendered from the backend /api/departments/ list; each
  // row is matched to an app slug (water/health/…) so the existing category
  // chips and routing rules keep working, while the numeric department id used
  // in the create payload comes straight from the API.
  const deptCards = useMemo(() => {
    if (!departments.length) {
      return CITIZEN_DEPARTMENTS.map(([id, label, summary]) => ({ id, slug: id, name: label, summary, api: false }))
    }
    return departments.map((d) => {
      const slug = departmentSlugFromName(d.name)
      const known = CITIZEN_DEPARTMENTS.find(([id]) => id === slug)
      return {
        id: String(d.id),
        slug,
        name: known ? known[1] : d.name,
        summary: known ? known[2] : (d.description || 'Line department'),
        api: true,
      }
    })
  }, [departments])

  // Nearest facility computation
  const nearestFacility = useMemo(() => {
    const facilities = nearbyFacilities.filter((f) => Array.isArray(f.position) && f.position.length >= 2)
    if (!facilities.length || !selectedPos) return ''
    let minDist = Infinity
    let closest = null
    facilities.forEach((f) => {
      const d = distanceMeters(selectedPos, f.position)
      if (d < minDist) {
        minDist = d
        closest = f
      }
    })
    return closest ? `${closest.name} (${Math.round(minDist)}m away)` : ''
  }, [nearbyFacilities, selectedPos])
  useEffect(() => { gisApi.searchFacilities({ districtId }).then(setNearbyFacilities).catch(() => setNearbyFacilities([])) }, [districtId])

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

  const handleAttachPhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const newAtt = {
      id: `att-${Date.now()}`,
      type: 'photo',
      url: URL.createObjectURL(file),
      name: file.name,
      file, // kept for the evidence upload call after the complaint is created
      geotagged: true,
      coords: selectedPos,
      distMeters: selectedPos ? 0 : null,
      timestamp: new Date().toISOString(),
    }
    setAttachments((prev) => [...prev, newAtt])
    pushToast('Photo attached.', 'success')
    e.target.value = ''
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true)
    try {
      // Register the name -> pk reference catalog from the public master-data
      // endpoints so the create DTO can resolve numeric category/district ids
      // (the backend rejects free text for those columns).  Non-blocking: if
      // the fetch fails the complaint still submits with null placeholders.
      try {
        const [masterCategories, masterDistricts] = await Promise.all([
          backendMasterApi.complaintCategories(),
          backendMasterApi.districts(),
        ])
        registerReferenceCatalog([
          ...masterCategories.map((c) => ({ categoryId: c.id, categoryName: c.name, departmentId: c.departmentId, departmentName: c.departmentName })),
          ...masterDistricts.map((d) => ({ districtId: d.id, districtName: d.name })),
        ])
      } catch (referenceError) { /* non-blocking */ }

      // Resolve integer FK ids from the API departments list first; the
      // facility fallback only applies when the departments endpoint is down.
      // The old fallback used the first facility with a numeric department id,
      // which could silently belong to a different department (e.g. selecting
      // Health stored the ticket under Urban Development).
      const selectedDept = deptCards.find((card) => card.api && card.slug === selectedDepartmentId)
      const deptFacility = nearbyFacilities.find(
        (f) => (f.department_slug || f.departmentSlug) === selectedDepartmentId && /^\d+$/.test(String(f.departmentId))
      )
      const districtFacility = nearbyFacilities.find((f) => /^\d+$/.test(String(f.districtId)))

      const payload = {
        categoryId,
        categoryName: selectedRule.categoryName,
        departmentId: selectedDept?.id || deptFacility?.departmentId || selectedRule.departmentId,
        departmentName: selectedDept?.name || deptFacility?.departmentName,
        priority: priority || selectedRule.defaultPriority,
        title: title || selectedRule.categoryName,
        description: description || 'Reported via 5-step Citizen Complaint Wizard.',
        location: {
          position: selectedPos,
          state: 'Bihar',
          districtId: districtFacility?.districtId || districtId,
          districtName: districtFacility?.districtName || 'Nalanda',
          // subdivision / block / village_ward are integer ForeignKey columns
          // on the backend (free text is rejected with 400).  When the
          // admin-hierarchy masters are available the selects hold numeric
          // PKs; otherwise the fallback display names are kept for the UI,
          // but the create DTO omits the FK fields entirely so the backend
          // stores null instead of failing the submission.
          subdivision: subdivisionOptions.length ? subdivisionId : undefined,
          block: blockOptions.length ? blockId : undefined,
          village: villageWardOptions.length ? selectedVillageWard : (villageName || wardName),
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

      const ticket = await workflowApi.submitGrievance(payload)
      setCreatedTicket(ticket)

      // Evidence uploads go through the dedicated /upload-evidence/ endpoint
      // (backend_guide.md §10.5) right after the complaint is created.
      const evidenceFiles = attachments.filter((att) => att.file).map((att) => att.file)
      if (evidenceFiles.length) {
        try {
          await ComplaintRepository.uploadEvidence(ticket.id, evidenceFiles)
          pushToast(`Evidence uploaded for ${ticket.ticketNumber || ticket.id}.`, 'success')
        } catch (uploadError) {
          pushToast(`Ticket created, but evidence upload failed: ${uploadError.message || 'Unknown error'}`, 'warning')
        }
      }

      pushToast(`Complaint ${ticket.id} registered and routed!`, 'success')
    } catch (error) { pushToast(error.message || 'Unable to register the complaint.', 'error') } finally { setIsSubmitting(false) }
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

      {/* STEP 1: DEPARTMENT, CATEGORY & DETAILS */}
      {!createdTicket && currentStep === 1 && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="border-b border-ink-100 pb-3"><h3 className="text-[15px] font-semibold text-ink-950">Step 1: Tell us what service needs help</h3><p className="text-[12px] text-ink-500">Select the public-service area and the issue you want to report.</p></div>
          <div className="space-y-2" data-tour="citizen-complaint-category"><span className="text-[12px] font-semibold text-ink-800">Select service area</span><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{deptCards.map((d) => { const selected = selectedDepartmentId === d.slug; return <button key={d.slug} onClick={() => { const first = (ISSUE_CATEGORIES[d.slug] || ['Other'])[0]; const rule = routeFor(d.slug, first); setSelectedDepartmentId(d.slug); setCategoryId(rule.categoryId); setSelectedCategoryKey(`${rule.categoryId}::${first}`); setPriority(rule.defaultPriority) }} className={`p-3.5 rounded-xl border text-left transition-all ${selected ? 'border-saffron-500 bg-saffron-50 ring-2 ring-saffron-100' : 'border-ink-200 hover:border-ink-400 hover:-translate-y-0.5'}`}><div className="flex gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: DEPARTMENT_MAP[d.slug]?.color || '#546882' }}><Building2 size={16}/></div><div><b className="block text-[13px]">{d.name}</b><span className="text-[11px] text-ink-500 leading-snug block mt-1">{d.summary}</span></div></div></button> })}</div></div>
          <div className="space-y-2"><span className="text-[12px] font-semibold text-ink-800">Select issue category</span><div className="flex flex-wrap gap-2">{(ISSUE_CATEGORIES[selectedDepartmentId] || ['Other']).map((category) => { const rule = routeFor(selectedDepartmentId, category); const key = `${rule.categoryId}::${category}`; const selected = selectedCategoryKey === key; return <button key={category} onClick={() => { setCategoryId(rule.categoryId); setPriority(rule.defaultPriority); setSelectedCategoryKey(key) }} className={`px-3 py-2 rounded-lg text-[12px] font-semibold border ${selected ? 'bg-ink-900 border-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:bg-ink-50'}`}>{category}</button> })}</div></div>
          <div className="space-y-3 pt-2"><div><label className="block text-[12px] font-semibold text-ink-700 mb-1">Complaint title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`e.g. ${selectedRule.categoryName} at ${villageName}`} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"/></div><div><label className="block text-[12px] font-semibold text-ink-700 mb-1">Describe the problem</label><textarea data-tour="citizen-complaint-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us what happened and when it started." className="w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px]"/></div></div>

          <div className="space-y-2 pt-1 border-t border-ink-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[12px] font-semibold text-ink-800">Priority level</span>
                <p className="text-[11px] text-ink-500 mt-0.5">Set how soon this issue should be addressed. Suggested priority from the routing rules: <b className="text-ink-800">{PRIORITY_CONFIG[priority]?.label}</b>.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.keys(PRIORITY_CONFIG).map((p) => {
                const info = PRIORITY_CONFIG[p]
                const selected = priority === p
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
                      selected ? 'text-white' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
                    }`}
                    style={selected ? { background: info.color, borderColor: info.color } : undefined}
                  >
                    {info.label}
                    <span className={`ml-1.5 font-mono text-[10.5px] ${selected ? 'text-white/80' : 'text-ink-400'}`}>
                      {info.defaultSlaHours}h SLA
                    </span>
                  </button>
                )
              })}
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
            <div className="lg:col-span-2 h-[clamp(200px,28vh,288px)] rounded-xl overflow-hidden card relative" data-tour="citizen-complaint-location">
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
              {subdivisionOptions.length > 0 ? (
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Sub-Division</label>
                  <Select
                    value={subdivisionId}
                    onChange={setSubdivisionId}
                    options={subdivisionOptions.map((item) => ({ value: item.id, label: item.name }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Sub-Division</label>
                  <input
                    value={subdivisionName}
                    onChange={(e) => setSubdivisionName(e.target.value)}
                    className="w-full rounded-lg border border-ink-200 px-3 py-1.5"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-ink-700 mb-1">Administrative Block</label>
                {blockOptions.length > 0 ? (
                  <Select
                    value={blockId}
                    onChange={setBlockId}
                    options={blockOptions.map((item) => ({ value: item.id, label: item.name }))}
                  />
                ) : (
                  <Select
                    value={blockId}
                    onChange={setBlockId}
                    options={FALLBACK_BLOCKS}
                  />
                )}
              </div>

              {villageWardOptions.length > 0 ? (
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Village / Ward</label>
                  <Select
                    value={selectedVillageWard}
                    onChange={setSelectedVillageWard}
                    options={villageWardOptions.map((item) => ({ value: item.id, label: item.name }))}
                  />
                </div>
              ) : (
                <>
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
                </>
              )}

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
            <Button size="sm" variant="saffron" icon={Camera} data-tour="citizen-complaint-evidence" onClick={handleAttachPhoto}>
              Capture / Attach Photo
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attachments.map((att) => (
              <div key={att.id} className="card p-3 flex gap-3 items-center border border-ink-200">
                <img src={att.url} alt={att.name} className="h-16 w-16 rounded-lg object-cover border border-ink-200 shrink-0" />
                <div className="min-w-0 flex-1 text-[12px]">
                  <p className="font-semibold text-ink-900 truncate">{att.name}</p>
                  <div className="flex items-center gap-1.5 text-leaf-700 font-medium text-[11px] mt-0.5">
                    <ShieldCheck size={13} /> Geo-Tagged (Valid distance {att.distMeters ?? '—'}m)
                  </div>
                  <p className="text-[10.5px] text-ink-400 font-mono mt-1">{new Date(att.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
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
            <p className="text-[12px] text-ink-500">Please check the details before submitting your complaint.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px] p-4 bg-white border border-ink-200 rounded-xl">
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Category</span>
              <p className="font-semibold text-ink-900 mt-0.5">{selectedRule.categoryName}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Location</span>
              <p className="font-semibold text-ink-900 mt-0.5">
                {villageWardOptions.find((item) => item.id === selectedVillageWard)?.name || villageName}, {wardName} ({String(blockOptions.find((item) => item.id === blockId)?.name || blockId).toUpperCase()})
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-ink-400 uppercase">Priority</span>
              <p className="font-semibold mt-0.5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_CONFIG[priority]?.color }} />
                {PRIORITY_CONFIG[priority]?.label}
                <span className="font-mono text-[10.5px] text-ink-400 font-normal">
                  {PRIORITY_CONFIG[priority]?.defaultSlaHours}h SLA
                </span>
              </p>
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

            <p className="text-[11px] text-ink-400">Keep this tracking number to follow updates on your complaint.</p>
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
            <Button icon={ArrowRight} data-tour="citizen-complaint-next" onClick={() => setCurrentStep((s) => s + 1)}>
              Next Step
            </Button>
          ) : (
            <Button variant="positive" loading={isSubmitting} icon={Check} data-tour="citizen-complaint-submit" onClick={handleFinalSubmit}>
              Submit Complaint
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

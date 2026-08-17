// Report an issue against a specific facility — the complete complaint
// registration form (category, priority, GIS pin, evidence, citizen contact,
// review) pre-anchored to the linked facility.  Submission uses the same
// backend DTO as the 5-step wizard (auto-routing + SLA rules).
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Camera, ArrowLeft, ArrowRight, Navigation, ShieldCheck, MapPin } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { gisApi, workflowApi } from '../../services/api'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Tabs from '../../components/ui/Tabs'
import MapView from '../../components/map/MapView'
import { CATEGORY_ROUTING_RULES, DEPARTMENT_MAP, PRIORITY_CONFIG, DISTRICTS } from '../../config/constants'
import { useUiStore } from '../../app/store/uiStore'
import { useAuthStore } from '../../app/store/authStore'
import { ComplaintRepository } from '../../gis/repositories/ComplaintRepository'
import { departmentSlugFromName, registerReferenceCatalog } from '../../api/mappers/complaintMapper'
import { backendMasterApi } from '../../api/masterApi'
import { useDepartmentStore } from '../../store/departments'

const ISSUE_CATEGORIES = { water: ['Broken Handpump', 'Pipe Leakage', 'Motor Burnt', 'Water Contamination', 'Low Water Pressure', 'Pipeline Damage', 'Water Tank Overflow', 'Other'], electricity: ['Street Light', 'Transformer', 'Power Failure', 'Electric Pole', 'Electric Wire', 'Meter', 'Other'], health: ['Hospital Cleanliness', 'Medicine Shortage', 'Doctor Absent', 'Oxygen', 'Ambulance', 'Other'], education: ['School Toilet', 'Classroom Damage', 'Furniture', 'Teacher Absent', 'Drinking Water', 'Other'], pwd: ['Pothole', 'Bridge Damage', 'Road Blocked', 'Public Building Damage', 'Other'], solar: ['Solar Panel', 'Battery', 'Controller', 'Power Generation', 'Other'], tourism: ['Tourism Signboard', 'Lighting', 'Visitor Facility', 'Heritage Site', 'Other'], urban: ['Garbage', 'Drain Blockage', 'Sanitation', 'Street Cleaning', 'Other'] }
const FALLBACK_DEPARTMENTS = [
  ['water', 'Water & Sanitation (JJM)', 'Handpumps, pipelines, tanks and drinking water'], ['electricity', 'Electricity', 'Street lights, transformers and power supply'], ['health', 'Health & Family Welfare', 'Hospitals, ambulances and public health services'], ['education', 'School Education', 'Schools, classrooms and learning facilities'], ['pwd', 'Roads & Public Works', 'Roads, bridges and public buildings'], ['solar', 'Solar & Renewable Energy', 'Solar panels, batteries and renewable systems'], ['tourism', 'Tourism & Heritage', 'Visitor facilities, heritage sites and signs'], ['urban', 'Urban Local Body', 'Sanitation, drains and public spaces'],
]
const FALLBACK_BLOCKS = [
  { value: 'silao', label: 'Silao Block' },
  { value: 'biharsharif', label: 'Bihar Sharif Block' },
  { value: 'harnaut', label: 'Harnaut Block' },
]
const routeFor = (departmentId, category) => CATEGORY_ROUTING_RULES.find((rule) => rule.departmentId === departmentId && rule.categoryName.toLowerCase().includes(category.toLowerCase().split(' ')[0])) || CATEGORY_ROUTING_RULES.find((rule) => rule.departmentId === departmentId) || { categoryId: `${departmentId}_${category.toLowerCase().replace(/\W+/g, '_')}`, categoryName: category, departmentId, defaultPriority: 'medium', slaHours: 24 }

const FORM_TABS = [
  { value: 1, label: 'Issue' },
  { value: 2, label: 'Location' },
  { value: 3, label: 'Evidence' },
  { value: 4, label: 'Citizen' },
  { value: 5, label: 'Review' },
]

export default function ReportIssue() {
  const { facilityId } = useParams()
  const navigate = useNavigate()
  const pushToast = useUiStore((s) => s.pushToast)
  const user = useAuthStore((s) => s.user)
  const mapRef = useRef(null)
  const fileInputRef = useRef(null)

  const { data: facility } = useAsync(() => (facilityId ? gisApi.getFacility(facilityId) : Promise.resolve(null)), [facilityId])

  // Service areas come from the backend department master (numeric FK); the
  // slug constants only fill in while /api/departments/ loads.
  const departments = useDepartmentStore((s) => s.departments)
  const loadDepartments = useDepartmentStore((s) => s.load)
  useEffect(() => { loadDepartments() }, [loadDepartments])

  const deptCards = useMemo(() => {
    if (!departments.length) {
      return FALLBACK_DEPARTMENTS.map(([id, label, summary]) => ({ id, slug: id, name: label, summary, api: false }))
    }
    return departments.map((d) => {
      const slug = departmentSlugFromName(d.name)
      const known = FALLBACK_DEPARTMENTS.find(([id]) => id === slug)
      return {
        id: String(d.id),
        slug,
        name: known ? known[1] : d.name,
        summary: known ? known[2] : (d.description || 'Line department'),
        api: true,
      }
    })
  }, [departments])

  // Issue details
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('water')
  const [categoryId, setCategoryId] = useState(CATEGORY_ROUTING_RULES[0].categoryId)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('high')

  // Location
  const [selectedPos, setSelectedPos] = useState(DISTRICTS[0]?.center || [85.4211, 25.0294])
  const [districtId, setDistrictId] = useState('nalanda')
  const [districtName, setDistrictName] = useState('Nalanda')
  const [blockId, setBlockId] = useState('silao')
  const [villageName, setVillageName] = useState('')
  const [wardName, setWardName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [nearestLandmark, setNearestLandmark] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  // Admin-hierarchy masters (numeric PKs required by the backend FK columns).
  const [subdivisionId, setSubdivisionId] = useState('')
  const [subdivisionOptions, setSubdivisionOptions] = useState([])
  const [subdivisionName, setSubdivisionName] = useState('')
  const [blockOptions, setBlockOptions] = useState([])
  const [villageWardOptions, setVillageWardOptions] = useState([])
  const [selectedVillageWard, setSelectedVillageWard] = useState('')

  // Citizen info
  const [citizenName, setCitizenName] = useState(user?.name || '')
  const [citizenPhone, setCitizenPhone] = useState(user?.phone || '')
  const [citizenEmail, setCitizenEmail] = useState(user?.email || '')
  const [altPhone, setAltPhone] = useState('')
  const [isMasked, setIsMasked] = useState(false)

  // Evidence
  const [attachment, setAttachment] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  // Tab-wise form navigation (Issue -> Location -> Evidence -> Citizen -> Review)
  const [step, setStep] = useState(1)

  function goNext() {
    if (step === 1 && !title.trim()) {
      pushToast('Issue title is required before continuing.', 'error')
      return
    }
    if (step === 2 && !Array.isArray(selectedPos)) {
      pushToast('Drop a pin on the map before continuing.', 'error')
      return
    }
    setStep((s) => Math.min(s + 1, FORM_TABS.length))
  }

  const selectedRule = useMemo(
    () => CATEGORY_ROUTING_RULES.find((r) => r.categoryId === categoryId) || CATEGORY_ROUTING_RULES[0],
    [categoryId]
  )

  // Pre-anchor every field to the linked facility once it loads.
  useEffect(() => {
    if (!facility) return
    if (Array.isArray(facility.position) && facility.position.length >= 2) setSelectedPos(facility.position)
    if (facility.village) { setVillageName(facility.village); setStreetAddress(`${facility.village}${facility.districtName ? `, ${facility.districtName}` : ''}`) }
    if (facility.districtName) setDistrictName(facility.districtName)
    if (facility.districtId) setDistrictId(facility.districtId)
    const card = deptCards.find((c) => String(c.id) === String(facility.departmentId)) || deptCards.find((c) => c.slug === (facility.department_slug || facility.departmentSlug))
    if (card) {
      setSelectedDepartmentId(card.slug)
      const first = (ISSUE_CATEGORIES[card.slug] || ['Other'])[0]
      const rule = routeFor(card.slug, first)
      setCategoryId(rule.categoryId)
      setSelectedCategoryKey(`${rule.categoryId}::${first}`)
      setPriority(rule.defaultPriority)
    }
  }, [facility, deptCards])

  // Load subdivision -> block -> village/ward hierarchy for the district.
  const hierarchyReady = useRef(false)
  useEffect(() => {
    if (hierarchyReady.current || !districtId) return
    hierarchyReady.current = true
    ;(async () => {
      try {
        const districts = await backendMasterApi.districts()
        const district = districts.find((d) => d.id === String(districtId)) || districts.find((d) => new RegExp(String(districtId), 'i').test(d.name)) || districts[0]
        if (!district) return
        const subdivisions = await backendMasterApi.subdivisions({ district: district.id })
        if (!subdivisions.length) return
        setSubdivisionOptions(subdivisions)
        const firstSubdivision = subdivisions[0]
        setSubdivisionId(firstSubdivision.id)
        setSubdivisionName(firstSubdivision.name)
        const blocks = await backendMasterApi.blocks({ subdivision: firstSubdivision.id })
        if (!blocks.length) return
        setBlockOptions(blocks)
        setBlockId(blocks[0].id)
        const wards = await backendMasterApi.villageWards({ block: blocks[0].id })
        if (!wards.length) return
        setVillageWardOptions(wards)
        setSelectedVillageWard(wards[0].id)
      } catch (masterError) { /* fall back to text inputs */ }
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

  const distanceFromFacility = useMemo(() => {
    if (!facility || !Array.isArray(facility.position) || !Array.isArray(selectedPos)) return null
    const [lng1, lat1] = facility.position
    const [lng2, lat2] = selectedPos
    const toRad = (deg) => (deg * Math.PI) / 180
    const R = 6371000
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return Math.round(2 * R * Math.asin(Math.sqrt(a)))
  }, [facility, selectedPos])

  const handleMapClick = useCallback((lngLat) => {
    setSelectedPos([lngLat.lng, lngLat.lat])
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

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAttachment({
      url: URL.createObjectURL(file),
      name: file.name,
      file,
      geotagged: true,
      coords: selectedPos,
      distMeters: selectedPos ? 0 : null,
      timestamp: new Date().toISOString(),
    })
    pushToast('Photo attached.', 'success')
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !citizenPhone.trim()) {
      pushToast('Issue title and mobile number are required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      // Register name -> pk references so the create DTO can resolve numeric
      // category/district ids (backend rejects free text for those columns).
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

      const selectedDept = deptCards.find((card) => card.api && card.slug === selectedDepartmentId)
      const payload = {
        categoryId,
        categoryName: selectedRule.categoryName,
        departmentId: selectedDept?.id || facility?.departmentId || selectedRule.departmentId,
        departmentName: selectedDept?.name || facility?.departmentName,
        priority: priority || selectedRule.defaultPriority,
        title: title.trim(),
        description: description.trim() || `Reported against ${facility ? `${facility.name} (${facility.village})` : 'map location'}.`,
        linkedFacilityId: facility?.id || null,
        facilityName: facility?.name || 'Unlinked location',
        location: {
          position: selectedPos,
          state: 'Bihar',
          districtId: /^\d+$/.test(String(facility?.districtId ?? '')) ? facility.districtId : undefined,
          districtName: districtName || 'Nalanda',
          subdivision: subdivisionOptions.length ? subdivisionId : undefined,
          block: blockOptions.length ? blockId : undefined,
          village: villageWardOptions.length ? selectedVillageWard : (villageName || wardName),
          ward: wardName,
          address: streetAddress || [subdivisionName, villageName, wardName].filter(Boolean).join(', '),
          nearestFacility: facility?.name ? `${facility.name}${distanceFromFacility != null ? ` (${distanceFromFacility}m away)` : ''}` : '',
          nearestLandmark,
        },
        citizen: {
          name: citizenName.trim() || user?.name || 'Citizen',
          phone: citizenPhone.trim(),
          email: citizenEmail.trim(),
          altPhone: altPhone.trim(),
          isMasked,
        },
      }

      const grievance = await workflowApi.submitGrievance(payload)
      if (attachment?.file) {
        try {
          await ComplaintRepository.uploadEvidence(grievance.id, [attachment.file])
        } catch (uploadError) {
          pushToast(`Ticket created, but evidence upload failed: ${uploadError.message || 'Unknown error'}`, 'warning')
        }
      }
      setCreated(grievance)
      pushToast('Grievance submitted successfully.', 'success')
    } catch (error) {
      pushToast(error.message || 'Unable to register the grievance.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <div className="grid h-14 w-14 mx-auto place-items-center rounded-full bg-leaf-100 text-leaf-600 mb-4">
          <CheckCircle2 size={26} />
        </div>
        <h2 className="text-lg font-display font-semibold text-ink-950">Grievance submitted</h2>
        <p className="text-[13px] text-ink-500 mt-1.5">
          It has been auto-routed to the relevant line department. Save your tracking code to follow progress.
        </p>
        <div className="mt-5 inline-block rounded-xl border border-dashed border-ink-300 px-5 py-3">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Tracking code</p>
          <p className="kbd-mono text-lg font-semibold text-ink-950">{created.trackingCode}</p>
        </div>
        <div className="flex justify-center gap-2.5 mt-6">
          <Button variant="outline" onClick={() => navigate('/citizen')}>Back to map</Button>
          <Button onClick={() => navigate(`/citizen/track?code=${created.trackingCode}`)}>Track this grievance</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft size={14} /> Back
      </button>
      <Card>
        <CardHeader
          title="Report an issue"
          subtitle={facility ? `Linked to ${facility.name}, ${facility.village}` : 'Not linked to a specific facility'}
        />
        <CardBody>
          <Tabs tabs={FORM_TABS} active={step} onChange={setStep} />
          <form onSubmit={handleSubmit} className="space-y-6 pt-5">
            {/* TAB 1: Issue details */}
            {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-ink-700 block mb-1.5">Select service area</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {deptCards.map((d) => {
                    const selected = selectedDepartmentId === d.slug
                    return (
                      <button
                        type="button"
                        key={d.slug}
                        onClick={() => {
                          const first = (ISSUE_CATEGORIES[d.slug] || ['Other'])[0]
                          const rule = routeFor(d.slug, first)
                          setSelectedDepartmentId(d.slug)
                          setCategoryId(rule.categoryId)
                          setSelectedCategoryKey(`${rule.categoryId}::${first}`)
                          setPriority(rule.defaultPriority)
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${selected ? 'border-saffron-500 bg-saffron-50 ring-2 ring-saffron-100' : 'border-ink-200 hover:border-ink-400'}`}
                      >
                        <b className="block text-[12.5px]" style={{ color: DEPARTMENT_MAP[d.slug]?.color || '#546882' }}>{d.name}</b>
                        <span className="text-[11px] text-ink-500 leading-snug block mt-0.5">{d.summary}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink-700 block mb-1.5">Issue category</label>
                <div className="flex flex-wrap gap-2">
                  {(ISSUE_CATEGORIES[selectedDepartmentId] || ['Other']).map((category) => {
                    const rule = routeFor(selectedDepartmentId, category)
                    const key = `${rule.categoryId}::${category}`
                    const selected = selectedCategoryKey === key
                    return (
                      <button
                        type="button"
                        key={category}
                        onClick={() => { setCategoryId(rule.categoryId); setPriority(rule.defaultPriority); setSelectedCategoryKey(key) }}
                        className={`px-3 py-2 rounded-lg text-[12px] font-semibold border ${selected ? 'bg-ink-900 border-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:bg-ink-50'}`}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink-700 block mb-1">Issue title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`e.g. ${selectedRule.categoryName}${villageName ? ` at ${villageName}` : ''}`}
                  required
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-ink-700 block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what you observed and when it started…"
                  className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-ink-100">
                <span className="text-[12px] font-semibold text-ink-800">Priority level</span>
                <p className="text-[11px] text-ink-500">Suggested priority from the routing rules: <b className="text-ink-800">{PRIORITY_CONFIG[priority]?.label}</b>.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.keys(PRIORITY_CONFIG).map((p) => {
                    const info = PRIORITY_CONFIG[p]
                    const selected = priority === p
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${selected ? 'text-white' : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'}`}
                        style={selected ? { background: info.color, borderColor: info.color } : undefined}
                      >
                        {info.label}
                        <span className={`ml-1.5 font-mono text-[10.5px] ${selected ? 'text-white/80' : 'text-ink-400'}`}>{info.defaultSlaHours}h SLA</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            )}

            {/* TAB 2: GIS location */}
            {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[12px] font-semibold text-ink-800 block">GIS location</span>
                  <p className="text-[11px] text-ink-500 mt-0.5">Pin is pre-placed on the linked facility — adjust it or use GPS.</p>
                </div>
                <Button type="button" size="sm" variant="positive" icon={Navigation} loading={isLocating} onClick={handleLocateGps}>
                  Use GPS Location
                </Button>
              </div>
              <div className="h-[clamp(192px,26vh,256px)] rounded-xl overflow-hidden border border-ink-200 relative">
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
                {distanceFromFacility != null && (
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[11px] text-ink-700 shadow-sm border border-ink-200 flex items-center gap-1.5">
                    <MapPin size={12} className="text-leaf-700" /> {distanceFromFacility}m from {facility?.name}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-[12px]">
                {subdivisionOptions.length > 0 ? (
                  <div>
                    <label className="block font-semibold text-ink-700 mb-1">Sub-Division</label>
                    <Select value={subdivisionId} onChange={setSubdivisionId} options={subdivisionOptions.map((item) => ({ value: item.id, label: item.name }))} />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-ink-700 mb-1">Sub-Division</label>
                    <input value={subdivisionName} onChange={(e) => setSubdivisionName(e.target.value)} placeholder="e.g. Bihar Sharif" className="w-full rounded-lg border border-ink-200 px-3 py-2" />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Administrative Block</label>
                  {blockOptions.length > 0 ? (
                    <Select value={blockId} onChange={setBlockId} options={blockOptions.map((item) => ({ value: item.id, label: item.name }))} />
                  ) : (
                    <Select value={blockId} onChange={setBlockId} options={FALLBACK_BLOCKS} />
                  )}
                </div>
                {villageWardOptions.length > 0 ? (
                  <div>
                    <label className="block font-semibold text-ink-700 mb-1">Village / Ward</label>
                    <Select value={selectedVillageWard} onChange={setSelectedVillageWard} options={villageWardOptions.map((item) => ({ value: item.id, label: item.name }))} />
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-ink-700 mb-1">Village / Settlement</label>
                    <input value={villageName} onChange={(e) => setVillageName(e.target.value)} placeholder="e.g. Rajgir" className="w-full rounded-lg border border-ink-200 px-3 py-2" />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Ward Number</label>
                  <input value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="e.g. Ward 02" className="w-full rounded-lg border border-ink-200 px-3 py-2" />
                </div>
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">Nearest Landmark</label>
                  <input value={nearestLandmark} onChange={(e) => setNearestLandmark(e.target.value)} placeholder="e.g. Market chowk" className="w-full rounded-lg border border-ink-200 px-3 py-2" />
                </div>
              </div>
            </div>
            )}

            {/* TAB 3: Evidence */}
            {step === 3 && (
            <div>
              <span className="text-[12px] font-semibold text-ink-800 block mb-2">Geo-tagged evidence</span>
              {attachment ? (
                <div className="card p-3 flex gap-3 items-center border border-ink-200">
                  <img src={attachment.url} alt={attachment.name} className="h-16 w-16 rounded-lg object-cover border border-ink-200 shrink-0" />
                  <div className="min-w-0 flex-1 text-[12px]">
                    <p className="font-semibold text-ink-900 truncate">{attachment.name}</p>
                    <div className="flex items-center gap-1.5 text-leaf-700 font-medium text-[11px] mt-0.5">
                      <ShieldCheck size={13} /> Geo-Tagged (valid distance {attachment.distMeters ?? '—'}m)
                    </div>
                    <button type="button" onClick={() => setAttachment(null)} className="text-[11px] text-alert-600 font-medium mt-1 hover:underline">
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-[12.5px] font-medium border-ink-300 text-ink-500 hover:border-ink-400"
                >
                  <Camera size={15} /> Attach geo-tagged photo (optional)
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
              <p className="text-[11.5px] text-ink-400 leading-relaxed mt-2">
                Photo EXIF location is validated against the asset location (200m tolerance) to detect mis-tagged uploads before reaching the department.
              </p>
            </div>
            )}

            {/* TAB 4: Citizen info */}
            {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Full Name</label>
                <input value={citizenName} onChange={(e) => setCitizenName(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
              </div>
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Mobile Number (SMS Updates) *</label>
                <input value={citizenPhone} onChange={(e) => setCitizenPhone(e.target.value)} required placeholder="e.g. 98123 45678" className="w-full rounded-lg border border-ink-200 px-3 py-2" />
              </div>
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Email Address</label>
                <input type="email" value={citizenEmail} onChange={(e) => setCitizenEmail(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
              </div>
              <div>
                <label className="block font-semibold text-ink-700 mb-1">Alternate Contact</label>
                <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} className="w-full rounded-lg border border-ink-200 px-3 py-2" />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2.5 rounded-xl border border-ink-200 bg-ink-50 px-3.5 py-3 cursor-pointer">
                <input type="checkbox" checked={isMasked} onChange={(e) => setIsMasked(e.target.checked)} className="h-4 w-4 accent-saffron-500 rounded cursor-pointer" />
                <span>
                  <b className="block text-[12.5px] text-ink-900">Mask identity on public portals</b>
                  <span className="text-[11px] text-ink-500">Keep your contact details hidden from public viewers.</span>
                </span>
              </label>
            </div>
            )}

            {/* TAB 5: Review & submit */}
            {step === 5 && (
            <div>
              <span className="text-[12px] font-semibold text-ink-800 block mb-2">Review your complaint</span>
              <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Category</span>
                  <p className="font-semibold text-ink-900 mt-0.5">{selectedRule.categoryName}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Department</span>
                  <p className="font-semibold text-ink-900 mt-0.5">{deptCards.find((d) => d.slug === selectedDepartmentId)?.name || selectedDepartmentId}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Priority</span>
                  <p className="font-semibold mt-0.5 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_CONFIG[priority]?.color }} />
                    {PRIORITY_CONFIG[priority]?.label}
                    <span className="font-mono text-[10.5px] text-ink-400 font-normal">{PRIORITY_CONFIG[priority]?.defaultSlaHours}h SLA</span>
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-ink-400 uppercase">Location</span>
                  <p className="font-semibold text-ink-900 mt-0.5">
                    {villageWardOptions.find((item) => item.id === selectedVillageWard)?.name || villageName || '—'}{wardName ? `, ${wardName}` : ''}
                    {facility ? ` · linked to ${facility.name}` : ''}
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* Footer navigation */}
            <div className="flex items-center justify-between border-t border-ink-100 pt-5">
              {step > 1 ? (
                <Button type="button" variant="outline" icon={ArrowLeft} onClick={() => setStep((s) => s - 1)}>Previous</Button>
              ) : (
                <div />
              )}
              {step < FORM_TABS.length ? (
                <Button type="button" icon={ArrowRight} onClick={goNext}>Next Step</Button>
              ) : (
                <Button type="submit" variant="positive" loading={submitting}>Submit grievance</Button>
              )}
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

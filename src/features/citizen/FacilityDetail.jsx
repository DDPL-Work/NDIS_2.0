// Facility Detail — Sector Telemetry Cards & Schema Attribute Viewer (Vol 3 Ch 16).
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Clock, ShieldCheck, AlertTriangle, Navigation2,
  HeartPulse, Droplets, GraduationCap, Landmark, Sun, Building2,
} from 'lucide-react'
import { useFacilityDetail } from '../../hooks/useFacilityDetail'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import GapScoreRing from '../../components/ui/GapScoreRing'
import MapView from '../../components/map/MapView'
import Icon from '../../components/ui/Icon'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatCoord } from '../../utils/geo'
import { formatDate, formatNumber, titleCase } from '../../utils/format'

function TelemetryCard({ departmentId, attributes }) {
  if (!attributes) return null

  switch (departmentId) {
    case 'health':
      return (
        <Card className="border-alert-200 bg-alert-50/20">
          <CardHeader title="Health Sector Operational Telemetry" icon={HeartPulse} />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Total Beds</p>
                <p className="text-lg font-display font-semibold text-alert-700">{attributes.bed_count ?? '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Medical Staff</p>
                <p className="text-lg font-display font-semibold text-ink-900">{attributes.staff_count ?? '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Oxygen Status</p>
                {attributes.oxygen_supply_status ? (
                  <Badge tone={attributes.oxygen_supply_status === 'adequate' ? 'positive' : 'warning'} className="mt-1">
                    {titleCase(attributes.oxygen_supply_status)}
                  </Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Emergency Unit</p>
                {typeof attributes.has_emergency === 'boolean' ? (
                  <Badge tone={attributes.has_emergency ? 'positive' : 'neutral'} className="mt-1">
                    {attributes.has_emergency ? '24x7 Ready' : 'Standard'}
                  </Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
            </div>
          </CardBody>
        </Card>
      )

    case 'water':
      return (
        <Card className="border-sky-200 bg-sky-50/20">
          <CardHeader title="Water & Sanitation Scheme Metrics" icon={Droplets} />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Tank Capacity</p>
                <p className="text-lg font-display font-semibold text-sky-700">{attributes.capacity_liters != null ? `${formatNumber(attributes.capacity_liters)} L` : '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">JJM Connections</p>
                <p className="text-lg font-display font-semibold text-ink-900">{attributes.connection_count ?? '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Water Quality</p>
                {attributes.quality_test_status ? (
                  <Badge tone={attributes.quality_test_status === 'pass' ? 'positive' : 'negative'} className="mt-1">
                    {titleCase(attributes.quality_test_status)}
                  </Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Source Type</p>
                <p className="text-[12px] font-semibold text-ink-800 mt-1">{attributes.source_type ? titleCase(attributes.source_type) : '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )

    case 'education':
      return (
        <Card className="border-leaf-200 bg-leaf-50/20">
          <CardHeader title="Education Infrastructure Metrics" icon={GraduationCap} />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Enrolled Students</p>
                <p className="text-lg font-display font-semibold text-leaf-700">{attributes.student_count ?? '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Teachers</p>
                <p className="text-lg font-display font-semibold text-ink-900">{attributes.teacher_count ?? '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Board Affiliation</p>
                <p className="text-[12px] font-semibold text-ink-800 mt-1">{attributes.board_affiliation || '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Smart Classrooms</p>
                {typeof attributes.has_digital_classroom === 'boolean' ? (
                  <Badge tone={attributes.has_digital_classroom ? 'positive' : 'neutral'} className="mt-1">
                    {attributes.has_digital_classroom ? 'Available' : 'Pending'}
                  </Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
            </div>
          </CardBody>
        </Card>
      )

    case 'tourism':
      return (
        <Card className="border-violet-200 bg-violet-50/20">
          <CardHeader title="Heritage & Visitor Infrastructure" icon={Landmark} />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Monthly Footfall</p>
                <p className="text-lg font-display font-semibold text-violet-700">{attributes.avg_footfall_monthly ?? '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Heritage Status</p>
                {attributes.heritage_protection_status ? (
                  <Badge tone="info" className="mt-1">{attributes.heritage_protection_status}</Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Entry Fee</p>
                <p className="text-[13px] font-semibold text-ink-900 mt-1">{attributes.entry_fee != null ? `₹${attributes.entry_fee}` : '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Visiting Hours</p>
                <p className="text-[11.5px] font-medium text-ink-700 mt-1">{attributes.visiting_hours || '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )

    case 'solar':
      return (
        <Card className="border-saffron-200 bg-saffron-50/20">
          <CardHeader title="Renewable Generation & Rooftop Solar" icon={Sun} />
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Capacity</p>
                <p className="text-lg font-display font-semibold text-saffron-700">{attributes.installed_capacity_kw != null ? `${attributes.installed_capacity_kw} kW` : '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Rooftop Area</p>
                <p className="text-[13px] font-semibold text-ink-900 mt-1">{attributes.rooftop_area_sqm != null ? `${formatNumber(attributes.rooftop_area_sqm)} sq.m` : '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Grid Feed</p>
                {attributes.generation_status ? (
                  <Badge tone="positive" className="mt-1">{titleCase(attributes.generation_status)}</Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Subsidy Scheme</p>
                <p className="text-[11.5px] font-semibold text-ink-800 mt-1">{attributes.subsidy_scheme_id || '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )

    default:
      return (
        <Card className="border-ink-200 bg-ink-50/30">
          <CardHeader title="Asset Condition & Structural Rating" icon={Building2} />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Condition Rating</p>
                {attributes.condition_rating ? (
                  <Badge
                    tone={attributes.condition_rating === 'good' ? 'positive' : attributes.condition_rating === 'fair' ? 'warning' : 'negative'}
                    className="mt-1"
                  >
                    {titleCase(attributes.condition_rating)}
                  </Badge>
                ) : <p className="mt-1 text-ink-400">—</p>}
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Lifecycle State</p>
                <p className="text-[12.5px] font-semibold text-ink-800 mt-1">{attributes.lifecycle_state ? titleCase(attributes.lifecycle_state) : '—'}</p>
              </div>
              <div className="card !p-2 bg-white">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400">Funding Scheme</p>
                <p className="text-[12.5px] font-semibold text-ink-800 mt-1">{attributes.scheme_id || '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )
  }
}

export default function FacilityDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: facility, loading, error, refetch } = useFacilityDetail(slug)

  if (loading) return <div className="p-6 text-[13px] text-ink-400">Loading facility…</div>
  if (error) {
    return <div className="p-8 text-center"><p className="text-[14px] text-ink-600">Unable to load this facility.</p><Button variant="outline" className="mt-3" onClick={refetch}>Try again</Button></div>
  }
  if (!facility) {
    return (
      <div className="p-8 text-center">
        <p className="text-[14px] text-ink-600">Facility not found.</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate('/citizen')}>
          Back to map
        </Button>
      </div>
    )
  }

  const dept = DEPARTMENT_MAP[facility.departmentId] || {
    label: facility.departmentName || 'Department',
    color: '#546882',
    icon: 'Building2',
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-2.5">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-white shrink-0"
              style={{ background: dept.color }}
            >
              <Icon name={dept.icon} size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="break-words text-xl font-display font-semibold text-ink-950">{facility.name}</h1>
              <p className="text-[12.5px] text-ink-500">{facility.categoryLabel} · {dept.label}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={facility.status === 'active' ? 'positive' : facility.status === 'under_construction' ? 'warning' : 'neutral'}>
              {titleCase(facility.status)}
            </Badge>
            <Badge tone="neutral">
              <MapPin size={11} className="inline mr-0.5" />
              {facility.village}
            </Badge>
            <Badge tone="info">
              <ShieldCheck size={11} className="inline mr-0.5" />
              {titleCase(facility.geocodeMethod)}
            </Badge>
          </div>

          {/* Specialized Sector Telemetry */}
          <TelemetryCard departmentId={facility.departmentId} attributes={facility.attributes} />

          {/* Contact & Location */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-4">
                <div className="flex items-center gap-2 text-[13px] text-ink-700">
                  <Phone size={14} className="text-ink-400" /> {facility.contact.phone}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-ink-700">
                  <Clock size={14} className="text-ink-400" /> {facility.contact.hours}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-ink-700">
                  <Navigation2 size={14} className="text-ink-400" /> {formatCoord(facility.position)}
                </div>
              </div>

              <div className="h-px bg-ink-100 my-4" />

              <h4 className="text-[12.5px] font-semibold text-ink-800 mb-2.5">Extended Schema Attributes (JSONB)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                {Object.entries(facility.attributes).map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10.5px] uppercase tracking-wide text-ink-400">{titleCase(k)}</p>
                    <p className="text-[13px] font-medium text-ink-800">
                      {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : (v ?? '—').toString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Data Provenance Card */}
          <Card>
            <CardBody>
              <h4 className="text-[12.5px] font-semibold text-ink-800 mb-1">Data Provenance & Custodian Info</h4>
              <p className="text-[12.5px] text-ink-600 leading-relaxed">
                Sourced from <strong>{facility.custodian}</strong>, ingestion batch <span className="kbd-mono">{facility.ingestionBatchId}</span>,
                last updated {formatDate(facility.lastUpdated)}. Confidence score {(facility.confidence * 100).toFixed(0)}%.
              </p>
            </CardBody>
          </Card>

          <div className="flex gap-2.5">
            <Button variant="saffron" icon={AlertTriangle} onClick={() => navigate(`/citizen/report/${facility.id}`)}>
              Report an issue
            </Button>
            <Button variant="outline" as={Link} to="/citizen/grievance/track">
              Track a grievance
            </Button>
          </div>
        </div>

        {/* Right column map & gap ring */}
        <div className="w-full md:w-[340px] shrink-0 space-y-4">
          <MapView
            center={facility.position}
            zoom={14}
            facilities={[facility]}
            selectedId={facility.id}
            className="h-[clamp(160px,24vh,224px)] rounded-xl2 overflow-hidden card"
          />
          <Card>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-ink-500">Facility Deficit Score</p>
                <p className="text-[11px] text-ink-400 mt-0.5">Population coverage vs. {facility.radiusKm}km target</p>
              </div>
              <GapScoreRing score={facility.gapScore} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Public Reports & Download Center — FR-CP-08 / FR-XC-03 / Vol 4 API contracts.
import { useState, useMemo } from 'react'
import { FileDown, FileSpreadsheet, FileText, Map, Search, Calendar, CheckCircle2, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Icon from '../../components/ui/Icon'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { gisApi } from '../../services/api'
import { DEPARTMENTS, DEPARTMENT_MAP, DISTRICTS } from '../../config/constants'
import { formatDate } from '../../utils/format'

function toCsv(rows) {
  const headers = ['id', 'name', 'categoryLabel', 'departmentId', 'village', 'block', 'status', 'gapScore', 'latitude', 'longitude']
  const lines = [headers.join(',')]
  rows.forEach((r) => {
    const lat = r.position?.[1] || ''
    const lng = r.position?.[0] || ''
    const rowObj = { ...r, latitude: lat, longitude: lng }
    lines.push(headers.map((h) => `"${(rowObj[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
  })
  return lines.join('\n')
}

const PREBUILT_REPORTS = [
  {
    id: 'RPT-01',
    title: 'District Facility Master Index',
    category: 'facility',
    description: 'Complete directory of all registered public infrastructure assets with GPS coordinates and coverage gap scores.',
    format: 'CSV / GeoJSON',
    freq: 'Daily snapshot',
    size: '1.2 MB',
  },
  {
    id: 'RPT-02',
    title: 'Grievance Resolution & SLA Audit',
    category: 'grievance',
    description: 'Quarterly breakdown of citizen complaints, resolution SLA percentages, and departmental escalation rates.',
    format: 'PDF / CSV',
    freq: 'Monthly rollup',
    size: '840 KB',
  },
  {
    id: 'RPT-03',
    title: 'Spatial Deficit & Coverage Matrix',
    category: 'analytics',
    description: 'GIS deficit score breakdown per village catchment area vs. the standard 3km service radius target.',
    format: 'GeoJSON / PDF',
    freq: 'Weekly compute',
    size: '2.4 MB',
  },
  {
    id: 'RPT-04',
    title: 'Scheme Beneficiary Target vs. Achievement',
    category: 'schemes',
    description: 'Department-wise beneficiary coverage for state and national development schemes.',
    format: 'Excel / CSV',
    freq: 'Monthly rollup',
    size: '650 KB',
  },
]

export default function Reports() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)

  const [departmentId, setDepartmentId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState(null)

  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]

  const filteredCatalog = useMemo(() => {
    return PREBUILT_REPORTS.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [searchQuery])

  async function handleCsvDownload() {
    setDownloading('csv')
    const facilities = await gisApi.searchFacilities({
      districtId: district.id,
      departmentId: departmentId !== 'all' ? departmentId : undefined,
    })
    const blob = new Blob([toCsv(facilities)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ndisp-facilities-${district.id}-${departmentId}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(null)
    pushToast(`CSV facility listing for ${district.label} downloaded (${facilities.length} rows).`, 'success')
  }

  async function handleGeoJsonDownload() {
    setDownloading('geojson')
    const facilities = await gisApi.searchFacilities({
      districtId: district.id,
      departmentId: departmentId !== 'all' ? departmentId : undefined,
    })
    const geojson = {
      type: 'FeatureCollection',
      district: district.label,
      exportedAt: new Date().toISOString(),
      features: facilities.map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: f.position },
        properties: { id: f.id, name: f.name, departmentId: f.departmentId, gapScore: f.gapScore, status: f.status },
      })),
    }
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ndisp-gis-${district.id}-${departmentId}.geojson`
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(null)
    pushToast(`GeoJSON spatial dataset downloaded (${geojson.features.length} features).`, 'success')
  }

  async function handleMockExport(kind, title = 'Report') {
    setDownloading(kind + title)
    await new Promise((r) => setTimeout(r, 900))
    setDownloading(null)
    pushToast(`${kind.toUpperCase()} export job queued for "${title}" — svc-reporting will notify you when ready.`, 'info')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Citizen Portal · FR-CP-08"
        title="Public Reports & Data Download Center"
        description={`Access and export open datasets, GIS layers, and analytical rollups for ${district?.label}.`}
        action={
          <Select
            value={departmentId}
            onChange={setDepartmentId}
            options={[{ value: 'all', label: 'All departments' }, ...DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))]}
          />
        }
      />

      <div className="px-6 pb-8 space-y-6">
        {/* Instant Export Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardBody className="flex flex-col items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-leaf-100 text-leaf-700">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-ink-950">CSV Data Export</h3>
                <p className="text-[12px] text-ink-500 mt-0.5">Raw facility listing formatted for Excel & spreadsheets.</p>
              </div>
              <Button size="sm" variant="outline" icon={FileDown} loading={downloading === 'csv'} onClick={handleCsvDownload}>
                Download CSV
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-100 text-sky-700">
                <Map size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-ink-950">GeoJSON Spatial Layer</h3>
                <p className="text-[12px] text-ink-500 mt-0.5">Vector point layer with coordinates for QGIS/ArcGIS.</p>
              </div>
              <Button size="sm" variant="outline" icon={FileDown} loading={downloading === 'geojson'} onClick={handleGeoJsonDownload}>
                Download GeoJSON
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex flex-col items-start gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-alert-50 text-alert-600">
                <FileText size={16} />
              </div>
              <div>
                <h3 className="text-[13.5px] font-semibold text-ink-950">PDF District Brief</h3>
                <p className="text-[12px] text-ink-500 mt-0.5">Formatted publication document with maps & charts.</p>
              </div>
              <Button size="sm" variant="outline" icon={FileDown} loading={downloading === 'pdfDistrict Brief'} onClick={() => handleMockExport('pdf', 'District Brief')}>
                Request PDF
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Pre-built Reports Catalog */}
        <Card>
          <CardHeader
            title="Standard Publication Catalog"
            subtitle="Scheduled public disclosures and analytical audit summaries"
            action={
              <div className="relative w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search catalog…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-ink-50 pl-8 pr-3 py-1.5 text-[12px] focus:bg-white"
                />
              </div>
            }
          />
          <CardBody className="!p-0 divide-y divide-ink-50">
            {filteredCatalog.map((rpt) => (
              <div key={rpt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ink-50/50 transition-colors">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="kbd-mono text-[11px] text-ink-400">{rpt.id}</span>
                    <h4 className="text-[13.5px] font-semibold text-ink-950">{rpt.title}</h4>
                    <Badge tone="neutral">{rpt.format}</Badge>
                  </div>
                  <p className="text-[12px] text-ink-600 leading-snug">{rpt.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-ink-400 pt-1">
                    <span className="flex items-center gap-1"><RefreshCw size={11} /> {rpt.freq}</span>
                    <span>Approx. size: {rpt.size}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" icon={FileDown} onClick={() => handleMockExport('export', rpt.title)}>
                    Download Report
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

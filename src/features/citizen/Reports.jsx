// Public Reports & Download Center — FR-CP-08 / FR-XC-03 / Vol 4 API contracts.
import { useMemo, useState } from 'react'
import { FileDown, FileSpreadsheet, FileText, Map, Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { useAuthStore } from '../../app/store/authStore'
import { useUiStore } from '../../app/store/uiStore'
import { gisApi } from '../../services/api'
import { DEPARTMENTS, DISTRICTS } from '../../config/constants'
import { useAsync } from '../../hooks/useAsync'
import { backendReportApi } from '../../api/reportApi'

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

export default function Reports() {
  const user = useAuthStore((s) => s.user)
  const pushToast = useUiStore((s) => s.pushToast)

  const [departmentId, setDepartmentId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [generating, setGenerating] = useState(null)
  const [downloadId, setDownloadId] = useState(null)

  const district = DISTRICTS.find((d) => d.id === user?.districtId) || DISTRICTS[0]

  const listFetcher = useMemo(() => () => backendReportApi.list(), [])
  const { data: reports, loading: listLoading, error: listError, refetch } = useAsync(listFetcher, [])

  const filteredReports = useMemo(() => {
    if (!reports) return []
    if (!searchQuery.trim()) return reports
    const q = searchQuery.toLowerCase()
    return reports.filter((r) => r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
  }, [reports, searchQuery])

  async function handleCsvDownload() {
    setDownloading('csv')
    try {
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
      pushToast(`CSV facility listing for ${district.label} downloaded (${facilities.length} rows).`, 'success')
    } catch (e) {
      pushToast(`CSV export failed: ${e.message}`, 'error')
    } finally {
      setDownloading(null)
    }
  }

  async function handleGeoJsonDownload() {
    setDownloading('geojson')
    try {
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
      pushToast(`GeoJSON spatial dataset downloaded (${geojson.features.length} features).`, 'success')
    } catch (e) {
      pushToast(`GeoJSON export failed: ${e.message}`, 'error')
    } finally {
      setDownloading(null)
    }
  }

  async function handleGenerate(reportType, title) {
    setGenerating(reportType)
    try {
      const result = await backendReportApi.generate({ type: reportType, department: user?.departmentId || 1 })
      pushToast(`Report ${result.report.code} generated — ${result.message || 'success'}.`, 'success')
      refetch()
    } catch (e) {
      const msg = e?.message || 'Generation failed'
      if (e?.status === 404) pushToast(`Report type not available: ${msg}`, 'warning')
      else pushToast(`Generation failed: ${msg}`, 'error')
    } finally {
      setGenerating(null)
    }
  }

  async function handleDownload(report) {
    setDownloadId(report.id)
    try {
      const { blob, filename } = await backendReportApi.download(report.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename || `${report.code}.${(report.format || 'pdf').toLowerCase()}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      pushToast(`Report ${report.code} downloaded.`, 'success')
    } catch (e) {
      const msg = e?.message || 'Download failed'
      if (e?.status === 404) pushToast(`File not available: ${msg}. The report may still be generating.`, 'warning')
      else pushToast(`Download failed: ${msg}`, 'error')
    } finally {
      setDownloadId(null)
    }
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
              <Button size="sm" variant="outline" icon={generating === 'grievance' ? Loader2 : FileDown} loading={generating === 'grievance'} onClick={() => handleGenerate('grievance', 'District Brief')}>
                Generate PDF
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Backend Reports Catalog */}
        <Card>
          <CardHeader
            title="Report catalog"
            subtitle={reports ? `${reports.length} report(s) available` : 'Loading…'}
            action={
              <div className="flex items-center gap-2">
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
                <Button size="sm" variant="outline" icon={RefreshCw} onClick={refetch}>Refresh</Button>
              </div>
            }
          />
          <CardBody className="!p-0">
            {listLoading && (
              <div className="flex items-center gap-2 p-6 text-[12.5px] text-ink-500">
                <Loader2 size={14} className="animate-spin" /> Loading report catalog…
              </div>
            )}
            {listError && (
              <div className="flex items-center gap-2 p-6 text-[12.5px] text-alert-600">
                <AlertCircle size={14} /> Failed to load reports: {listError.message}
              </div>
            )}
            {!listLoading && !listError && filteredReports.length === 0 && (
              <div className="flex items-center gap-2 p-6 text-[12.5px] text-ink-500">
                {reports && reports.length === 0 ? 'No reports generated yet.' : 'No reports match your search.'}
              </div>
            )}
            {filteredReports.map((rpt) => (
              <div key={rpt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ink-50/50 transition-colors">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="kbd-mono text-[11px] text-ink-400">{rpt.code}</span>
                    <h4 className="text-[13px] font-semibold text-ink-950">{rpt.title}</h4>
                    <Badge tone="neutral">{rpt.format}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-ink-400">
                    <span>{rpt.category}</span>
                    <span>{rpt.departmentName}</span>
                    {rpt.districtName && <span>{rpt.districtName}</span>}
                    <span>{rpt.fileSize}</span>
                    {rpt.generatedAt && <span>{new Date(rpt.generatedAt).toLocaleDateString()}</span>}
                  </div>
                </div>

                <Button size="sm" variant="outline" icon={downloadId === rpt.id ? Loader2 : FileDown} loading={downloadId === rpt.id} onClick={() => handleDownload(rpt)}>
                  Download
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

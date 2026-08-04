// CSV Data Ingestion — Vol 3 Ch 11 (Data Ingestion Engine & Geocoding Pipeline).
// Line Department CSV upload with real file parsing, row preview, column mapping, and quarantine reporting.
import { useState, useCallback } from 'react'
import { UploadCloud, FileCheck2, AlertTriangle, CheckCircle2, ArrowRight, Table, Settings2, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { ingestionApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import { DEPARTMENT_MAP } from '../../config/constants'
import { formatNumber, formatDateTime } from '../../utils/format'

const REQUIRED_SCHEMA_FIELDS = [
  { key: 'facility_name', label: 'Facility Name', required: true },
  { key: 'category', label: 'Asset Category', required: true },
  { key: 'latitude', label: 'Latitude (°N)', required: true },
  { key: 'longitude', label: 'Longitude (°E)', required: true },
  { key: 'village', label: 'Village / Settlement', required: false },
  { key: 'block', label: 'Block Name', required: false },
]

export default function DataUpload() {
  const user = useAuthStore((s) => s.user)
  const dept = DEPARTMENT_MAP[user?.departmentId] || DEPARTMENT_MAP.health
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  // CSV parsing & mapping step states
  const [step, setStep] = useState('upload') // 'upload' | 'mapping' | 'report'
  const [selectedFile, setSelectedFile] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [previewRows, setPreviewRows] = useState([])
  const [columnMapping, setColumnMapping] = useState({})

  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const parseCsvText = (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return { headers: [], rows: [] }

    const parseLine = (line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '').trim())

    const headers = parseLine(lines[0])
    const rows = lines.slice(1, 10).map((l) => parseLine(l)) // preview first 9 rows

    return { headers, rows }
  }

  const handleFiles = useCallback((files) => {
    const file = files?.[0]
    if (!file) return

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const { headers, rows } = parseCsvText(text)
      setCsvHeaders(headers)
      setPreviewRows(rows)

      // Auto-map matching headers
      const autoMap = {}
      REQUIRED_SCHEMA_FIELDS.forEach((f) => {
        const match = headers.find((h) => h.toLowerCase().includes(f.key) || f.label.toLowerCase().includes(h.toLowerCase()))
        if (match) autoMap[f.key] = match
      })
      setColumnMapping(autoMap)
      setStep('mapping')
    }
    reader.readAsText(file)
  }, [])

  const runIngestionPipeline = async () => {
    setUploading(true)
    try {
      const report = await ingestionApi.uploadCsv(selectedFile.name, dept.id)
      setResult(report)
      setHistory((h) => [report, ...h])
      setStep('report')
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setStep('upload')
    setSelectedFile(null)
    setCsvHeaders([])
    setPreviewRows([])
    setColumnMapping({})
    setResult(null)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Line Department Portal · FR-LD-01"
        title="Data upload & ingestion (CSV)"
        description={`Bulk-load ${dept.label} facility data. Every row is schema-validated and geocoded; rejected rows are quarantined with reason codes.`}
      />

      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Upload / Mapping Step */}
        <div className="space-y-4">
          {step === 'upload' && (
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFiles(e.dataTransfer.files)
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center cursor-pointer transition-colors ${
                dragging ? 'border-saffron-400 bg-saffron-50' : 'border-ink-200 bg-white hover:border-ink-300'
              }`}
            >
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-500">
                <UploadCloud size={22} />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-ink-900">Drop a CSV file here, or click to browse</p>
                <p className="text-[12px] text-ink-500 mt-1">Must match published {dept.label} schema.</p>
              </div>
              <Button as="span" variant="outline" size="sm">
                Choose file
              </Button>
            </label>
          )}

          {step === 'mapping' && (
            <Card className="animate-fade-in">
              <CardHeader
                title="Column Mapping & Schema Alignment"
                subtitle={`File: ${selectedFile?.name} (${csvHeaders.length} columns detected)`}
                icon={Settings2}
                action={
                  <Button size="sm" variant="ghost" onClick={resetUpload}>
                    Change File
                  </Button>
                }
              />
              <CardBody className="space-y-4">
                <p className="text-[12px] text-ink-500">
                  Map your CSV column headers to the official NDISP <strong className="text-ink-800">{dept.label}</strong> asset schema fields:
                </p>

                <div className="space-y-2.5">
                  {REQUIRED_SCHEMA_FIELDS.map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <div className="w-1/2">
                        <span className="font-semibold text-ink-900">{f.label}</span>
                        {f.required && <span className="text-alert-600 ml-1">*</span>}
                        <p className="kbd-mono text-[11px] text-ink-400">{f.key}</p>
                      </div>

                      <div className="w-1/2">
                        <Select
                          small
                          value={columnMapping[f.key] || ''}
                          onChange={(val) => setColumnMapping((cur) => ({ ...cur, [f.key]: val }))}
                          options={[
                            { value: '', label: '— Select CSV Header —' },
                            ...csvHeaders.map((h) => ({ value: h, label: h })),
                          ]}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
                  <span className="text-[11.5px] text-ink-400">Step 2 of 3: Column verification</span>
                  <Button icon={ArrowRight} loading={uploading} onClick={runIngestionPipeline}>
                    Process & Validate Rows
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {step === 'report' && (
            <div className="card p-4 space-y-3 bg-leaf-50/50 border-leaf-200 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-leaf-900 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-leaf-600" /> File Processing Completed
                </span>
                <Button size="sm" variant="outline" icon={RefreshCw} onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
              <p className="text-[12px] text-ink-600">
                Batch <strong className="kbd-mono">{result?.batchId}</strong> has been schema-validated and ingested into <strong className="text-ink-800">svc-asset</strong>.
              </p>
            </div>
          )}

          {/* Expected Columns Reference Card */}
          <Card>
            <CardHeader title="Published Schema Reference" subtitle="mst_asset_category.field_schema" />
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {REQUIRED_SCHEMA_FIELDS.map((c) => (
                  <span key={c.key} className="kbd-mono text-[11px] bg-ink-100 text-ink-700 rounded px-2 py-0.5">
                    {c.key}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Preview / Validation Report */}
        <div className="space-y-4">
          {step === 'mapping' && previewRows.length > 0 && (
            <Card className="animate-fade-in">
              <CardHeader title="CSV Row Preview (First 9 Rows)" icon={Table} />
              <CardBody className="!p-0 overflow-x-auto">
                <table className="w-full text-[11.5px] text-left divide-y divide-ink-100">
                  <thead className="bg-ink-50">
                    <tr>
                      {csvHeaders.map((h, i) => (
                        <th key={i} className="px-3 py-2 font-semibold text-ink-700 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50 font-mono text-[11px]">
                    {previewRows.map((r, ri) => (
                      <tr key={ri} className="hover:bg-ink-50/50">
                        {r.map((cell, ci) => (
                          <td key={ci} className="px-3 py-1.5 whitespace-nowrap text-ink-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}

          {result && (
            <Card className="animate-fade-in">
              <CardHeader
                title="Validation & Geocoding Report"
                subtitle={result.fileName}
                icon={result.rejected === 0 ? CheckCircle2 : AlertTriangle}
                action={<Badge tone="neutral" className="kbd-mono">{result.batchId}</Badge>}
              />
              <CardBody>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div>
                    <p className="text-xl font-display font-semibold text-ink-950">{formatNumber(result.totalRows)}</p>
                    <p className="text-[10.5px] text-ink-400">Total rows</p>
                  </div>
                  <div>
                    <p className="text-xl font-display font-semibold text-leaf-600">{formatNumber(result.accepted)}</p>
                    <p className="text-[10.5px] text-ink-400">Accepted</p>
                  </div>
                  <div>
                    <p className="text-xl font-display font-semibold text-alert-600">{formatNumber(result.rejected)}</p>
                    <p className="text-[10.5px] text-ink-400">Rejected</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12.5px] text-ink-600 mb-3">
                  <FileCheck2 size={14} className="text-leaf-600" /> {result.geocodedPct}% of accepted rows geocoded successfully
                </div>

                {result.rejectedRows.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 mb-2">
                      Quarantined rows (Rejection reasons)
                    </p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {result.rejectedRows.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[12px] text-ink-600 bg-alert-50 rounded-lg px-2.5 py-1.5">
                          <span className="kbd-mono text-alert-600 shrink-0">Row {r.row}</span>
                          <span>{r.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {history.length > 0 && (
            <Card>
              <CardHeader title="Upload History (This Session)" />
              <CardBody className="!p-0">
                {history.map((h) => (
                  <div key={h.batchId} className="flex items-center justify-between px-5 py-2.5 border-b border-ink-50 last:border-0 text-[12.5px]">
                    <span className="truncate font-medium text-ink-900">{h.fileName}</span>
                    <span className="text-ink-400 text-[11.5px]">{formatDateTime(h.completedAt)}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

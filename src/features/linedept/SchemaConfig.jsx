// Master Data & Field Schema Explorer — Vol 2 Ch 14 (mst_asset_category.field_schema).
import { useState } from 'react'
import { Settings2, Database, Code, CheckCircle2, ShieldCheck } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import { FACILITY_SCHEMAS } from '../../services/mock/facilitySchemas'
import { DEPARTMENTS, DEPARTMENT_MAP } from '../../config/constants'

export default function SchemaConfig() {
  const [selectedDept, setSelectedDept] = useState('health')
  const schema = FACILITY_SCHEMAS[selectedDept]
  const dept = DEPARTMENT_MAP[selectedDept]

  return (
    <div>
      <PageHeader
        eyebrow="Line Department Portal · Vol 2 Ch 14"
        title="Master data & asset schema explorer"
        description="Inspect official JSON field schemas (mst_asset_category.field_schema), custodian registry, and GIS geometry specifications."
        action={
          <Select
            value={selectedDept}
            onChange={setSelectedDept}
            options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))}
          />
        }
      />

      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Custodian & Meta Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Data Custodian & Provenance" icon={ShieldCheck} />
            <CardBody className="space-y-3 text-[12.5px]">
              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Department</p>
                <p className="text-[14px] font-semibold text-ink-950 mt-0.5">{dept.label}</p>
              </div>

              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Designated Data Custodian</p>
                <p className="text-[13px] font-medium text-ink-800 mt-0.5">{schema.custodian}</p>
              </div>

              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">GIS Geometry Type</p>
                <Badge tone="info" className="mt-1">Point / LineString GeoJSON</Badge>
              </div>

              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Ingestion Validation Engine</p>
                <p className="text-[12px] text-ink-600 mt-0.5">Strict JSON Schema v7 validation + PostGIS spatial bounding box verification.</p>
              </div>
            </CardBody>
          </Card>

          {/* Published Categories */}
          <Card>
            <CardHeader title="Published Asset Categories" icon={Database} />
            <CardBody className="!p-0 divide-y divide-ink-50">
              {schema.categories.map((cat) => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between text-[12.5px]">
                  <div>
                    <p className="font-semibold text-ink-950">{cat.label}</p>
                    <p className="kbd-mono text-[11px] text-ink-400">{cat.id}</p>
                  </div>
                  <Badge tone="neutral">{cat.radiusKm} km radius</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* JSON Schema & Field Specs */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Field Schema Specification" icon={Settings2} />
            <CardBody className="space-y-4">
              <p className="text-[12.5px] text-ink-600">
                The attributes below define the extendable JSONB data model stored in <strong className="kbd-mono text-[11.5px]">ast_facility.attributes</strong> for {dept.label}:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {schema.attributeFields.map((field) => (
                  <div key={field} className="p-3 rounded-xl bg-ink-50/70 border border-ink-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="kbd-mono font-semibold text-[12px] text-ink-950">{field}</span>
                      <Badge tone="positive">Required</Badge>
                    </div>
                    <p className="text-[11px] text-ink-500">Validation: Strict Type & Range Check</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Raw JSON Schema Definition" icon={Code} />
            <CardBody className="!p-0">
              <pre className="p-4 bg-ink-950 text-leaf-400 font-mono text-[11.5px] overflow-x-auto rounded-b-xl leading-relaxed">
{JSON.stringify(
  {
    $schema: 'http://json-schema.org/draft-07/schema#',
    departmentId: selectedDept,
    custodian: schema.custodian,
    attributeFields: schema.attributeFields,
    categories: schema.categories,
  },
  null,
  2
)}
              </pre>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

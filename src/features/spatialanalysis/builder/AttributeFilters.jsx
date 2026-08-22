import { Plus, Trash2 } from 'lucide-react'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import { FIELD_OPERATORS, FILTER_LOGIC, DERIVED_FIELDS } from '../spatialAnalysisModel'

// Section 5 — attribute filters.  field / operator / value with AND/OR joins.
// The field list is built from REAL attributes of the target layer (plus the
// documented derived fields); a filter on a field the data does not provide is
// impossible to create.
export default function AttributeFilters({ filters, onChange, fieldCatalog, targetName, errors = {} }) {
  const fieldOptions = [
    ...(fieldCatalog || []).map((field) => ({ value: field, label: field })),
    ...Object.entries(DERIVED_FIELDS).map(([key, meta]) => ({ value: key, label: `${key} (derived — ${meta.description})` })),
  ]

  const update = (index, patch) => {
    const next = filters.map((filter, i) => (i === index ? { ...filter, ...patch } : filter))
    onChange(next)
  }

  const remove = (index) => onChange(filters.filter((_, i) => i !== index))
  const add = () => onChange([...filters, { id: `f${Date.now()}`, field: '', operator: 'eq', value: '', logic: 'and' }])

  const selectedOperator = (index) => {
    const filter = filters[index]
    const fieldMeta = fieldOptions.find((o) => o.value === filter.field)
    return FIELD_OPERATORS.filter((op) => op.types.some((t) => !fieldMeta?.value || ['number', 'string', 'boolean'].includes(t)))
  }

  return (
    <div className="space-y-2.5">
      {!filters.length ? (
        <p className="text-[12.5px] text-ink-400">No attribute filters — the spatial condition applies to all features of {targetName || 'the target layer'}.</p>
      ) : (
        filters.map((filter, index) => (
          <div key={filter.id} className="rounded-xl border border-ink-100 bg-ink-50/30 p-2.5 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select
                value={filter.field}
                onChange={(value) => update(index, { field: value })}
                options={[{ value: '', label: 'Field…' }, ...fieldOptions]}
                small
                className="w-full"
              />
              <Select
                value={filter.operator}
                onChange={(value) => update(index, { operator: value })}
                options={selectedOperator(index).map((op) => ({ value: op.key, label: op.label }))}
                small
                className="w-full"
              />
              <input
                value={filter.value}
                onChange={(e) => update(index, { value: e.target.value })}
                placeholder="Value (comma-separated for in)"
                className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[13px] text-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/20 col-span-2 md:col-span-1"
              />
              <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                {index > 0 && (
                  <Select
                    value={filter.logic || 'and'}
                    onChange={(value) => update(index, { logic: value })}
                    options={FILTER_LOGIC.map((l) => ({ value: l.key, label: l.label }))}
                    small
                    className="w-full"
                  />
                )}
                <Button size="xs" variant="outline" onClick={() => remove(index)} className="shrink-0">
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
            {errors[`filters.${index}.value`] && <p className="text-[11.5px] text-alert-600">{errors[`filters.${index}.value`]}</p>}
            {errors[`filters.${index}.field`] && <p className="text-[11.5px] text-alert-600">{errors[`filters.${index}.field`]}</p>}
          </div>
        ))
      )}
      <Button size="xs" variant="outline" onClick={add}>
        <Plus size={12} /> Add filter
      </Button>
    </div>
  )
}
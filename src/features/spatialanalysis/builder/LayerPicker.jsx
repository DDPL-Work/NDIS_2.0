import Select from '../../../components/ui/Select'

// Layer picker shared by the Target Layer and Reference Layer sections.
// Options are REAL backend layers: GIS catalog layers and facility categories
// built from the live facilities collection.  value = `${type}:${id}`.
export default function LayerPicker({ value, onChange, layers, placeholder = 'Select a layer…', error, disabled }) {
  const options = [
    { value: '', label: placeholder },
    ...(layers || []).map((layer) => ({
      value: `${layer.type}:${layer.id}`,
      label: `${layer.name} (${layer.geometryType || '?'}, ${layer.featureCount ?? '?'} features)`,
    })),
  ]
  return (
    <div className="space-y-1.5">
      <Select
        value={value || ''}
        onChange={onChange}
        options={options}
        disabled={disabled}
        className="w-full"
      />
      {error && <p className="text-[11.5px] text-alert-600">{error}</p>}
    </div>
  )
}
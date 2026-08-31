import { useAssetCategories } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function AssetCategorySelector({ departmentId, value, onChange, small, disabled, className, showAll = false, allLabel = 'All Categories' }) {
  const { data: categories, loading, error } = useAssetCategories(departmentId)

  const options = showAll
    ? [{ value: '', label: allLabel }, ...(categories || []).map((c) => ({ value: String(c.id), label: c.name }))]
    : (categories || []).map((c) => ({ value: String(c.id), label: c.name }))

  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading categories...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No categories available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

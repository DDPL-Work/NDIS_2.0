import { useDistricts } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function DistrictSelector({ value, onChange, small, disabled, className, showAll = false, allLabel = 'All Districts' }) {
  const { data: districts, loading, error } = useDistricts()

  const options = showAll
    ? [{ value: '', label: allLabel }, ...(districts || []).map((d) => ({ value: String(d.id), label: d.name }))]
    : (districts || []).map((d) => ({ value: String(d.id), label: d.name }))

  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading districts...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No districts available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

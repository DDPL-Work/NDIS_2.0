import { useDepartments } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function DepartmentSelector({ value, onChange, small, disabled, className, showAll = false, allLabel = 'All Departments' }) {
  const { data: departments, loading, error } = useDepartments()

  const options = showAll
    ? [{ value: '', label: allLabel }, ...(departments || []).map((d) => ({ value: String(d.id), label: d.name }))]
    : (departments || []).map((d) => ({ value: String(d.id), label: d.name }))

  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading departments...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No departments available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

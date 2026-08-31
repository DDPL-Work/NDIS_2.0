import { useDepartmentOfficers } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function DepartmentOfficerSelector({ departmentId, value, onChange, small, disabled, className, showAll = false, allLabel = 'All Officers' }) {
  const { data: officers, loading, error } = useDepartmentOfficers(departmentId)

  const officerList = Array.isArray(officers) ? officers : (officers?.users || officers?.results || [])
  const options = showAll
    ? [{ value: '', label: allLabel }, ...officerList.map((o) => ({ value: String(o.id), label: o.name || o.full_name || `${o.first_name} ${o.last_name}` }))]
    : officerList.map((o) => ({ value: String(o.id), label: o.name || o.full_name || `${o.first_name} ${o.last_name}` }))

  if (!departmentId) return <Select small={small} disabled value="" options={[{ value: '', label: 'Select department first' }]} className={className} />
  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading officers...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No officers available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

import { useRoles } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function RoleSelector({ value, onChange, small, disabled, className, filter }) {
  const { data: roles, loading, error } = useRoles()

  const roleList = Array.isArray(roles) ? roles : (roles?.results || [])
  const filtered = filter ? roleList.filter(filter) : roleList
  const options = filtered.map((r) => ({ value: String(r.code || r.id), label: r.name || r.label }))

  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading roles...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No roles available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

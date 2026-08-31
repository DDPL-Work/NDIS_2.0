import { useBlocks } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function BlockSelector({ districtId, value, onChange, small, disabled, className, showAll = false, allLabel = 'All Blocks' }) {
  const { data: blocks, loading, error } = useBlocks(districtId)

  const options = showAll
    ? [{ value: '', label: allLabel }, ...(blocks || []).map((b) => ({ value: String(b.id), label: b.name }))]
    : (blocks || []).map((b) => ({ value: String(b.id), label: b.name }))

  if (!districtId) return <Select small={small} disabled value="" options={[{ value: '', label: 'Select district first' }]} className={className} />
  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading blocks...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No blocks available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

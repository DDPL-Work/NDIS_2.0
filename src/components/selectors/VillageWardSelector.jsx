import { useVillageWards } from '../../hooks/useMasterData'
import Select from '../ui/Select'

export default function VillageWardSelector({ blockId, value, onChange, small, disabled, className, showAll = false, allLabel = 'All Village/Wards' }) {
  const { data: villageWards, loading, error } = useVillageWards(blockId)

  const options = showAll
    ? [{ value: '', label: allLabel }, ...(villageWards || []).map((v) => ({ value: String(v.id), label: v.name }))]
    : (villageWards || []).map((v) => ({ value: String(v.id), label: v.name }))

  if (!blockId) return <Select small={small} disabled value="" options={[{ value: '', label: 'Select block first' }]} className={className} />
  if (loading) return <Select small={small} disabled value="" options={[{ value: '', label: 'Loading village/wards...' }]} className={className} />
  if (error || !options.length) return <Select small={small} disabled value="" options={[{ value: '', label: 'No village/wards available' }]} className={className} />

  return <Select small={small} value={value} onChange={onChange} options={options} disabled={disabled} className={className} />
}

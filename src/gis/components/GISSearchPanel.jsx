import { useMemo, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import { executeGISQuery } from '../engine/GISQueryEngine'

const SUGGESTIONS = ['Nearest hospital', 'Nearby water tank', 'Schools within 5 km', 'High priority complaints', 'Projects in Rajgir']
export default function GISSearchPanel({ facilities, complaints, projects, center, allowedDepartments, onResults }) {
  const [query, setQuery] = useState(''); const [submitted, setSubmitted] = useState('')
  const outcome = useMemo(() => submitted ? executeGISQuery(submitted, { facilities, complaints, projects, center, allowedDepartments }) : null, [submitted, facilities, complaints, projects, center, allowedDepartments])
  function run(value = query) { setQuery(value); setSubmitted(value); const next = executeGISQuery(value, { facilities, complaints, projects, center, allowedDepartments }); onResults?.(next) }
  return <div className="space-y-2"><div className="flex gap-2"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/><input className="input-field !pl-9" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && run()} placeholder="Ask about nearby services, complaints or projects…"/></div><Button size="sm" icon={Sparkles} onClick={() => run()}>Search</Button></div><div className="flex gap-1 flex-wrap">{SUGGESTIONS.map((item) => <button key={item} onClick={() => run(item)} className="text-[11px] px-2 py-1 rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200">{item}</button>)}</div>{outcome && <p className="text-[11px] text-ink-500">{outcome.results.length} result{outcome.results.length === 1 ? '' : 's'} found{outcome.intent.radiusKm ? ` within ${outcome.intent.radiusKm} km` : ''}.</p>}</div>
}

import { useState } from 'react'
import { AlertCircle, Search } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import CitizenComplaintDetail from './CitizenComplaintDetail'
import { useComplaintEngine } from '../../app/store/complaintEngine'

export default function TrackGrievance() {
  const complaints = useComplaintEngine((state) => state.complaints); const [code, setCode] = useState(''); const [result, setResult] = useState(undefined)
  const search = (event) => { event.preventDefault(); const value = code.trim().toLowerCase(); setResult(complaints.find((item) => [item.trackingCode, item.ticketNumber].filter(Boolean).some((key) => key.toLowerCase() === value)) || null) }
  return <div className="max-w-2xl mx-auto p-6"><div className="text-center mb-6"><h2 className="text-xl font-display font-semibold">Track Complaint</h2><p className="text-sm text-ink-500 mt-1">Enter the tracking number you received after submitting your complaint.</p></div><form onSubmit={search} className="flex gap-2"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"/><input className="w-full input-field !pl-9 kbd-mono" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter tracking number"/></div><Button type="submit">Track</Button></form>{result === null && <p className="mt-5 rounded-xl border border-alert-200 bg-alert-50 p-3 text-sm text-alert-700 flex gap-2"><AlertCircle size={16}/>No complaint found. Please check the tracking number.</p>}{result && <div className="mt-6 card p-4"><span className="text-xs text-ink-400">Tracking number</span><h3 className="font-semibold">{result.title}</h3><p className="text-sm text-ink-600 mt-1">Current update: {result.state === 'verification_pending' ? 'Waiting for your review' : result.state.replace(/_/g, ' ')}</p><Button className="mt-3" onClick={() => setResult({ ...result, open: true })}>View details</Button></div>}<Modal open={Boolean(result?.open)} onClose={() => setResult({ ...result, open: false })} width="max-w-3xl">{result?.open && <CitizenComplaintDetail complaintId={result.id} onClose={() => setResult({ ...result, open: false })}/>}</Modal></div>
}

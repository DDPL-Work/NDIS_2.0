import { useState } from 'react'
import { Bot, MapPin, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { getGISSuggestions } from '../engine/GISSuggestionEngine'

const QUICK_ACTIONS = [
  { label: 'Show complaints', icon: ShieldAlert, query: 'Show complaints' },
  { label: 'Find assets', icon: MapPin, query: 'Find assets' },
  { label: 'Road defects', icon: Sparkles, query: 'Road defects' },
]

export default function GISAssistant({ onAsk }) {
  const [text, setText] = useState('')
  const suggestions = getGISSuggestions(text).length ? getGISSuggestions(text) : getGISSuggestions('').slice(0, 4)
  const submit = (value) => { const trimmed = String(value || text).trim(); if (!trimmed) return; onAsk?.(trimmed); setText('') }
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-900"><Bot size={16} className="text-saffron-600" /> AI GIS Assistant</div>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-500">Ask in plain language — locate services, surface nearby complaints, and highlight results on the map.</p>
      </div>

      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); submit('') }}>
        <textarea
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit('') } }}
          className="input-field min-h-0 resize-none !py-1.5 !text-xs leading-relaxed whitespace-normal break-words"
          placeholder="Ask the GIS assistant…"
        />
        <button type="submit" aria-label="Ask" className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ink-900 text-white hover:bg-ink-800"><Send size={13} /></button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return <button key={action.label} type="button" onClick={() => submit(action.query)} className="flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink-700 transition-colors hover:border-saffron-200 hover:bg-saffron-50 hover:text-saffron-700"><Icon size={12} />{action.label}</button>
        })}
      </div>

      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">Try asking</div>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((item) => <button key={item} type="button" onClick={() => submit(item)} className="rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-[11px] text-ink-600 transition-colors hover:border-saffron-200 hover:bg-saffron-50 hover:text-saffron-700">{item}</button>)}
        </div>
      </div>
    </div>
  )
}
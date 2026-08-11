import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Camera, ChevronLeft, ChevronRight, Flame, Layers, PanelLeft, PanelRight } from 'lucide-react'
import MapView from '../../components/map/MapView'
import GISSearchPanel from './GISSearchPanel'
import GISLayerPanel from './GISLayerPanel'
import GISResultsDrawer from './GISResultsDrawer'
import GISAnalyticsPanel from './GISAnalyticsPanel'
import GISInfoCard from './GISInfoCard'
import GISAssistant from './GISAssistant'
import RouteSummary from './RouteSummary'
import { useGISCatalog } from '../../hooks/useGISCatalog'
import { useVectorLayers } from '../../hooks/useVectorLayers'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useRoute } from '../../hooks/useRoute'

const MODES = [
  { id: 'all', label: 'All' },
  { id: 'asset', label: 'Assets' },
  { id: 'complaint', label: 'Complaints' },
  { id: 'project', label: 'Projects' },
]

export default function GISCommandCenter({ facilities = [], complaints = [], projects = [], center, zoom = 12, user, allowedDepartments, onOpen }) {
  const { data: catalog } = useGISCatalog()
  const vector = useVectorLayers()
  const mapRef = useRef(null)
  const isWide = useMediaQuery('(min-width: 1400px)')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [mode, setMode] = useState('all')
  const [flags, setFlags] = useState({ heatmap: false, cluster: true })
  const [selected, setSelected] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [history, setHistory] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [resultsOpen, setResultsOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(true)
  const routing = useRoute()
  const routeActiveId = routing.routeActiveId

  // Below 1400px the side docks auto-collapse to their 48px rails so the map
  // keeps the majority of the viewport.
  useEffect(() => {
    if (!isWide) { setLeftOpen(false); setRightOpen(false) }
  }, [isWide])

  // Leaflet only measures its container once; re-measure after the dock layout
  // mounts and whenever the side panels / bottom panels are opened or closed.
  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.map?.invalidateSize(), 50)
    return () => clearTimeout(timer)
  }, [leftOpen, rightOpen, resultsOpen, analyticsOpen, isWide])

  const toggleFlag = (key) => setFlags((current) => ({ ...current, [key]: !current[key] }))

  const visiblePoints = useMemo(() => {
    if (mode === 'all') return facilities
    return facilities.filter((point) => point.type === mode)
  }, [facilities, mode])

  const heatPoints = useMemo(() => visiblePoints.filter((point) => Array.isArray(point.position) && point.position.length >= 2), [visiblePoints])

  const runOutcome = (next) => {
    setOutcome(next)
    if (next?.results?.[0]) setSelected(next.results[0])
    if (next?.query) setHistory((current) => [{ query: next.query, count: (next.results || []).length, at: Date.now() }, ...current].slice(0, 20))
    setResultsOpen(true)
  }

  const toggleBookmark = (item) => {
    const key = String(item?.id || item?.name)
    if (!key) return
    setBookmarks((current) => current.some((row) => String(row.id) === key) ? current.filter((row) => String(row.id) !== key) : [item, ...current])
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 shadow-sm">
      {/* Toolbar */}
      <div className="flex w-full shrink-0 items-center gap-1.5 border-b border-ink-100 bg-white px-3 py-1.5">
        <button onClick={() => setLeftOpen((value) => !value)} aria-label="Toggle GIS assistant" title="GIS assistant" className={`rounded-md p-1.5 transition-colors ${leftOpen ? 'bg-saffron-500 text-white' : 'text-ink-500 hover:bg-ink-100'}`}><PanelLeft size={15} /></button>
        <button onClick={() => setRightOpen((value) => !value)} aria-label="Toggle layer manager" title="Layer manager" className={`rounded-md p-1.5 transition-colors ${rightOpen ? 'bg-saffron-500 text-white' : 'text-ink-500 hover:bg-ink-100'}`}><PanelRight size={15} /></button>
        <div className="mx-1 h-5 w-px shrink-0 bg-ink-100" />
        <div className="min-w-0 flex-1 max-w-[560px]">
          <GISSearchPanel compact bare center={center} user={user} allowedDepartments={allowedDepartments} onResults={runOutcome} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActiveId={routeActiveId} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} routeStartId={routing.routeStartId} routeDestinationId={routing.routeDestinationId} />
        </div>
        <div className="mx-1 h-5 w-px shrink-0 bg-ink-100" />

        {/* Segmented mode control */}
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-ink-200">
          {MODES.map((item) => (
            <button key={item.id} onClick={() => setMode(item.id)} className={`px-2.5 py-1 text-[11.5px] font-medium transition-colors ${mode === item.id ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 hover:bg-ink-50'}`}>{item.label}</button>
          ))}
        </div>

        <div className="mx-1 h-5 w-px shrink-0 bg-ink-100" />
        <div className="flex shrink-0 items-center gap-1">
          <ToolbarToggle active={flags.heatmap} onClick={() => toggleFlag('heatmap')} label="Heatmap density"><Flame size={14} /></ToolbarToggle>
          <ToolbarToggle active={flags.cluster} onClick={() => toggleFlag('cluster')} label="Cluster markers"><Layers size={14} /></ToolbarToggle>
        </div>

        <span className="hidden shrink-0 text-[11px] text-ink-400 lg:inline">{visiblePoints.length} points</span>
        <button onClick={() => mapRef.current?.snapshot?.()} className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-50"><Camera size={13} />Export</button>
      </div>

      {/* True 3-column docked workspace: left / center / right. */}
      <div className="flex min-h-0 flex-1">
        {/* LEFT DOCK — AI Assistant (fixed 320px, shrink-0, collapsible to 48px) */}
        {leftOpen ? (
          <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-r border-ink-100 bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400"><Bot size={13} className="text-saffron-600" />Assistant</span>
              <button onClick={() => setLeftOpen(false)} aria-label="Collapse assistant" title="Collapse assistant" className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-800"><ChevronLeft size={14} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3"><GISAssistant onAsk={(text) => window.dispatchEvent(new CustomEvent('ndisp-gis-ask', { detail: text }))} /></div>
            <div className="shrink-0 border-t border-ink-100 px-3 py-2 text-[10.5px] text-ink-400">Enter to run · Shift+Enter for a new line</div>
          </aside>
        ) : (
          <aside className="flex w-[48px] shrink-0 flex-col overflow-hidden border-r border-ink-100 bg-white">
            <button onClick={() => setLeftOpen(true)} className="flex h-full w-full flex-col items-center gap-2.5 py-3 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700" title="Show AI Assistant">
              <Bot size={16} />
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>AI Assistant</span>
            </button>
          </aside>
        )}

        {/* CENTER — Map (flex:1, min-width:0, always fills remaining space) */}
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <MapView ref={mapRef} center={center} zoom={zoom} facilities={visiblePoints} searchResults={outcome?.results || []} onSearchResultOpen={(row) => setSelected(row)} onSearchResultRoute={routing.showRoute} heatPoints={heatPoints} showHeat={flags.heatmap} clusterEnabled={flags.cluster} vectorLayers={vector.layers} selectedId={selected?.id} onFacilityClick={(facility) => setSelected(facility)} route={routing.route} className="h-full" />
          </div>
          {selected && (
            <div className="absolute right-3 top-3 z-20 w-[300px] max-w-full">
              <GISInfoCard item={selected} bookmarked={bookmarks.some((row) => String(row.id) === String(selected.id))} onClose={() => setSelected(null)} onBookmark={toggleBookmark} onOpen={onOpen} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActive={routeActiveId != null && routeActiveId === String(selected.id)} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} onSwap={routing.swapFacilities} startFacility={routing.startFacility} destinationFacility={routing.destinationFacility} />
            </div>
          )}
          <div className="absolute bottom-3 left-3 z-20">
            <RouteSummary status={routing.status} mode={routing.mode} route={routing.route} startFacility={routing.startFacility} destinationFacility={routing.destinationFacility} errorMessage={routing.errorMessage} onShowShortest={routing.showFacilityRoute} onSwap={routing.swapFacilities} onClear={routing.clearRoute} />
          </div>
        </main>

        {/* RIGHT DOCK — Layer Manager (fixed 320px, shrink-0, collapsible to 48px) */}
        {rightOpen ? (
          <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-ink-100 bg-white">
            <div className="min-h-0 flex-1"><GISLayerPanel catalog={catalog} visible={vector.visible} loading={vector.loading} onToggle={vector.toggle} /></div>
          </aside>
        ) : (
          <aside className="flex w-[48px] shrink-0 flex-col overflow-hidden border-l border-ink-100 bg-white">
            <button onClick={() => setRightOpen(true)} className="flex h-full w-full flex-col items-center gap-2.5 py-3 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700" title="Show Layer Manager">
              <Layers size={16} />
              <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Layers</span>
            </button>
          </aside>
        )}
      </div>

      {/* Bottom panels */}
      <GISAnalyticsPanel points={visiblePoints} complaints={complaints} projects={projects} open={analyticsOpen} onToggle={() => setAnalyticsOpen((value) => !value)} />
      <GISResultsDrawer outcome={outcome} history={history} bookmarks={bookmarks} open={resultsOpen} onToggle={() => setResultsOpen((value) => !value)} onSelect={(row) => { setSelected(row); mapRef.current?.showResult(row); setResultsOpen(false) }} onToggleBookmark={toggleBookmark} onClose={() => setOutcome(null)} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActiveId={routeActiveId} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} routeStartId={routing.routeStartId} routeDestinationId={routing.routeDestinationId} />
    </div>
  )
}

function ToolbarToggle({ active, onClick, label, children }) {
  return <button title={label} aria-label={label} onClick={onClick} className={`rounded-md p-1.5 transition-colors ${active ? 'bg-saffron-500 text-white' : 'text-ink-500 hover:bg-ink-100'}`}>{children}</button>
}
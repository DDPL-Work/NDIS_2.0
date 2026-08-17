import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { Bot, Camera, ChevronLeft, ChevronRight, Flame, Layers, MapPin, PanelLeft, PanelRight, Wrench } from 'lucide-react'
import MapView from '../../components/map/MapView'
import GISSearchPanel from './GISSearchPanel'
import GISLayerPanel from './GISLayerPanel'
import GISResultsDrawer from './GISResultsDrawer'
import GISAnalyticsPanel from './GISAnalyticsPanel'
import GISFeaturePanel from './GISFeaturePanel'
import GISAssistant from './GISAssistant'
import GISQuickTools from './GISQuickTools'
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

const LEFT_TABS = [
  { id: 'assistant', label: 'Assistant', icon: Bot },
  { id: 'tools', label: 'Tools', icon: Wrench },
]

const RIGHT_TABS = [
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'details', label: 'Details', icon: MapPin },
]

export default function GISCommandCenter({ facilities = [], complaints = [], projects = [], center, zoom = 12, user, allowedDepartments, onOpen, deptId = '', deptLabel = 'department', can = () => true }) {
  const { data: catalog } = useGISCatalog()
  const vector = useVectorLayers()
  const mapRef = useRef(null)
  const isWide = useMediaQuery('(min-width: 1400px)')
  const isTablet = useMediaQuery('(min-width: 1024px)')
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [leftTab, setLeftTab] = useState('assistant')
  const [rightTab, setRightTab] = useState('layers')
  const [mode, setMode] = useState('all')
  const [flags, setFlags] = useState({ heatmap: false, cluster: true })
  const [selected, setSelected] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [history, setHistory] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [resultsOpen, setResultsOpen] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const routing = useRoute()
  const routeActiveId = routing.routeActiveId

  const leftDocked = isWide || isTablet
  const rightDocked = isWide

  // Map keeps the majority of the viewport on smaller screens: the right panel
  // overlays the map on tablets and both panels become overlay drawers on
  // mobile. On wide screens both panels stay docked.
  useEffect(() => {
    if (!isWide) setRightOpen(false)
    if (!isTablet) setLeftOpen(false)
  }, [isWide, isTablet])

  // Selecting a feature opens the right panel on the Details tab; closing the
  // panel itself never clears the selection (only the Details header's X does).
  useEffect(() => {
    if (selected) { setRightTab('details'); setRightOpen(true) }
  }, [selected?.id])

  // Leaflet only measures its container once; re-measure after the dock layout
  // mounts and whenever the side panels / bottom panels are opened or closed.
  useEffect(() => {
    const timer = setTimeout(() => mapRef.current?.map?.invalidateSize(), 50)
    return () => clearTimeout(timer)
  }, [leftOpen, rightOpen, resultsOpen, analyticsOpen, isWide, isTablet])

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

  const fitToData = () => {
    const map = mapRef.current?.map
    const points = visiblePoints.filter((point) => Array.isArray(point.position) && point.position.length >= 2)
    if (!map || !points.length) return
    const bounds = L.latLngBounds(points.map((point) => L.latLng(point.position[1], point.position[0])))
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 14, duration: 0.9 })
  }

  const askAssistant = (text) => window.dispatchEvent(new CustomEvent('ndisp-gis-ask', { detail: text }))

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 shadow-sm">
      {/* Toolbar */}
      <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 border-b border-ink-100 bg-white px-3 py-1.5">
        <button onClick={() => setLeftOpen((value) => !value)} aria-label="Toggle GIS assistant and tools" title="GIS assistant & tools" className={`rounded-md p-1.5 transition-colors ${leftOpen ? 'bg-saffron-500 text-white' : 'text-ink-500 hover:bg-ink-100'}`}><PanelLeft size={15} /></button>
        <button onClick={() => setRightOpen((value) => !value)} aria-label="Toggle layers and feature details" title="Layers & feature details" className={`rounded-md p-1.5 transition-colors ${rightOpen ? 'bg-saffron-500 text-white' : 'text-ink-500 hover:bg-ink-100'}`}><PanelRight size={15} /></button>
        <div className="mx-1 hidden h-5 w-px shrink-0 bg-ink-100 sm:block" />
        <div className="min-w-0 flex-1 basis-64 sm:max-w-[560px]">
          <GISSearchPanel compact bare center={center} user={user} allowedDepartments={allowedDepartments} onResults={runOutcome} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActiveId={routeActiveId} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} routeStartId={routing.routeStartId} routeDestinationId={routing.routeDestinationId} />
        </div>
        <div className="mx-1 hidden h-5 w-px shrink-0 bg-ink-100 sm:block" />

        {/* Segmented mode control */}
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-ink-200">
          {MODES.map((item) => (
            <button key={item.id} onClick={() => setMode(item.id)} className={`px-2.5 py-1 text-[11.5px] font-medium transition-colors ${mode === item.id ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 hover:bg-ink-50'}`}>{item.label}</button>
          ))}
        </div>

        <div className="mx-1 hidden h-5 w-px shrink-0 bg-ink-100 sm:block" />
        <div className="flex shrink-0 items-center gap-1">
          <ToolbarToggle active={flags.heatmap} onClick={() => toggleFlag('heatmap')} label="Heatmap density"><Flame size={14} /></ToolbarToggle>
          <ToolbarToggle active={flags.cluster} onClick={() => toggleFlag('cluster')} label="Cluster markers"><Layers size={14} /></ToolbarToggle>
        </div>

        <span className="hidden shrink-0 text-[11px] text-ink-400 lg:inline">{visiblePoints.length} points</span>
        <button onClick={() => mapRef.current?.snapshot?.()} className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11.5px] font-medium text-ink-700 hover:bg-ink-50"><Camera size={13} />Export</button>
      </div>

      {/* Workspace: left / center / right. On wide screens a true 3-column dock;
          on tablets the right panel overlays the map; on mobile both panels
          become overlay drawers so the map always keeps the majority. */}
      <div className="relative flex min-h-0 flex-1">
        {/* LEFT PANEL — AI Assistant | GIS Tools */}
        {leftOpen ? (
          <aside className={`${leftDocked ? 'relative flex w-[320px] shrink-0 flex-col border-r border-ink-100 bg-white' : 'absolute inset-y-0 left-0 z-30 flex w-[min(88vw,340px)] flex-col border-r border-ink-100 bg-white shadow-xl'}`}>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-100 px-3 py-2">
              <div className="flex items-center gap-1 overflow-hidden rounded-lg bg-ink-100 p-0.5">
                {LEFT_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button key={tab.id} onClick={() => setLeftTab(tab.id)} aria-label={`Show ${tab.label}`} className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${leftTab === tab.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}><Icon size={12} />{tab.label}</button>
                  )
                })}
              </div>
              <button onClick={() => setLeftOpen(false)} aria-label="Close panel" title="Close panel" className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-800"><ChevronLeft size={14} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {leftTab === 'assistant'
                ? <GISAssistant onAsk={askAssistant} />
                : <GISQuickTools deptId={deptId} deptLabel={deptLabel} mode={mode} can={can} onAsk={askAssistant} onSetMode={setMode} onLocate={() => mapRef.current?.locateUser?.()} onFitData={fitToData} onZoomIn={() => mapRef.current?.map?.zoomIn()} onZoomOut={() => mapRef.current?.map?.zoomOut()} />}
            </div>
            {leftTab === 'assistant' && <div className="shrink-0 border-t border-ink-100 px-3 py-2 text-[10.5px] text-ink-400">Enter to run · Shift+Enter for a new line</div>}
          </aside>
        ) : (
          leftDocked && (
            <aside className="flex w-[48px] shrink-0 flex-col overflow-hidden border-r border-ink-100 bg-white">
              <button onClick={() => setLeftOpen(true)} className="flex h-full w-full flex-col items-center gap-2.5 py-3 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700" title="Show GIS assistant & tools" aria-label="Show GIS assistant and tools">
                <Bot size={16} />
                <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Assistant</span>
              </button>
            </aside>
          )
        )}

        {/* CENTER — Map (flex:1, min-width:0, always fills remaining space) */}
        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <MapView ref={mapRef} center={center} zoom={zoom} facilities={visiblePoints} searchResults={outcome?.results || []} onSearchResultOpen={(row) => setSelected(row)} onSearchResultRoute={routing.showRoute} heatPoints={heatPoints} showHeat={flags.heatmap} clusterEnabled={flags.cluster} vectorLayers={vector.layers} selectedId={selected?.id} onFacilityClick={(facility) => setSelected(facility)} route={routing.route} className="h-full" />
          </div>
          <div className="absolute bottom-3 left-3 z-20">
            <RouteSummary status={routing.status} route={routing.route} origin={routing.origin} destination={routing.destination} errorMessage={routing.errorMessage} onCalculate={routing.calculateRoute} onClear={routing.clearRoute} />
          </div>
        </main>

        {/* RIGHT PANEL — Layers | Feature Details */}
        {rightOpen ? (
          <aside className={`${rightDocked ? 'relative flex w-[320px] shrink-0 flex-col border-l border-ink-100 bg-white' : 'absolute inset-y-0 right-0 z-30 flex w-[min(88vw,360px)] flex-col border-l border-ink-100 bg-white shadow-xl'}`}>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ink-100 px-3 py-2">
              <div className="flex items-center gap-1 overflow-hidden rounded-lg bg-ink-100 p-0.5">
                {RIGHT_TABS.map((tab) => {
                  const Icon = tab.icon
                  const badge = tab.id === 'details' && selected ? 1 : 0
                  return (
                    <button key={tab.id} onClick={() => setRightTab(tab.id)} aria-label={`Show ${tab.label}`} className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${rightTab === tab.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800'}`}>
                      <Icon size={12} />{tab.label}
                      {badge > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-saffron-500 text-[8px] font-bold text-white">{badge}</span>}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setRightOpen(false)} aria-label="Close panel" title="Close panel" className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-800"><ChevronRight size={14} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {rightTab === 'layers'
                ? <GISLayerPanel catalog={catalog} visible={vector.visible} loading={vector.loading} onToggle={vector.toggle} embedded />
                : selected
                  ? <GISFeaturePanel item={selected} bookmarked={bookmarks.some((row) => String(row.id) === String(selected.id))} onClose={() => setSelected(null)} onBookmark={toggleBookmark} onOpen={onOpen} onShowRoute={routing.showRoute} onClearRoute={routing.clearRoute} routeActive={routeActiveId != null && routeActiveId === String(selected.id)} routeLoading={routing.status === 'loading'} onRouteStart={routing.setRouteStart} onRouteDestination={routing.setRouteDestination} onSwap={routing.swapFacilities} startFacility={routing.startFacility} destinationFacility={routing.destinationFacility} />
                  : (
                    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 px-6 text-center">
                      <MapPin size={22} className="text-ink-300" />
                      <p className="text-[12px] font-medium text-ink-500">No feature selected</p>
                      <p className="text-[11px] leading-relaxed text-ink-400">Click any point on the map, or pick a result from search, to inspect its details here.</p>
                    </div>
                  )}
            </div>
          </aside>
        ) : (
          rightDocked && (
            <aside className="flex w-[48px] shrink-0 flex-col overflow-hidden border-l border-ink-100 bg-white">
              <button onClick={() => setRightOpen(true)} className="flex h-full w-full flex-col items-center gap-2.5 py-3 text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700" title="Show layers & feature details" aria-label="Show layers and feature details">
                <Layers size={16} />
                <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Layers</span>
              </button>
            </aside>
          )
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
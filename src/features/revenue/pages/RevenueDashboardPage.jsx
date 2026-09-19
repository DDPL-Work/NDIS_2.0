import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ListChecks, RefreshCw, Search, MapPin } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { RevenueMapWorkspace } from '../components/RevenueMapWorkspace'
import { TaxListModal } from '../components/TaxListModal'
import { PayTaxModal } from '../components/PayTaxModal'
import { FindPropertyModal } from '../components/FindPropertyModal'
import { useCadastralResi } from '../hooks/useTaxRevenue'
import { taxRevenueApi } from '../api/taxRevenueApi'
import Button from '../../../components/ui/Button'
import 'leaflet/dist/leaflet.css'

export function RevenueDashboardPage() {
  const queryClient = useQueryClient()
  const mapWorkspaceRef = useRef(null)
  const [basemap, setBasemap] = useState('osm')
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [taxListOpen, setTaxListOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [findPropertyOpen, setFindPropertyOpen] = useState(false)
  const [paymentProperty, setPaymentProperty] = useState(null)
  const [receiptError, setReceiptError] = useState(null)
  const { features, featureCount, isLoading, isError, error, refetch, isFetching } = useCadastralResi()

  const handleRefresh = useCallback(async () => {
    if (isFetching) return
    try {
      await refetch()
    } catch (err) {
      // Error is handled by TanStack Query error boundary / inline error state
      console.error('[REVENUE REFRESH] Failed:', err)
    }
  }, [refetch, isFetching])

  const selectedFeature = useMemo(() => features.find((f) => `data_resi_${f.id}` === String(selectedId) || String(f.id) === String(selectedId)) || null, [features, selectedId])

  // Search results - does NOT filter map layer, only used for dropdown suggestions
  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return []
    return features.filter(({ id, properties = {} }) => [id, properties.plot_no, properties.name, properties.mobile, properties.ward, properties.block, properties.village].some((v) => String(v || '').toLowerCase().includes(term)))
  }, [features, search])

  // Auto-select and fly to property when single search result
  useEffect(() => {
    if (!search.trim() || searchResults.length !== 1) return
    const feature = searchResults[0]
    const featureId = `data_resi_${feature.id}`
    if (selectedId === featureId) return
    setSelectedId(featureId)
  }, [search, searchResults, selectedId])

  // Fly to selected feature when it changes
  useEffect(() => {
    if (selectedFeature) {
      mapWorkspaceRef.current?.focusFeature(selectedFeature)
    }
  }, [selectedFeature])

const openPayment = useCallback((feature) => { setPaymentProperty(feature); setPaymentOpen(true) }, [])
  const clearSelected = useCallback(() => setSelectedId(null), [])
  const selectFeature = useCallback((id) => setSelectedId(id), [])
  const handleFindPropertySelect = useCallback(({ feature, taxCalc }) => {
    const featureId = `data_resi_${feature.id || feature.plot_id || feature.plotId}`
    setSelectedId(featureId)
  }, [])
  const handlePaymentSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['taxRevenue', 'cadastralResi'] })
    queryClient.invalidateQueries({ queryKey: ['taxRevenue', 'taxList'] })
  }, [queryClient])
  const openReceipt = useCallback((feature) => {
    const p = feature.properties || {}
    const receiptUrl = p.receipt_url || taxRevenueApi.getTaxSlipUrl({
      id: p.id || feature.id,
      plot_id: p.plot_id || p.plotId,
      plot_no: p.plot_no,
      receipt_no: p.receipt_no,
      txn_id: p.transaction_id,
    })
    const receiptWindow = window.open(receiptUrl, '_blank', 'noopener,noreferrer')
    if (!receiptWindow) setReceiptError('Your browser blocked the official receipt window. Allow pop-ups and try again.')
  }, [])
  const paymentPrefill = paymentProperty ? { id: paymentProperty.id, plotId: paymentProperty.id, plotNo: paymentProperty.properties?.plot_no, ownerName: paymentProperty.properties?.name, mobile: paymentProperty.properties?.mobile, areaSqft: paymentProperty.properties?.area_sqft } : {}

  return <div className="flex h-full min-h-[calc(100vh-7rem)] flex-col bg-ink-50 p-3 sm:p-5">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-lg font-semibold text-ink-950">Property Tax GIS</h1><p className="text-sm text-ink-600">Cadastral property tax workspace · data source: backend API</p></div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          loading={isFetching}
          onClick={handleRefresh}
          disabled={isFetching}
          className="gap-1.5"
          aria-busy={isFetching}
          aria-label="Refresh cadastral data"
        >
          <RefreshCw className="h-4 w-4" />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setFindPropertyOpen(true)}
          className="gap-1.5"
        >
          <MapPin className="h-4 w-4" />
          Find Paid Tax Property
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setTaxListOpen(true)}
          className="gap-1.5"
        >
          <ListChecks className="h-4 w-4" />
          Property Tax Register
        </Button>
      </div>
    </div>
    <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
      {receiptError && <div role="alert" className="absolute right-3 top-3 z-50 rounded bg-alert-100 px-3 py-2 text-sm text-alert-900 shadow"><button className="ml-3 underline" onClick={() => setReceiptError(null)}>Dismiss</button>{receiptError}</div>}
      <div className="absolute left-3 top-3 z-30 w-[min(20rem,calc(100%-1.5rem))]"><label className="sr-only" htmlFor="property-search">Search properties</label><div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 shadow"><Search className="h-4 w-4 text-ink-500" /><input id="property-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plot, owner, mobile…" className="min-w-0 flex-1 text-sm outline-none" />{search && <button aria-label="Clear property search" onClick={() => { setSearch(''); clearSelected() }} className="text-xs text-ink-500">Clear</button>}</div>{search && searchResults.length > 1 && <div className="mt-1 max-h-56 overflow-auto rounded-lg border border-ink-200 bg-white shadow">{searchResults.slice(0, 8).map((f) => <button key={f.id} onClick={() => setSelectedId(`data_resi_${f.id}`)} className="block w-full border-b border-ink-100 px-3 py-2 text-left text-sm hover:bg-ink-50"><span className="font-medium">Plot {f.properties?.plot_no || f.id}</span><span className="ml-2 text-ink-600">{f.properties?.name || 'N/A'}</span></button>)}</div>}</div>
      {isLoading && <div className="absolute inset-0 z-40 grid place-items-center bg-white/80 text-sm text-ink-600">Loading cadastral properties…</div>}
      {isError && <div className="absolute inset-0 z-40 grid place-items-center bg-white p-6 text-center"><div><p className="font-medium text-ink-900">Property data is unavailable</p><p className="mt-1 text-sm text-ink-600">{error?.message || 'The cadastral layer could not be loaded.'}</p><button onClick={() => refetch()} className="mt-3 rounded bg-ink-900 px-3 py-2 text-sm text-white">Retry</button></div></div>}
      {!isLoading && !isError && search.trim() && searchResults.length === 0 && <div role="status" className="absolute left-3 top-16 z-30 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 shadow">No property found</div>}
      <RevenueMapWorkspace ref={mapWorkspaceRef} cadastralFeatures={features} selectedFeatureId={selectedId} selectedFeature={selectedFeature} onFeatureSelect={selectFeature} onCloseProperty={clearSelected} onPayProperty={openPayment} onReceiptProperty={openReceipt} onPaymentSuccess={handlePaymentSuccess} onMapClick={clearSelected} basemap={basemap} onBasemapChange={setBasemap} height="100%" showMeasurements={false} />
      <div className="absolute bottom-3 left-3 z-20 rounded bg-white/90 px-2 py-1 text-xs text-ink-600 shadow">{featureCount} backend cadastral properties</div>
    </div>
    <TaxListModal isOpen={taxListOpen} onClose={() => setTaxListOpen(false)} onLocatePlot={(r) => { setSelectedId(`data_resi_${r.plot_id || r.id}`); setTaxListOpen(false) }} onPayPlot={(r) => openPayment({ id: r.plot_id || r.id, properties: { ...r, name: r.owner_name || r.ownerName } })} onViewReceipt={(r) => openReceipt({ id: r.plot_id || r.id, properties: { ...r, name: r.owner_name || r.ownerName } })} />
    <PayTaxModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} prefillData={paymentPrefill} onPaymentSuccess={() => { queryClient.invalidateQueries({ queryKey: ['taxRevenue'] }); setPaymentOpen(false) }} />
    <FindPropertyModal isOpen={findPropertyOpen} onClose={() => setFindPropertyOpen(false)} onPropertySelect={handleFindPropertySelect} />
  </div>
}

export default RevenueDashboardPage

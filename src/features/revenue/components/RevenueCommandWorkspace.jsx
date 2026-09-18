import React, { useState } from 'react';
import { Map, BarChart, CreditCard, FileText, Search, Filter, Camera, Gauge } from 'lucide-react';
import RevenueMap from './RevenueMap';
import { RevenueModeSelector } from './RevenueModeSelector';
import { RevenueInsightsPanel } from './RevenueInsightsPanel';
import { RevenueAnalyticsPanel } from './RevenueAnalyticsPanel';
import { PropertyCommandDrawer } from './PropertyCommandDrawer';
import { RevenueKpiCards } from './RevenueKpiCards';
import { PaymentDialog } from './PaymentDialog';
import { TaxRegisterModal } from './TaxRegisterModal';
import { TaxSearchModal } from './TaxSearchModal';
import { SpatialQueryModal } from './SpatialQueryModal';
import { GeotagVerificationModal } from './GeotagVerificationModal';
import { DdssDecisionDashboardModal } from './DdssDecisionDashboardModal';
import { REVENUE_ANALYTICAL_MODES } from '../utils/revenueGisUtils';

export function RevenueCommandWorkspace({
  kpis,
  trends,
  blockAnalytics,
  reviewCandidates,
  filters,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [selectedPropertyForPayment, setSelectedPropertyForPayment] = useState(null);
  const [showTaxRegister, setShowTaxRegister] = useState(false);
  const [showPayTaxModal, setShowPayTaxModal] = useState(false);
  const [showTaxSearch, setShowTaxSearch] = useState(false);
  const [showSpatialQuery, setShowSpatialQuery] = useState(false);
  const [showGeotagModal, setShowGeotagModal] = useState(false);
  const [showDdssModal, setShowDdssModal] = useState(false);
  const [analyticalMode, setAnalyticalMode] = useState(REVENUE_ANALYTICAL_MODES.PROPERTY);
  const [showMobileInsights, setShowMobileInsights] = useState(false);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-ink-50">
      {/* Top KPI Strip */}
      <div className="shrink-0 px-3 py-2 bg-white border-b border-ink-200 overflow-x-auto">
        <RevenueKpiCards data={kpis} />
      </div>

      {/* View Tab Switcher & Portal CTAs */}
      <div className="shrink-0 border-b border-ink-200 bg-white px-4 flex flex-wrap items-center justify-between text-sm font-medium gap-2">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab(0)}
            className={`py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 0 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <Map className="w-4 h-4" />
            GIS Spatial Command Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(1)}
            className={`py-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 1 ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            <BarChart className="w-4 h-4" />
            Executive Analytics & Ranking
          </button>
        </div>

        {/* Portal Revenue CTAs */}
        <div className="flex flex-wrap items-center gap-2 py-1.5">
          <button
            type="button"
            onClick={() => setShowTaxSearch(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden md:inline">Tax Search</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTaxRegister(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Tax Register</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSpatialQuery(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Spatial Query</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDdssModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">DM DDSS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedPropertyForPayment) {
                setShowPayTaxModal(true);
              } else if (selectedPropertyId) {
                setSelectedPropertyForPayment({ id: selectedPropertyId, plotId: selectedPropertyId, plotNo: String(selectedPropertyId) });
                setShowPayTaxModal(true);
              } else {
                setShowTaxSearch(true);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border border-emerald-500/30 flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg transform active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5 text-white" />
            <span>Pay Tax Online</span>
          </button>
          <button
            type="button"
            onClick={() => setShowMobileInsights(!showMobileInsights)}
            className="lg:hidden text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
          >
            ⓘ
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left/Center — Map or Analytics */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {activeTab === 0 ? (
            <div className="flex-1 relative min-h-0">
              <RevenueMap
                height="100%"
                showToolbar
                showLegend
                showResultList
                filters={filters}
                selectedPropertyId={selectedPropertyId}
                onPropertySelect={(id) => setSelectedPropertyId(id)}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <RevenueAnalyticsPanel
                trends={trends}
                blockAnalytics={blockAnalytics}
                reviewCandidates={reviewCandidates}
                onSelectProperty={(id) => setSelectedPropertyId(id)}
              />
            </div>
          )}
        </div>

        {/* Right Intelligence Panel — Desktop */}
        <div className="hidden lg:flex w-72 min-w-[280px] h-full border-l border-ink-200 bg-white flex-col">
          <RevenueInsightsPanel
            activeMode={analyticalMode}
            kpis={kpis}
            onSelectReviewCandidate={() => setActiveTab(1)}
          />
        </div>

        {/* Mobile / Tablet Intelligence Drawer Overlay */}
        {showMobileInsights && (
          <div className="fixed inset-0 z-50 flex flex-col lg:hidden pointer-events-auto">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowMobileInsights(false)} />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col z-50">
              <div className="p-3 bg-ink-900 text-white flex justify-between items-center">
                <span className="font-bold text-sm">GIS Intelligence Summary</span>
                <button type="button" onClick={() => setShowMobileInsights(false)} className="text-ink-400 hover:text-white p-1">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <RevenueInsightsPanel
                  activeMode={analyticalMode}
                  kpis={kpis}
                  onSelectReviewCandidate={() => {
                    setShowMobileInsights(false);
                    setActiveTab(1);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Command Drawer */}
      {selectedPropertyId && (
        <PropertyCommandDrawer
          propertyId={selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
        />
      )}

      {/* Tax Register Ledger Modal */}
      {showTaxRegister && (
        <TaxRegisterModal
          isOpen={showTaxRegister}
          onClose={() => setShowTaxRegister(false)}
          onLocatePlot={(item) => {
            setSelectedPropertyId(item.id || item.plotId);
            setShowTaxRegister(false);
          }}
          onPayPlot={(item) => {
            setSelectedPropertyForPayment(item);
            setShowTaxRegister(false);
            setShowPayTaxModal(true);
          }}
        />
      )}

      {/* Search Property Modal */}
      {showTaxSearch && (
        <TaxSearchModal
          isOpen={showTaxSearch}
          onClose={() => setShowTaxSearch(false)}
          onSelectProperty={(id) => {
            setSelectedPropertyId(id);
            setShowTaxSearch(false);
          }}
          onPayProperty={(item) => {
            setSelectedPropertyForPayment(item);
            setShowTaxSearch(false);
            setShowPayTaxModal(true);
          }}
        />
      )}

      {/* Multi-Layer Spatial Query Modal */}
      {showSpatialQuery && (
        <SpatialQueryModal
          isOpen={showSpatialQuery}
          onClose={() => setShowSpatialQuery(false)}
          onLocateResult={(res) => {
            setShowSpatialQuery(false);
          }}
        />
      )}

      {/* Geotag Verification Modal */}
      {showGeotagModal && (
        <GeotagVerificationModal
          isOpen={showGeotagModal}
          onClose={() => setShowGeotagModal(false)}
        />
      )}

      {/* DM DDSS Decision Dashboard Modal */}
      {showDdssModal && (
        <DdssDecisionDashboardModal
          isOpen={showDdssModal}
          onClose={() => setShowDdssModal(false)}
        />
      )}

      {/* Pay Tax Dialog Modal */}
      {showPayTaxModal && (
        <PaymentDialog
          isOpen={showPayTaxModal}
          onClose={() => setShowPayTaxModal(false)}
          property={selectedPropertyForPayment}
          onSuccess={() => {
            setShowPayTaxModal(false);
          }}
        />
      )}
    </div>
  );
}

export default RevenueCommandWorkspace;
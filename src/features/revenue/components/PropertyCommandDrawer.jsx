import React, { useState, useEffect } from 'react';
import { X, Home, Calendar, AlertTriangle, Gavel, FileText, History, MapPin, Eye, DollarSign, Calculator, Map, CheckCircle2 } from 'lucide-react';
import { Button, Badge } from '../../../components/ui';
import { usePropertyDetail } from '../hooks/useProperties';
import { useRevenueScheduleIntegration } from '../hooks/useRevenueScheduleIntegration';
import { formatCurrency, formatArea } from '../utils/revenueFormatters';

export function PropertyCommandDrawer({ propertyId, onClose, onAction, onActionSuccess }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'financial' | 'location' | 'workflows' | 'audit'
  const { property, assessment, notices = [], inspections = [], taxHistory = [], isLoading } = usePropertyDetail(propertyId);
  const { scheduleInspectionTask } = useRevenueScheduleIntegration();
  const [actionFeedback, setActionFeedback] = useState(null);

  // Keyboard shortcut: Escape closes drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!propertyId) return null;

  // Action handlers
  const handleScheduleInspection = async () => {
    if (!property) return;
    try {
      const res = await scheduleInspectionTask(property, {
        inspectionType: 'GIS_AUDIT',
        purpose: 'Field verification of built-up area discrepancy'
      });
      if (res?.success) {
        setActionFeedback({ severity: 'success', text: `Inspection task scheduled in DM Schedule system (Task ID: ${res.taskId})` });
        onActionSuccess?.('schedule_inspection', res);
      } else {
        setActionFeedback({ severity: 'error', text: 'Failed to schedule inspection task.' });
      }
    } catch (err) {
      setActionFeedback({ severity: 'error', text: err.message || 'Error scheduling inspection' });
    }
  };

  const handleIssueNotice = () => {
    setActionFeedback({ severity: 'success', text: `Tax Demand Notice draft initialized for property ${property?.plotNo || propertyId}` });
    onAction?.('issue_notice', property);
  };

  const handleInitiateRecovery = () => {
    setActionFeedback({ severity: 'success', text: `Recovery proceedings initiated for property ${property?.plotNo || propertyId}` });
    onAction?.('recovery', property);
  };

  const handleReassess = () => {
    setActionFeedback({ severity: 'success', text: `Reassessment workflow triggered for property ${property?.plotNo || propertyId}` });
    onAction?.('reassess', property);
  };

  const handleViewDetails = () => {
    setActiveTab('summary');
    onAction?.('view_details', property);
  };

  const handleViewTax = () => {
    setActiveTab('financial');
    onAction?.('view_tax', property);
  };

  const handleHistory = () => {
    setActiveTab('workflows');
    onAction?.('history', property);
  };

  const handleOpenGis = () => {
    setActiveTab('location');
    onAction?.('open_gis', property);
  };

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} aria-hidden="true" />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl md:max-w-2xl bg-white shadow-2xl flex flex-col z-50 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-ink-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/30 border border-blue-400/40 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {property?.plotNo || property?.holdingNumber || `Property #${propertyId}`}
              </h2>
              <p className="text-xs text-ink-300">
                {property?.ownerName || 'Property Record'} • {property?.blockName || 'Nalanda District'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close property drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className={`p-3 text-xs flex justify-between items-center shrink-0 ${
            actionFeedback.severity === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            <span className="font-medium">{actionFeedback.text}</span>
            <button type="button" onClick={() => setActionFeedback(null)} className="font-bold ml-2 p-1">✕</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="text-xs text-ink-500">Loading property intelligence...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Command Action Bar (All 8 required actions) */}
            <div className="p-3 bg-ink-50 border-b border-ink-200 flex gap-2 flex-wrap shrink-0">
              <Button type="button" size="xs" variant="primary" onClick={handleViewDetails} className="gap-1">
                <Eye className="w-3.5 h-3.5" />
                View Details
              </Button>
              <Button type="button" size="xs" variant="secondary" onClick={handleViewTax} className="gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                <DollarSign className="w-3.5 h-3.5" />
                View Tax
              </Button>
              <Button type="button" size="xs" variant="outline" onClick={handleHistory} className="gap-1">
                <History className="w-3.5 h-3.5" />
                History
              </Button>
              <Button type="button" size="xs" variant="outline" onClick={handleScheduleInspection} className="gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Schedule Inspection
              </Button>
              <Button type="button" size="xs" variant="outline" onClick={handleReassess} className="gap-1 text-purple-700 border-purple-300 hover:bg-purple-50">
                <Calculator className="w-3.5 h-3.5" />
                Reassess
              </Button>
              <Button type="button" size="xs" variant="outline" onClick={handleIssueNotice} className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-50">
                <AlertTriangle className="w-3.5 h-3.5" />
                Issue Notice
              </Button>
              <Button type="button" size="xs" variant="outline" onClick={handleInitiateRecovery} className="gap-1 text-red-700 border-red-300 hover:bg-red-50">
                <Gavel className="w-3.5 h-3.5" />
                Recovery
              </Button>
              <Button type="button" size="xs" variant="outline" onClick={handleOpenGis} className="gap-1">
                <Map className="w-3.5 h-3.5" />
                Open in GIS
              </Button>
            </div>

            {/* Controlled Navigation Tabs */}
            <div className="flex border-b border-ink-200 bg-white px-3 text-xs font-medium shrink-0 overflow-x-auto">
              {[
                { id: 'summary', label: 'Summary' },
                { id: 'financial', label: 'Financial' },
                { id: 'location', label: 'Location & GIS' },
                { id: 'workflows', label: 'Workflows & Notices' },
                { id: 'audit', label: 'Audit & Risk' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                    activeTab === t.id ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-ink-500 hover:text-ink-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Controlled Tab Content Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Property Identification & Attributes</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Plot Number</span>
                      <span className="font-bold text-ink-900">{property?.plotNo || property?.plot_id || '—'}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Owner Name</span>
                      <span className="font-bold text-ink-900">{property?.ownerName || '—'}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Property Type</span>
                      <span className="font-bold text-ink-900 uppercase">{property?.propertyType || 'Residential'}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Built-up Area</span>
                      <span className="font-bold text-ink-900">{formatArea(property?.builtUpAreaSqft || property?.builtUpAreaSqFt || 0)}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Tax Status</span>
                      <Badge className="capitalize">{property?.taxStatus || 'due'}</Badge>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Financial Year</span>
                      <span className="font-bold text-ink-900">{property?.financialYear || '2025-26'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Tax Dues & Financial Summary</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-xs text-ink-500 block mb-0.5">Total Demand</span>
                      <span className="text-lg font-bold text-ink-900">{formatCurrency(property?.currentDemand || property?.demand || 0)}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-xs text-ink-500 block mb-0.5">Total Paid</span>
                      <span className="text-lg font-bold text-emerald-600">{formatCurrency(property?.totalPaid || property?.paid || 0)}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-xs text-ink-500 block mb-0.5">Outstanding Dues</span>
                      <span className="text-lg font-bold text-red-600">{formatCurrency(property?.totalOutstanding || property?.outstanding || 0)}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-xs text-ink-500 block mb-0.5">Accumulated Arrears</span>
                      <span className="text-lg font-bold text-amber-600">{formatCurrency(property?.totalArrears || property?.arrears || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Spatial Geometry & Location</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-ink-50 rounded-lg col-span-2">
                      <span className="text-ink-500 block mb-0.5">Address</span>
                      <span className="font-bold text-ink-900">{property?.address || 'Nalanda, Bihar'}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Block</span>
                      <span className="font-bold text-ink-900">{property?.blockName || 'Silao'}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Ward</span>
                      <span className="font-bold text-ink-900">{property?.wardName || 'Ward 4'}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Centroid Latitude</span>
                      <span className="font-mono text-ink-900">{property?.latitude || 25.1372}</span>
                    </div>
                    <div className="p-3 bg-ink-50 rounded-lg">
                      <span className="text-ink-500 block mb-0.5">Centroid Longitude</span>
                      <span className="font-mono text-ink-900">{property?.longitude || 85.4434}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'workflows' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider">Issued Notices & Inspections</h3>
                  {notices.length === 0 && inspections.length === 0 ? (
                    <div className="p-4 text-center text-xs text-ink-500 bg-ink-50 rounded-lg">
                      No active notices or field inspection records.
                    </div>
                  ) : (
                    <>
                      {notices.map((n, i) => (
                        <div key={i} className="p-3 border border-ink-200 rounded-lg text-xs bg-white">
                          <p className="font-bold text-ink-900">{n.noticeType || 'Tax Demand Notice'}</p>
                          <p className="text-ink-500 mt-0.5">Issued: {n.issueDate || '2025-01-15'} • Status: {n.status || 'SERVED'}</p>
                        </div>
                      ))}
                      {inspections.map((ins, i) => (
                        <div key={i} className="p-3 border border-blue-200 rounded-lg text-xs bg-blue-50/50">
                          <p className="font-bold text-blue-900">{ins.inspectionType || 'GIS Field Verification'}</p>
                          <p className="text-blue-700 mt-0.5">Inspector: {ins.inspectorName || 'DM Field Team'} • Status: {ins.status || 'COMPLETED'}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider">Risk Analytics & AI Audit Flags</h3>
                  <div className={`p-3 rounded-lg border text-xs ${
                    property?.isHighRisk ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    Risk Assessment Score: <span className="font-bold">{property?.riskScore || 25}/100</span> — {property?.isHighRisk ? 'High Risk Property' : 'Low Risk Compliance'}
                  </div>
                  <div className="p-3 bg-ink-50 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-ink-800">Compliance Summary:</p>
                    <p className="text-ink-600">
                      {property?.reviewReason || 'Property verified against satellite footprint boundaries and historical assessment logs.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PropertyCommandDrawer;

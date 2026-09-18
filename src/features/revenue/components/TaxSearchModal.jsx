import React, { useState } from 'react';
import { X, Search, User, Phone, Hash, Home, MapPin, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Input } from '../../../components/ui';
import { propertyTaxApi } from '../api/propertyTaxApi';
import { formatCurrency } from '../utils/revenueFormatters';

export function TaxSearchModal({ isOpen, onClose, onSelectProperty, onPayProperty }) {
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [plotNo, setPlotNo] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState(null);
  const [results, setResults] = useState([]);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const query = ownerName.trim() || plotNo.trim() || mobile.trim() || houseNo.trim();
    if (!query) {
      setMessage({ type: 'warning', text: 'Please enter at least one search criterion (Name, Mobile, Plot No, or House No).' });
      return;
    }

    setIsSearching(true);
    setMessage({ type: 'info', text: 'Searching cadastral property tax records...' });
    setResults([]);

    try {
      const res = await propertyTaxApi.fetchTaxList({
        search: query,
        plot_no: plotNo.trim() || undefined,
        page_size: 50,
      });

      const list = res.data || [];
      if (list.length === 0) {
        setMessage({ type: 'error', text: 'No residential property found matching your criteria.' });
      } else {
        setMessage({ type: 'success', text: `Found ${list.length} matching properties. Select one below:` });
        setResults(list);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error searching property tax records.' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-800 text-slate-100 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden z-10 border border-slate-700 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-base text-slate-100">Search Property for Tax Payment</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Results */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-slate-400">
            Enter Property Owner Name, Mobile Number, or Plot Number to view GIS cadastral assessment and make online tax payment.
          </p>

          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" /> Owner / Citizen Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter owner name (e.g. Ram Singh)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" /> Mobile Number
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number (e.g. 7217052558)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-sky-400" /> Plot Number
                </label>
                <input
                  type="text"
                  value={plotNo}
                  onChange={(e) => setPlotNo(e.target.value)}
                  placeholder="Plot No (e.g. 108)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-sky-400" /> House / Unit No
                </label>
                <input
                  type="text"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="House No..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSearching} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 py-2">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search Property
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="border-slate-700 text-slate-300 hover:bg-slate-700 text-xs">
                Cancel
              </Button>
            </div>
          </form>

          {/* Feedback Message */}
          {message && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              message.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              {message.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              {results.map((item, idx) => {
                const propId = item.id || item.plotId || item.raw?.plot_id || idx;
                const pName = item.ownerName || item.raw?.owner_name || item.raw?.name || 'Citizen';
                const pPlot = item.plotId || item.raw?.plot_no || String(item.id || 'N/A');
                const pTax = item.demand || item.currentDemand || item.raw?.tax_amount || 0;
                const isPaid = item.isPaid || item.taxStatus === 'paid' || item.raw?.status === 'PAID';
                const mobile = item.mobile || item.raw?.mobile || item.raw?.phone || '';
                const areaSqft = item.landAreaSqft || item.raw?.area_sqft || item.raw?.land_area_sqft || 0;

                return (
                  <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-700 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        Plot #{pPlot} — {pName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Demand: {formatCurrency(pTax)}</span>
                        <span>•</span>
                        <span className={isPaid ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {isPaid ? 'PAID' : 'DUE / UNPAID'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onSelectProperty?.(propId);
                          onClose();
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-md flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" /> View Map
                      </button>
                      <button
                        onClick={() => {
                          onPayProperty?.({
                            id: item.id || `data_resi_${pPlot}`,
                            plotId: pPlot,
                            plotNo: pPlot,
                            ownerName: pName,
                            mobile,
                            demand: pTax,
                            taxAmount: pTax,
                            areaSqft
                          });
                          onClose();
                        }}
                        className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md flex items-center gap-1"
                      >
                        <CreditCard className="w-3 h-3" /> Pay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaxSearchModal;

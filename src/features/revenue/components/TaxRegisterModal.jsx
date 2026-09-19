import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Download, CheckCircle, AlertTriangle, FileText, CreditCard, RefreshCw } from 'lucide-react';
import { Button, Badge, Input } from '../../../components/ui';
import { propertyTaxApi } from '../api/propertyTaxApi';
import { formatCurrency, formatIndianNumber } from '../utils/revenueFormatters';

export function TaxRegisterModal({ isOpen, onClose, onLocatePlot, onPayPlot }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'paid' | 'unpaid'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen, filter, page, search]);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await propertyTaxApi.fetchTaxList({
        status: filter,
        page,
        page_size: 20,
        search
      });
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load tax register');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const results = data?.data || [];
  const pagination = data?.pagination || { count: 0, next: null, previous: null };
  const totalPages = Math.max(1, Math.ceil((pagination.count || results.length) / 20));

  const summary = data?.summary;
  const totalCount = summary?.total_properties || pagination.count || results.length;
  const paidCount = summary?.paid_count !== undefined ? summary.paid_count : results.filter(r => r.isPaid || r.taxStatus === 'paid').length;
  const unpaidCount = summary?.unpaid_count !== undefined ? summary.unpaid_count : Math.max(0, totalCount - paidCount);
  const totalCollected = summary?.total_tax_collected !== undefined ? summary.total_tax_collected : results.filter(r => r.isPaid).reduce((s, r) => s + (r.paid || r.totalPaid || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative bg-ink-900 border border-ink-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-700 bg-ink-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600/30 border border-emerald-400/40 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Property Tax Assessment Register & Ledger
              </h2>
              <p className="text-xs text-ink-300">
                Authoritative Municipal Revenue Cadastral Ledger 
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close tax register modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-ink-900 border-b border-ink-700 shrink-0">
          <div className="p-3 bg-ink-800/80 border border-ink-700 rounded-lg">
            <span className="text-[11px] text-ink-400 uppercase tracking-wider block mb-0.5">Total Properties</span>
            <span className="text-lg font-bold text-white">{formatIndianNumber(totalCount)}</span>
          </div>
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg">
            <span className="text-[11px] text-emerald-400 uppercase tracking-wider block mb-0.5">Paid Properties</span>
            <span className="text-lg font-bold text-emerald-400">{paidCount}</span>
          </div>
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg">
            <span className="text-[11px] text-red-400 uppercase tracking-wider block mb-0.5">Due / Unpaid</span>
            <span className="text-lg font-bold text-red-400">{unpaidCount}</span>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg">
            <span className="text-[11px] text-amber-400 uppercase tracking-wider block mb-0.5">Revenue Collected</span>
            <span className="text-lg font-bold text-amber-400">{formatCurrency(totalCollected)}</span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 bg-ink-950 border-b border-ink-800 flex flex-wrap gap-3 items-center justify-between shrink-0">
          <div className="flex gap-1.5 bg-ink-900 p-1 border border-ink-700 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white font-semibold' : 'text-ink-300 hover:text-white'}`}
            >
              All Properties
            </button>
            <button
              type="button"
              onClick={() => { setFilter('paid'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filter === 'paid' ? 'bg-emerald-600 text-white font-semibold' : 'text-ink-300 hover:text-white'}`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => { setFilter('unpaid'); setPage(1); }}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filter === 'unpaid' ? 'bg-red-600 text-white font-semibold' : 'text-ink-300 hover:text-white'}`}
            >
              Due / Unpaid
            </button>
          </div>

          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by owner, plot #, mobile..."
              className="w-full pl-9 pr-4 py-1.5 bg-ink-900 border border-ink-700 rounded-lg text-xs text-white placeholder:text-ink-400 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Ledger Table Container */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-ink-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading property tax assessment ledger...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg text-xs text-red-300 text-center">
              <p>{error}</p>
              <Button size="xs" variant="outline" onClick={fetchRecords} className="mt-2">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </Button>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-400">
              No matching records found in tax register.
            </div>
          ) : (
            <table className="w-full text-xs text-left text-ink-200 border-collapse">
              <thead className="bg-ink-950 text-ink-400 uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-ink-800">
                <tr>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Plot No</th>
                  <th className="p-2.5">Owner Name</th>
                  <th className="p-2.5">Mobile</th>
                  <th className="p-2.5">Assessed / Paid Tax</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {results.map((item) => {
                  const isPaid = Boolean(item.isPaid || item.taxStatus === 'paid');
                  return (
                    <tr key={item.id || item.plotId} className="hover:bg-ink-800/50 transition-colors">
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {isPaid ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {isPaid ? 'PAID' : 'DUE'}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-white font-mono">
                        #{item.plotId || item.plotNo || item.id}
                      </td>
                      <td className="p-2.5 font-semibold text-white">
                        {item.ownerName || 'Unknown Owner'}
                      </td>
                      <td className="p-2.5 text-ink-400 font-mono">
                        {item.mobile || '—'}
                      </td>
                      <td className="p-2.5 font-bold">
                        {isPaid ? (
                          <span className="text-emerald-400">{formatCurrency(item.paid || item.totalPaid || item.demand)}</span>
                        ) : (
                          <span className="text-red-400">{formatCurrency(item.outstanding || item.demand)}</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onLocatePlot?.(item);
                          }}
                          className="px-2.5 py-1 bg-ink-800 hover:bg-ink-700 text-blue-300 border border-ink-600 rounded text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          View Map
                        </button>
                        {isPaid ? (
                          <a
                            href={`/tax-slip/?id=data_resi_${item.id}&plot_no=${item.plotId || item.id}&name=${encodeURIComponent(item.ownerName || '')}&tax=${item.paid || item.demand}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Receipt
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onPayPlot?.(item);
                            }}
                            className="px-2.5 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay Tax
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="p-3 bg-ink-950 border-t border-ink-800 flex items-center justify-between text-xs text-ink-400 shrink-0">
          <span>Page {page} of {totalPages} ({pagination.count || results.length} Total Records)</span>
          <div className="flex gap-2">
            <Button
              size="xs"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="xs"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaxRegisterModal;

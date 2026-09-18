import React from 'react';
import { MapPin, TrendingUp, X } from 'lucide-react';
import { Button } from '../../../components/ui';
import { formatCurrency } from '../utils/revenueFormatters';

export function AreaIntelligencePanel({ areaStats, onClose, onFilterArea }) {
  if (!areaStats) return null;

  const collectionRate = areaStats.demand > 0 ? (areaStats.collected / areaStats.demand) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto bg-white border-l border-ink-200 p-4 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-ink-200">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-ink-900 text-base">
            {areaStats.blockName || 'Area Intelligence'}
          </h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-ink-400 hover:text-ink-600 hover:bg-ink-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-ink-500 mt-2 mb-3">
        Administrative Area Performance Summary
      </p>

      {/* Collection Efficiency Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1 font-medium">
          <span className="text-ink-700">Collection Efficiency</span>
          <span className={collectionRate > 70 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
            {collectionRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${collectionRate > 70 ? 'bg-emerald-500' : collectionRate > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, collectionRate)}%` }}
          />
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-2.5 bg-ink-50 rounded-lg">
          <p className="text-[11px] text-ink-500">Total Properties</p>
          <p className="text-base font-bold text-ink-900">{areaStats.totalProperties || 0}</p>
        </div>

        <div className="p-2.5 bg-ink-50 rounded-lg">
          <p className="text-[11px] text-ink-500">Assessed %</p>
          <p className="text-base font-bold text-blue-600">
            {areaStats.totalProperties ? Math.round((areaStats.assessedProperties / areaStats.totalProperties) * 100) : 0}%
          </p>
        </div>

        <div className="p-2.5 bg-ink-50 rounded-lg">
          <p className="text-[11px] text-ink-500">Annual Demand</p>
          <p className="text-sm font-bold text-ink-900">
            {formatCurrency(areaStats.demand || 0)}
          </p>
        </div>

        <div className="p-2.5 bg-ink-50 rounded-lg">
          <p className="text-[11px] text-ink-500">Total Collected</p>
          <p className="text-sm font-bold text-emerald-600">
            {formatCurrency(areaStats.collected || 0)}
          </p>
        </div>

        <div className="p-2.5 bg-ink-50 rounded-lg">
          <p className="text-[11px] text-ink-500">Outstanding Dues</p>
          <p className="text-sm font-bold text-red-600">
            {formatCurrency(areaStats.outstanding || 0)}
          </p>
        </div>

        <div className="p-2.5 bg-ink-50 rounded-lg">
          <p className="text-[11px] text-ink-500">Total Arrears</p>
          <p className="text-sm font-bold text-amber-600">
            {formatCurrency(areaStats.arrears || 0)}
          </p>
        </div>
      </div>

      {/* Wards Breakdown */}
      {areaStats.wards && areaStats.wards.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-bold text-ink-800 mb-2">
            Wards Breakdown ({areaStats.wards.length})
          </h4>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {areaStats.wards.map(w => (
              <div key={w.wardId} className="p-2 border border-ink-200 rounded-lg flex justify-between items-center bg-white">
                <div>
                  <p className="text-xs font-bold text-ink-900">Ward {w.wardNumber}</p>
                  <p className="text-[11px] text-ink-500">{w.totalProperties} properties</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  w.collectionRate > 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {w.collectionRate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onFilterArea && (
        <Button
          variant="primary"
          size="sm"
          className="mt-4 w-full gap-1.5"
          onClick={() => onFilterArea(areaStats.blockId)}
        >
          <TrendingUp className="w-4 h-4" />
          Filter Map To This Area
        </Button>
      )}
    </div>
  );
}

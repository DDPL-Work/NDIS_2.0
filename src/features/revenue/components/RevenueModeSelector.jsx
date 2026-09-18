import React from 'react';
import {
  Home,
  CheckCircle,
  AlertTriangle,
  FileText,
  Shield,
  Gavel,
  Search,
  TrendingUp
} from 'lucide-react';
import { REVENUE_ANALYTICAL_MODES } from '../utils/revenueGisUtils';

const MODES = [
  { id: REVENUE_ANALYTICAL_MODES.PROPERTY, label: 'Property Classification', icon: Home, color: 'border-blue-500 bg-blue-50 text-blue-700' },
  { id: REVENUE_ANALYTICAL_MODES.COLLECTION, label: 'Collection Efficiency', icon: CheckCircle, color: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { id: REVENUE_ANALYTICAL_MODES.ARREARS, label: 'Arrears Aging', icon: AlertTriangle, color: 'border-red-500 bg-red-50 text-red-700' },
  { id: REVENUE_ANALYTICAL_MODES.ASSESSMENT, label: 'Assessment Status', icon: FileText, color: 'border-purple-500 bg-purple-50 text-purple-700' },
  { id: REVENUE_ANALYTICAL_MODES.RISK, label: 'Risk Heatmap', icon: Shield, color: 'border-amber-500 bg-amber-50 text-amber-700' },
  { id: REVENUE_ANALYTICAL_MODES.RECOVERY, label: 'Recovery Targets', icon: Gavel, color: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
  { id: REVENUE_ANALYTICAL_MODES.INSPECTION, label: 'Inspection Audit', icon: Search, color: 'border-pink-500 bg-pink-50 text-pink-700' },
  { id: REVENUE_ANALYTICAL_MODES.REVENUE_POTENTIAL, label: 'Revenue Opportunities', icon: TrendingUp, color: 'border-teal-500 bg-teal-50 text-teal-700' },
];

export function RevenueModeSelector({ activeMode, onModeChange }) {
  return (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white border-b border-ink-200 scrollbar-thin">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-colors ${
              isActive
                ? mode.color
                : 'border-ink-200 text-ink-600 hover:bg-ink-50 bg-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X, ShieldAlert } from 'lucide-react';
import { OverallStats, HealthStatus } from '../types';
import { formatCurrency } from '../utils/budgetUtils';

interface HealthAlertsProps {
  stats: OverallStats;
  selectedStatusFilter: HealthStatus | null;
  onSelectStatusFilter: (status: HealthStatus | null) => void;
}

export const HealthAlerts: React.FC<HealthAlertsProps> = ({
  stats,
  selectedStatusFilter,
  onSelectStatusFilter,
}) => {
  return (
    <div className="mb-6">
      
      {/* Title & Filter Indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">
            מרכז התרעות ובריאות תקציב (רמזור מנהלים)
          </h2>
        </div>

        {selectedStatusFilter && (
          <button
            onClick={() => onSelectStatusFilter(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          >
            <span>סינון פעיל: {selectedStatusFilter === 'over' ? 'חריגות בלבד' : selectedStatusFilter === 'warning' ? 'אזהרות בלבד' : 'תקינים בלבד'}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3 Traffic Light Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Red Card: Over Budget (>100%) */}
        <div
          onClick={() =>
            onSelectStatusFilter(selectedStatusFilter === 'over' ? null : 'over')
          }
          className={`relative overflow-hidden rounded-2xl border p-4.5 cursor-pointer transition-all duration-200 ${
            selectedStatusFilter === 'over'
              ? 'ring-2 ring-rose-500 bg-rose-50/90 border-rose-300 shadow-md'
              : 'bg-white hover:bg-rose-50/40 border-rose-200/80 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs uppercase tracking-wider mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>חריגה מתקציב (מעל 100%)</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-rose-800">
                  {stats.over_budget_items_count}
                </span>
                <span className="text-xs font-medium text-rose-600">סעיפים בחריגה</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-100/80 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">סך חריגה מצטבר:</span>
            <span className="text-rose-900 font-bold text-sm">
              {stats.over_budget_total_amount > 0
                ? `+${formatCurrency(stats.over_budget_total_amount)}`
                : '₪ 0'}
            </span>
          </div>

          {selectedStatusFilter === 'over' && (
            <div className="mt-2 text-[11px] font-semibold text-rose-700 bg-rose-100/60 py-0.5 px-2 rounded-md text-center">
              ✓ מוצגים כעת סעיפים בחריגה בלבד (לחץ לביטול)
            </div>
          )}
        </div>

        {/* 2. Amber Card: Warning (80% - 99%) */}
        <div
          onClick={() =>
            onSelectStatusFilter(selectedStatusFilter === 'warning' ? null : 'warning')
          }
          className={`relative overflow-hidden rounded-2xl border p-4.5 cursor-pointer transition-all duration-200 ${
            selectedStatusFilter === 'warning'
              ? 'ring-2 ring-amber-500 bg-amber-50/90 border-amber-300 shadow-md'
              : 'bg-white hover:bg-amber-50/40 border-amber-200/80 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>אזהרה וניצול גבוה (80% עד 99%)</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-800">
                  {stats.warning_items_count}
                </span>
                <span className="text-xs font-medium text-amber-600">סעיפים בסיכון</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-medium">יתרה שנותרה בהם:</span>
            <span className="text-amber-900 font-bold text-sm">
              {formatCurrency(stats.warning_remaining_amount)}
            </span>
          </div>

          {selectedStatusFilter === 'warning' && (
            <div className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-100/60 py-0.5 px-2 rounded-md text-center">
              ✓ מוצגים כעת סעיפים באזהרה בלבד (לחץ לביטול)
            </div>
          )}
        </div>

        {/* 3. Green Card: Normal (<80%) */}
        <div
          onClick={() =>
            onSelectStatusFilter(selectedStatusFilter === 'normal' ? null : 'normal')
          }
          className={`relative overflow-hidden rounded-2xl border p-4.5 cursor-pointer transition-all duration-200 ${
            selectedStatusFilter === 'normal'
              ? 'ring-2 ring-emerald-500 bg-emerald-50/90 border-emerald-300 shadow-md'
              : 'bg-white hover:bg-emerald-50/40 border-emerald-200/80 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>תקין ובטוח (מתחת ל-80%)</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-800">
                  {stats.normal_items_count}
                </span>
                <span className="text-xs font-medium text-emerald-600">סעיפים תקינים</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">יתרה פנויה לניצול:</span>
            <span className="text-emerald-900 font-bold text-sm">
              {formatCurrency(stats.normal_available_amount)}
            </span>
          </div>

          {selectedStatusFilter === 'normal' && (
            <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 py-0.5 px-2 rounded-md text-center">
              ✓ מוצגים כעת סעיפים תקינים בלבד (לחץ לביטול)
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

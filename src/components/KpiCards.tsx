import React from 'react';
import { Wallet, TrendingUp, PieChart, CheckSquare } from 'lucide-react';
import { OverallStats } from '../types';
import { formatCurrency } from '../utils/budgetUtils';

interface KpiCardsProps {
  stats: OverallStats;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  const isRemainingPositive = stats.total_remaining >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* 1. Total Approved Budget */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">סך תקציב מותאם</span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {formatCurrency(stats.total_budget)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          מסגרת התקציב לתקופה הנבחרת
        </div>
      </div>

      {/* 2. Total Actual Spend */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">סך ביצוע בפועל</span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-indigo-900 tracking-tight">
          {formatCurrency(stats.total_spend)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          הוצאות שנרשמו בתקופה זו
        </div>
      </div>

      {/* 3. Total Remaining Balance */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">יתרה נותרת לתקופה</span>
          <div
            className={`p-2 rounded-xl ${
              isRemainingPositive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black tracking-tight ${
            isRemainingPositive ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {formatCurrency(stats.total_remaining)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">
          {isRemainingPositive ? 'תקציב פנוי להמשך הפעילות' : 'חריגה כוללת ממסגרת התקציב'}
        </div>
      </div>

      {/* 4. Total Utilization % */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold">אחוז ניצול כולל</span>
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {stats.utilization_pct.toFixed(1)}%
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              stats.utilization_pct > 100
                ? 'bg-rose-100 text-rose-700'
                : stats.utilization_pct >= 80
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {stats.utilization_pct > 100
              ? 'חריגה'
              : stats.utilization_pct >= 80
              ? 'גבוה'
              : 'תקין'}
          </span>
        </div>
        
        {/* Progress mini bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.utilization_pct > 100
                ? 'bg-rose-500'
                : stats.utilization_pct >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(stats.utilization_pct, 100)}%` }}
          />
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { BudgetItemCalculated, GroupSummary, OverallStats } from '../types';
import { formatCurrency } from '../utils/budgetUtils';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: OverallStats;
  groups: GroupSummary[];
  items: BudgetItemCalculated[];
  periodLabel: string;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  stats,
  groups,
  items,
  periodLabel,
}) => {
  const [executiveNotes, setExecutiveNotes] = useState<string>(
    'תמונת המצב הכללית של התקציב משקפת עמידה במסגרות המאושרות, עם מספר סעיפים בודדים הדורשים תשומת לב מיוחדת (כמפורט בטבלת החריגות להלן).'
  );

  if (!isOpen) return null;

  const topOverItems = items
    .filter((i) => i.status === 'over')
    .sort((a, b) => b.actual_spend - b.adjusted_budget - (a.actual_spend - a.adjusted_budget))
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Assistant',sans-serif]">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                דוח מנהלים מעוצב (Executive One-Pager)
              </h3>
              <p className="text-xs text-slate-500">
                תקציר מנהלים מרוכז להדפסה, שמירה כ-PDF והצגה בישיבות הנהלה
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>הדפסה / שמירה כ-PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Executive One-Pager Document */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 print:p-0 print:m-0 print:overflow-visible">
          
          {/* Header of the Official Document */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="IDE Technologies"
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  דוח בקרת תקציב ומשאבים ארגוניים — תקציר מנהלים
                </h1>
                <p className="text-xs text-slate-500">
                  IDE Technologies • תקופת דוח: <strong className="text-slate-800">{periodLabel}</strong> • הופק בתאריך:{' '}
                  {new Date().toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>

            <div className="text-left font-mono text-xs">
              <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md">
                סודי - לשימוש פנימי
              </span>
            </div>
          </div>

          {/* 4 Primary Executive KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                סך תקציב מוקצה לתקופה
              </span>
              <strong className="text-lg font-black text-slate-900 font-mono">
                {formatCurrency(stats.total_budget)}
              </strong>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200">
              <span className="text-[11px] font-bold text-blue-700 block mb-1">
                סך ביצוע בפועל
              </span>
              <strong className="text-lg font-black text-blue-900 font-mono">
                {formatCurrency(stats.total_spend)}
              </strong>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                יתרה תקציבית פנויה
              </span>
              <strong className="text-lg font-black text-emerald-900 font-mono">
                {formatCurrency(stats.total_remaining)}
              </strong>
            </div>

            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200">
              <span className="text-[11px] font-bold text-indigo-700 block mb-1">
                שיעור ניצול כולל
              </span>
              <strong className="text-lg font-black text-indigo-900 font-mono">
                {stats.utilization_pct.toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Executive Summary Commentary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">
              הערות והמלצות מנהל התקציב להנהלה:
            </span>
            <textarea
              rows={2}
              value={executiveNotes}
              onChange={(e) => setExecutiveNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 resize-none font-medium leading-relaxed"
            />
          </div>

          {/* Group Breakdown Table */}
          <div>
            <h4 className="text-xs font-black text-slate-900 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span>ריכוז ביצוע ויתרות לפי 7 הקבוצות הראשיות</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-3">קבוצת משאבים</th>
                    <th className="py-2 px-3 text-left">תקציב (₪)</th>
                    <th className="py-2 px-3 text-left">ביצוע בפועל (₪)</th>
                    <th className="py-2 px-3 text-left">יתרה (₪)</th>
                    <th className="py-2 px-3 text-center">אחוז ניצול</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groups.map((g) => (
                    <tr key={g.group} className="hover:bg-slate-50">
                      <td className="py-1.5 px-3 font-bold text-slate-900">
                        {g.group}
                      </td>
                      <td className="py-1.5 px-3 text-left font-mono text-slate-700">
                        {formatCurrency(g.total_budget)}
                      </td>
                      <td className="py-1.5 px-3 text-left font-mono font-bold text-slate-900">
                        {formatCurrency(g.total_spend)}
                      </td>
                      <td className="py-1.5 px-3 text-left font-mono font-bold text-emerald-700">
                        {formatCurrency(g.remaining_balance)}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            g.utilization_pct > 100
                              ? 'bg-rose-100 text-rose-800'
                              : g.utilization_pct >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {g.utilization_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Over-Budget Risk Items */}
          {topOverItems.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-rose-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>מוקדי סיכון עיקריים — סעיפים בחריגה תקציבית (מעל 100%)</span>
              </h4>
              <div className="border border-rose-200 bg-rose-50/20 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-rose-50 text-rose-900 font-bold border-b border-rose-200">
                      <th className="py-2 px-3">קוד FI</th>
                      <th className="py-2 px-3">שם הסעיף</th>
                      <th className="py-2 px-3">קבוצה</th>
                      <th className="py-2 px-3 text-left">תקציב (₪)</th>
                      <th className="py-2 px-3 text-left">ביצוע (₪)</th>
                      <th className="py-2 px-3 text-left">סכום חריגה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {topOverItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-800">
                          {item.fi_code}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">
                          {item.group}
                        </td>
                        <td className="py-1.5 px-3 text-left font-mono">
                          {formatCurrency(item.adjusted_budget)}
                        </td>
                        <td className="py-1.5 px-3 text-left font-mono font-black text-rose-900">
                          {formatCurrency(item.actual_spend)}
                        </td>
                        <td className="py-1.5 px-3 text-left font-mono font-black text-rose-700">
                          +{formatCurrency(item.actual_spend - item.adjusted_budget)} ({item.utilization_pct.toFixed(0)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Document Sign-off Footer */}
          <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              חתימת מנהל כספים / בקר תקציב: __________________
            </div>
            <div>
              חתימת מנכ"ל: __________________
            </div>
            <div>
              דף 1 מתוך 1
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

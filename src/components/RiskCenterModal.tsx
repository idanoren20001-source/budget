import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Copy,
  TrendingUp,
  FileQuestion,
  Check,
  CheckCircle2,
  DollarSign,
  Search,
  Filter,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BudgetItemCalculated, Expense, AnomalyAlert } from '../types';
import { formatCurrency, detectAnomalies } from '../utils/budgetUtils';

export type RiskCategory =
  | 'all'
  | 'over_budget'
  | 'high_burn'
  | 'duplicate'
  | 'spike'
  | 'missing_info';

export interface UnifiedRiskAlert {
  id: string;
  category: RiskCategory;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  amount?: number;
  budgetItemId?: string;
  fiCode?: string;
  itemName?: string;
  expenseId?: string;
  vendor?: string;
  date?: string;
  matchedExpenseId?: string;
  isResolved?: boolean;
}

interface RiskCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BudgetItemCalculated[];
  expenses: Expense[];
  onQuickAdjustBudget?: (itemId: string, delta: number) => void;
  onSelectExpense?: (expense: Expense) => void;
  onSelectItem?: (item: BudgetItemCalculated) => void;
}

export const RiskCenterModal: React.FC<RiskCenterModalProps> = ({
  isOpen,
  onClose,
  items,
  expenses,
  onQuickAdjustBudget,
  onSelectExpense,
  onSelectItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  // 1. Generate Unified Risk Alerts
  const allAlerts = useMemo(() => {
    const alerts: UnifiedRiskAlert[] = [];

    // A. Scan Budget Items for Over-Budget (>100%)
    items.forEach((item) => {
      if (item.status === 'over') {
        const overAmount = item.actual_spend - item.adjusted_budget;
        alerts.push({
          id: `risk-over-${item.id}`,
          category: 'over_budget',
          severity: 'critical',
          title: `חריגת תקציב בסעיף ${item.fi_code}`,
          description: `הסעיף "${item.name}" חורג ב-${formatCurrency(overAmount)} (${item.utilization_pct.toFixed(0)}% ניצול). תקציב: ${formatCurrency(item.adjusted_budget)}, ביצוע בפועל: ${formatCurrency(item.actual_spend)}.`,
          amount: overAmount,
          budgetItemId: item.id,
          fiCode: item.fi_code,
          itemName: item.name,
        });
      } else if (item.status === 'warning') {
        alerts.push({
          id: `risk-warn-${item.id}`,
          category: 'high_burn',
          severity: 'warning',
          title: `סעיף קרוב לתקרת התקציב (${item.fi_code})`,
          description: `הסעיף "${item.name}" הגיע ל-${item.utilization_pct.toFixed(0)}% ניצול. נותרה יתרה של ${formatCurrency(item.remaining_balance)} בלבד.`,
          amount: item.remaining_balance,
          budgetItemId: item.id,
          fiCode: item.fi_code,
          itemName: item.name,
        });
      }
    });

    // B. Detect Expense Anomalies (Duplicates & Spikes)
    const expenseAlertsMap = detectAnomalies(expenses);
    expenseAlertsMap.forEach((expAlerts, expId) => {
      const exp = expenses.find((e) => e.id === expId);
      expAlerts.forEach((a) => {
        alerts.push({
          id: `risk-exp-${a.id}`,
          category: a.type === 'duplicate' ? 'duplicate' : 'spike',
          severity: a.severity === 'high' ? 'critical' : 'warning',
          title: a.title,
          description: a.description,
          amount: exp?.amount,
          expenseId: exp?.id,
          vendor: exp?.vendor,
          date: exp?.date,
          fiCode: exp?.fi_code,
          matchedExpenseId: a.matchedExpenseId,
        });
      });
    });

    // C. Scan for Incomplete Invoices (Missing PO, PD, or Vendor Number)
    expenses.forEach((exp) => {
      const isMissingPo = !exp.po_number && !exp.pd_number;
      const isMissingVendorNum = !exp.vendor_number;

      if (isMissingPo || isMissingVendorNum) {
        alerts.push({
          id: `risk-missing-${exp.id}`,
          category: 'missing_info',
          severity: 'info',
          title: `פרטי חשבונית חסרים לספק "${exp.vendor}"`,
          description: `חשבונית בסך ${formatCurrency(exp.amount)} מתאריך ${exp.date || 'לא צוין'} חסרה ${isMissingPo ? 'מספר PO/PD' : ''} ${isMissingPo && isMissingVendorNum ? 'וכן ' : ''}${isMissingVendorNum ? 'מספר ספק' : ''}.`,
          amount: exp.amount,
          expenseId: exp.id,
          vendor: exp.vendor,
          date: exp.date,
          fiCode: exp.fi_code,
        });
      }
    });

    return alerts;
  }, [items, expenses]);

  if (!isOpen) return null;

  // Toggle acknowledge/resolve
  const handleToggleResolve = (id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered Alerts
  const filteredAlerts = allAlerts.filter((alert) => {
    const isResolved = resolvedIds.has(alert.id);
    if (selectedCategory !== 'all' && alert.category !== selectedCategory) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(q);
      const matchDesc = alert.description.toLowerCase().includes(q);
      const matchVendor = alert.vendor?.toLowerCase().includes(q);
      const matchFi = alert.fiCode?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchVendor || matchFi;
    }

    return true;
  });

  // KPI Calculations
  const criticalCount = allAlerts.filter((a) => a.severity === 'critical' && !resolvedIds.has(a.id)).length;
  const warningCount = allAlerts.filter((a) => a.severity === 'warning' && !resolvedIds.has(a.id)).length;
  const totalOverBudgetSum = items
    .filter((i) => i.status === 'over')
    .reduce((sum, i) => sum + (i.actual_spend - i.adjusted_budget), 0);

  // Health Score (0 - 100)
  const healthScore = Math.max(
    20,
    Math.round(100 - criticalCount * 12 - warningCount * 4)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-400/30 rounded-xl text-rose-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  מרכז בקרת סיכונים והתראות תקציב
                </h2>
                <span className="bg-rose-500/30 text-rose-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-400/30">
                  בזמן אמת
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                זיהוי חריגות תקציביות, קצב שריפה מואץ, כפילויות תשלום וקפיצות חריגות בהוצאות
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Banner: Health Score, Over-budget sum, critical count */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block">ציון חוסן תקציבי</span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span
                className={`text-xl font-black ${
                  healthScore >= 80
                    ? 'text-emerald-700'
                    : healthScore >= 60
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
              >
                {healthScore}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {healthScore >= 80 ? 'תקין' : healthScore >= 60 ? 'בינוני' : 'דורש תשומת לב'}
              </span>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-rose-800 block">התראות קריטיות</span>
            <div className="text-xl font-black text-rose-900 mt-0.5">
              {criticalCount}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-amber-800 block">התראות אזהרה</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">
              {warningCount}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 block">סך חריגות כספי</span>
            <div className="text-base font-extrabold text-rose-800 font-mono mt-0.5">
              {totalOverBudgetSum > 0 ? `+${formatCurrency(totalOverBudgetSum)}` : '₪0'}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              הכל ({allAlerts.length})
            </button>
            <button
              onClick={() => setSelectedCategory('over_budget')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'over_budget'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              חריגות תקציב ({allAlerts.filter((a) => a.category === 'over_budget').length})
            </button>
            <button
              onClick={() => setSelectedCategory('high_burn')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'high_burn'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              קצב שריפה ({allAlerts.filter((a) => a.category === 'high_burn').length})
            </button>
            <button
              onClick={() => setSelectedCategory('duplicate')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'duplicate'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              כפילויות ({allAlerts.filter((a) => a.category === 'duplicate').length})
            </button>
            <button
              onClick={() => setSelectedCategory('spike')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'spike'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              קפיצות סכום ({allAlerts.filter((a) => a.category === 'spike').length})
            </button>
            <button
              onClick={() => setSelectedCategory('missing_info')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'missing_info'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              פרטים חסרים ({allAlerts.filter((a) => a.category === 'missing_info').length})
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש לפי ספק, סעיף, FI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Alerts List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                אין התראות פעילות בקטגוריה זו
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                כל סעיפי התקציב והחשבוניות בקטגוריה שנבחרה עומדים ביעדים וללא חריגות או אנומליות.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isResolved = resolvedIds.has(alert.id);
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`border rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isResolved
                      ? 'bg-slate-50/60 border-slate-200 opacity-60'
                      : isCritical
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : isWarning
                      ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                      : 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700'
                          : isWarning
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {alert.category === 'over_budget' && <AlertCircle className="w-5 h-5" />}
                      {alert.category === 'high_burn' && <TrendingUp className="w-5 h-5" />}
                      {alert.category === 'duplicate' && <Copy className="w-5 h-5" />}
                      {alert.category === 'spike' && <Zap className="w-5 h-5" />}
                      {alert.category === 'missing_info' && <FileQuestion className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isCritical ? 'קריטי' : isWarning ? 'אזהרה' : 'לתשומת לב'}
                        </span>
                        {alert.fiCode && (
                          <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {alert.fiCode}
                          </span>
                        )}
                        {alert.amount !== undefined && (
                          <span className="text-xs font-bold font-mono text-slate-800">
                            {formatCurrency(alert.amount)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Quick Budget Boost for over-budget items */}
                    {alert.budgetItemId && onQuickAdjustBudget && (
                      <button
                        onClick={() => {
                          onQuickAdjustBudget(alert.budgetItemId!, 10000);
                          handleToggleResolve(alert.id);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                        title="הגדל תקציב סעיף ב-10,000 ₪"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+10,000 ₪</span>
                      </button>
                    )}

                    {/* Drill-down button */}
                    {alert.budgetItemId && onSelectItem && (
                      <button
                        onClick={() => {
                          const itm = items.find((i) => i.id === alert.budgetItemId);
                          if (itm) {
                            onClose();
                            onSelectItem(itm);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        <span>צפה בסעיף</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Toggle Acknowledged */}
                    <button
                      onClick={() => handleToggleResolve(alert.id)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        isResolved
                          ? 'bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                      title={isResolved ? 'בטל סימון כטופל' : 'סמן התראה כנבדקה'}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'טופל' : 'סמן כטופל'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            סה״כ התראות: <strong>{allAlerts.length}</strong> | טופלו:{' '}
            <strong>{resolvedIds.size}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  );
};

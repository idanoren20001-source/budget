import React, { useState } from 'react';
import {
  Search,
  Check,
  Edit2,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { BudgetItemCalculated, HealthStatus } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { INITIAL_GROUPS } from '../data/initialData';

interface BudgetTableProps {
  items: BudgetItemCalculated[];
  statusFilter: HealthStatus | null;
  onUpdateMonthlyBudget: (itemId: string, newMonthlyBudget: number) => void;
  onUpdateActualSpendOverride: (itemId: string, newActual: number | null) => void;
  onQuickAddExpense: (item: BudgetItemCalculated) => void;
  onSelectItem: (item: BudgetItemCalculated) => void;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  items,
  statusFilter,
  onUpdateMonthlyBudget,
  onUpdateActualSpendOverride,
  onQuickAddExpense,
  onSelectItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Track inline editing: { itemId, field: 'budget' | 'actual', value: string }
  const [editingCell, setEditingCell] = useState<{
    itemId: string;
    field: 'budget' | 'actual';
    value: string;
  } | null>(null);

  const handleStartEdit = (
    e: React.MouseEvent,
    item: BudgetItemCalculated,
    field: 'budget' | 'actual'
  ) => {
    e.stopPropagation();
    setEditingCell({
      itemId: item.id,
      field,
      value:
        field === 'budget'
          ? item.monthly_budget.toString()
          : item.actual_spend.toString(),
    });
  };

  const handleSaveEdit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!editingCell) return;

    const parsed = parseFloat(editingCell.value);
    if (!isNaN(parsed) && parsed >= 0) {
      if (editingCell.field === 'budget') {
        onUpdateMonthlyBudget(editingCell.itemId, parsed);
      } else {
        onUpdateActualSpendOverride(editingCell.itemId, parsed);
      }
    }
    setEditingCell(null);
  };

  const handleRevertActual = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    onUpdateActualSpendOverride(itemId, null); // Revert to sum of expenses
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Filter items based on search, group, and statusFilter
  const filteredItems = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) {
      return false;
    }
    if (selectedGroup !== 'all' && item.group !== selectedGroup) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCode = item.fi_code.toLowerCase().includes(q);
      const matchGroup = item.group.toLowerCase().includes(q);
      const numCode = item.fi_code.replace(/[^0-9]/g, '');
      const matchNum = numCode.includes(q.replace(/[^0-9]/g, ''));
      return matchName || matchCode || matchGroup || (q.match(/^[0-9]+$/) && matchNum);
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-8">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              פירוט סעיפי תקציב וביצוע בפועל
            </h3>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200/60">
              {filteredItems.length} סעיפים
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>
              עריכה ידנית מיידית: לחץ ישירות על <strong>תקציב</strong> או <strong>ביצוע בפועל</strong> לשינוי המספר — נשמר אוטומטית מאחורי הקלעים!
            </span>
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש קוד FI, סעיף או קבוצה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Group dropdown filter */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">כל 7 הקבוצות</option>
              {INITIAL_GROUPS.map((g) => (
                <option key={g.code} value={g.name}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-3 px-3.5">קוד FI</th>
              <th className="py-3 px-3.5">שם הסעיף</th>
              <th className="py-3 px-3.5">קבוצה ראשית</th>
              <th className="py-3 px-3.5 text-left">תקציב חודשי בסיס (₪)</th>
              <th className="py-3 px-3.5 text-left">תקציב מותאם</th>
              <th className="py-3 px-3.5 text-left">ביצוע בפועל (₪)</th>
              <th className="py-3 px-3.5 text-left">יתרה נותרת</th>
              <th className="py-3 px-3.5 w-36 text-center">ניצול (%)</th>
              <th className="py-3 px-3.5 text-center">סטטוס</th>
              <th className="py-3 px-3.5 text-center no-print">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400">
                  לא נמצאו סעיפי תקציב התואמים את החיפוש או הסינון.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isOver = item.status === 'over';
                const isWarning = item.status === 'warning';

                const isEditingBudget =
                  editingCell?.itemId === item.id && editingCell?.field === 'budget';
                const isEditingActual =
                  editingCell?.itemId === item.id && editingCell?.field === 'actual';

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                      isOver ? 'bg-rose-50/20' : isWarning ? 'bg-amber-50/15' : ''
                    }`}
                  >
                    {/* FI Code */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 border border-slate-200/90 text-slate-800 px-2 py-0.5 rounded-md">
                        {item.fi_code}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-2.5 px-3.5 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <Eye className="w-3.5 h-3.5 text-slate-300 hover:text-blue-600 transition-colors" />
                      </div>
                    </td>

                    {/* Group */}
                    <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                      {item.group}
                    </td>

                    {/* 1. Base Monthly Budget (Inline Editable) */}
                    <td
                      className="py-2.5 px-3.5 text-left whitespace-nowrap font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditingBudget ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            value={editingCell.value}
                            onChange={(e) =>
                              setEditingCell({ ...editingCell, value: e.target.value })
                            }
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-24 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-xs text-left font-bold focus:outline-hidden ring-2 ring-blue-400/20"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="שמור"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={(e) => handleStartEdit(e, item, 'budget')}
                          className="group inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50 px-1.5 py-0.5 rounded-md transition-colors"
                          title="לחץ לעריכה ידנית מיידית"
                        >
                          <span className="text-slate-800 font-bold">
                            {formatCurrency(item.monthly_budget)}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    {/* Adjusted Period Budget */}
                    <td className="py-2.5 px-3.5 text-left whitespace-nowrap font-bold text-slate-900">
                      {formatCurrency(item.adjusted_budget)}
                    </td>

                    {/* 2. Actual Spend (Inline Editable!) */}
                    <td
                      className="py-2.5 px-3.5 text-left whitespace-nowrap font-bold text-indigo-700"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditingActual ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            value={editingCell.value}
                            onChange={(e) =>
                              setEditingCell({ ...editingCell, value: e.target.value })
                            }
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-24 bg-white border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-left font-bold focus:outline-hidden ring-2 ring-indigo-400/20"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="שמור"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <div
                            onClick={(e) => handleStartEdit(e, item, 'actual')}
                            className="group inline-flex items-center gap-1 cursor-pointer hover:bg-indigo-50 px-1.5 py-0.5 rounded-md transition-colors"
                            title="לחץ לעריכה ידנית של סכום הביצוע בפועל"
                          >
                            <span>{formatCurrency(item.actual_spend)}</span>
                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Override indicator & reset button */}
                          {item.is_actual_overridden && (
                            <button
                              onClick={(e) => handleRevertActual(e, item.id)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1 py-0.5 rounded cursor-pointer transition-colors"
                              title="עודכן ידנית. לחץ לחזרה לחישוב אוטומטי מהוצאות"
                            >
                              <RotateCcw className="w-2.5 h-2.5 inline ml-0.5" />
                              ידני
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Remaining Balance */}
                    <td
                      className={`py-2.5 px-3.5 text-left whitespace-nowrap font-bold ${
                        item.remaining_balance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(item.remaining_balance)}
                    </td>

                    {/* Utilization % & Bar */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-500'
                                : isWarning
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(item.utilization_pct, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-bold text-[11px] w-12 text-left ${
                            isOver
                              ? 'text-rose-600'
                              : isWarning
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.utilization_pct.toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      {isOver ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          חריגה
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          אזהרה
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          תקין
                        </span>
                      )}
                    </td>

                    {/* Quick Add Expense Action */}
                    <td
                      className="py-2.5 px-3.5 text-center whitespace-nowrap no-print"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onQuickAddExpense(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 px-2 py-1 rounded-lg transition-all cursor-pointer"
                        title="רישום הוצאה מהיר לסעיף זה"
                      >
                        <Plus className="w-3 h-3" />
                        <span>רישום הוצאה</span>
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

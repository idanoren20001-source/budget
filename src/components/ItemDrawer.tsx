import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  History,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { BudgetItemCalculated, Expense, AuditLog } from '../types';
import { formatCurrency } from '../utils/budgetUtils';

interface ItemDrawerProps {
  item: BudgetItemCalculated | null;
  onClose: () => void;
  expenses: Expense[];
  auditLogs: AuditLog[];
  onUpdateMonthlyBudget: (itemId: string, newBudget: number) => void;
  onUpdateActualSpendOverride?: (itemId: string, newActual: number | null) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateExpense: (expense: Expense) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  periodLabel: string;
}

export const ItemDrawer: React.FC<ItemDrawerProps> = ({
  item,
  onClose,
  expenses,
  auditLogs,
  onUpdateMonthlyBudget,
  onUpdateActualSpendOverride,
  onDeleteExpense,
  onUpdateExpense,
  onAddExpense,
  periodLabel,
}) => {
  if (!item) return null;

  const [editBudgetVal, setEditBudgetVal] = useState<string>(
    item.monthly_budget.toString()
  );
  const [showAddExpense, setShowAddExpense] = useState(false);

  // New expense form inside drawer
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newAmount, setNewAmount] = useState('');
  const [newVendor, setNewVendor] = useState('');
  const [newRef, setNewRef] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Expenses for this item
  const itemExpenses = expenses.filter((e) => e.budget_item_id === item.id);
  const totalItemSpend = itemExpenses.reduce((s, e) => s + e.amount, 0);

  // Audit logs for this item
  const itemAuditLogs = auditLogs.filter(
    (a) => a.fi_code === item.fi_code || a.entity_name.includes(item.name)
  );

  const handleApplyBudget = () => {
    const val = parseFloat(editBudgetVal);
    if (!isNaN(val) && val >= 0) {
      onUpdateMonthlyBudget(item.id, val);
    }
  };

  const handleQuickDelta = (delta: number) => {
    const newVal = Math.max(0, item.monthly_budget + delta);
    setEditBudgetVal(newVal.toString());
    onUpdateMonthlyBudget(item.id, newVal);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newAmount);
    if (isNaN(val) || val <= 0 || !newVendor.trim() || !newRef.trim()) {
      alert('נא למלא את כל השדות בצורה תקינה');
      return;
    }
    onAddExpense({
      budget_item_id: item.id,
      fi_code: item.fi_code,
      date: newDate,
      amount: val,
      vendor: newVendor.trim(),
      ref_number: newRef.trim(),
      notes: newNotes.trim(),
    });
    setNewAmount('');
    setNewVendor('');
    setNewRef('');
    setNewNotes('');
    setShowAddExpense(false);
  };

  const isOver = item.status === 'over';
  const isWarning = item.status === 'warning';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      {/* Click outside backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer content */}
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200 border-r border-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-sm bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md border border-blue-200">
                {item.fi_code}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {item.group}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">{item.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. Manual Budget Adjuster Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                עריכה ידנית של תקציב הבסיס החודשי:
              </span>
              <span className="text-xs text-slate-400">מעדכן מיידית את כל החישובים</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">₪</span>
                <input
                  type="number"
                  value={editBudgetVal}
                  onChange={(e) => setEditBudgetVal(e.target.value)}
                  onBlur={handleApplyBudget}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyBudget()}
                  className="w-full bg-white border border-slate-300 rounded-xl pr-8 pl-3 py-2 text-sm font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleApplyBudget}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                עדכן
              </button>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/80">
              <span className="text-[11px] text-slate-500 ml-1">התאמה מהירה:</span>
              <button
                onClick={() => handleQuickDelta(1000)}
                className="text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                +1,000 ₪
              </button>
              <button
                onClick={() => handleQuickDelta(5000)}
                className="text-[11px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                +5,000 ₪
              </button>
              <button
                onClick={() => handleQuickDelta(-1000)}
                className="text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                -1,000 ₪
              </button>
            </div>
          </div>

          {/* 2. Health & Period Performance Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">תקציב מותאם ({periodLabel})</span>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {formatCurrency(item.adjusted_budget)}
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">סך ביצוע בפועל</span>
                <div className="text-lg font-black text-indigo-700 mt-0.5">
                  {formatCurrency(item.actual_spend)}
                </div>
              </div>
              {item.is_actual_overridden ? (
                <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                    נקבע ידנית
                  </span>
                  {onUpdateActualSpendOverride && (
                    <button
                      onClick={() => onUpdateActualSpendOverride(item.id, null)}
                      className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                    >
                      אפס לסך הוצאות
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 mt-1">
                  מחושב מסך {itemExpenses.length} הוצאות
                </div>
              )}
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">יתרה שנותרה</span>
              <div
                className={`text-lg font-black mt-0.5 ${
                  item.remaining_balance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatCurrency(item.remaining_balance)}
              </div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium">אחוז ניצול וסטטוס</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg font-black text-slate-900">
                  {item.utilization_pct.toFixed(0)}%
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOver
                      ? 'bg-rose-100 text-rose-700'
                      : isWarning
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isOver ? 'חריגה' : isWarning ? 'אזהרה' : 'תקין'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Item Expenses List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  הוצאות שנרשמו לסעיף זה ({itemExpenses.length})
                </span>
              </div>
              <button
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>הוסף הוצאה לסעיף</span>
              </button>
            </div>

            {/* Quick Add Form Drawer */}
            {showAddExpense && (
              <form
                onSubmit={handleCreateExpense}
                className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl mb-3 space-y-2.5 animate-in fade-in duration-100"
              >
                <div className="text-xs font-bold text-blue-900">רישום הוצאה ישירה:</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="סכום בש״ח"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    autoFocus
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="ספק / בית עסק"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    required
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="מספר חשבונית / אסמכתא"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    required
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono"
                  />
                </div>
                <input
                  type="text"
                  placeholder="הערות..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 cursor-pointer"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1 rounded-lg cursor-pointer"
                  >
                    שמור הוצאה
                  </button>
                </div>
              </form>
            )}

            {/* Expenses mini-table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {itemExpenses.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  אין הוצאות רשומות לסעיף זה בתקופה הנבחרת
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {itemExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{exp.vendor}</span>
                          {exp.po_number && (
                            <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-50 px-1 rounded">
                              PO: {exp.po_number}
                            </span>
                          )}
                          {exp.pd_number && (
                            <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-1 rounded">
                              PD: {exp.pd_number}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            #{exp.ref_number}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{exp.date}</span>
                          {exp.company && <span>• {exp.company}</span>}
                          {exp.status && <span className="text-emerald-700 font-bold">• {exp.status}</span>}
                          {exp.details && <span>• {exp.details}</span>}
                          {exp.notes && <span>• {exp.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-900 text-sm">
                          {formatCurrency(exp.amount)}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`למחוק הוצאה בסך ${formatCurrency(exp.amount)}?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                          title="מחק הוצאה"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Audit Log for this Item */}
          {itemAuditLogs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>היסטוריית שינויים לסעיף זה:</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {itemAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200/60"
                  >
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>{new Date(log.timestamp).toLocaleString('he-IL')}</span>
                      <span className="font-semibold text-slate-600">{log.user}</span>
                    </div>
                    <div className="text-slate-700 font-medium mt-0.5">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            סגור חלונית
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  PlusCircle,
  X,
  Check,
  CheckSquare,
  Square,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Expense, BudgetItem } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { INITIAL_GROUPS } from '../data/initialData';

interface ExpensesLogTableProps {
  expenses: Expense[];
  budgetItems: BudgetItem[];
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (expense: Expense) => void;
  onBulkDeleteExpenses?: (ids: string[]) => void;
  onBulkUpdateExpenses?: (ids: string[], updates: Partial<Expense>) => void;
  onOpenNewExpense: () => void;
  periodLabel: string;
}

export const ExpensesLogTable: React.FC<ExpensesLogTableProps> = ({
  expenses,
  budgetItems,
  onDeleteExpense,
  onUpdateExpense,
  onBulkDeleteExpenses,
  onBulkUpdateExpenses,
  onOpenNewExpense,
  periodLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  // Bulk Edit Form State
  const [bulkDate, setBulkDate] = useState('');
  const [bulkApplyDate, setBulkApplyDate] = useState(false);
  const [bulkVendor, setBulkVendor] = useState('');
  const [bulkApplyVendor, setBulkApplyVendor] = useState(false);
  const [bulkItemId, setBulkItemId] = useState('');
  const [bulkApplyItem, setBulkApplyItem] = useState(false);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkApplyNotes, setBulkApplyNotes] = useState(false);

  // Single Edit Expense State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingAmountValue, setEditingAmountValue] = useState<string>('');

  const handleSaveInlineAmount = (exp: Expense) => {
    const parsed = parseFloat(editingAmountValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateExpense({ ...exp, amount: parsed });
    }
    setEditingAmountId(null);
  };

  // Map budget items by ID for fast lookup
  const itemsMap = useMemo(() => {
    const map: Record<string, BudgetItem> = {};
    budgetItems.forEach((i) => {
      map[i.id] = i;
    });
    return map;
  }, [budgetItems]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const item = itemsMap[exp.budget_item_id];
      const groupName = item ? item.group : '';
      const itemName = item ? item.name : '';

      if (selectedGroup !== 'all' && groupName !== selectedGroup) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          exp.fi_code.toLowerCase().includes(q) ||
          exp.vendor.toLowerCase().includes(q) ||
          exp.ref_number.toLowerCase().includes(q) ||
          itemName.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [expenses, itemsMap, selectedGroup, searchTerm]);

  const totalFilteredAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // Selection helpers
  const isAllSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every((e) => selectedIds.includes(e.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExpenses.map((e) => e.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleTriggerBulkDelete = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const selectedSum = expenses
      .filter((e) => selectedIds.includes(e.id))
      .reduce((s, e) => s + e.amount, 0);

    if (
      confirm(
        `האם אתה בטוח שברצונך למחוק ${count} הוצאות בסך כולל של ${formatCurrency(
          selectedSum
        )}? פעולה זו תימחק מהמערכת ותתועד ביומן השינויים.`
      )
    ) {
      if (onBulkDeleteExpenses) {
        onBulkDeleteExpenses(selectedIds);
      } else {
        selectedIds.forEach((id) => onDeleteExpense(id));
      }
      setSelectedIds([]);
    }
  };

  // Bulk Edit Submission
  const handleSaveBulkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const updates: Partial<Expense> = {};
    if (bulkApplyDate && bulkDate) updates.date = bulkDate;
    if (bulkApplyVendor && bulkVendor.trim()) updates.vendor = bulkVendor.trim();
    if (bulkApplyItem && bulkItemId) {
      const selectedBi = budgetItems.find((b) => b.id === bulkItemId);
      if (selectedBi) {
        updates.budget_item_id = selectedBi.id;
        updates.fi_code = selectedBi.fi_code;
      }
    }
    if (bulkApplyNotes) updates.notes = bulkNotes;

    if (Object.keys(updates).length > 0) {
      if (onBulkUpdateExpenses) {
        onBulkUpdateExpenses(selectedIds, updates);
      } else {
        selectedIds.forEach((id) => {
          const exp = expenses.find((e) => e.id === id);
          if (exp) onUpdateExpense({ ...exp, ...updates });
        });
      }
    }

    setIsBulkEditOpen(false);
    setSelectedIds([]);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      onUpdateExpense(editingExpense);
      setEditingExpense(null);
    }
  };

  const selectedExpensesSum = useMemo(() => {
    return expenses
      .filter((e) => selectedIds.includes(e.id))
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, selectedIds]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-8">
      
      {/* Top Banner & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              יומן הוצאות ותנועות כספיות ({periodLabel})
            </h3>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200/60">
              {filteredExpenses.length} תנועות
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            סך הכל הוצאות מסוננות:{' '}
            <strong className="text-indigo-900">
              {formatCurrency(totalFilteredAmount)}
            </strong>
          </p>
        </div>

        {/* Search, Group Filter & New Expense */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          
          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש ספק, אסמכתא, קוד FI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Group filter */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">כל הקבוצות</option>
            {INITIAL_GROUPS.map((g) => (
              <option key={g.code} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>

          {/* New Expense button */}
          <button
            onClick={onOpenNewExpense}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>הוצאה חדשה</span>
          </button>

        </div>
      </div>

      {/* Floating / Sticky Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150 border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold px-2.5 py-1 rounded-lg">
              {selectedIds.length} שורות נבחרו
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              סכום נבחר:{' '}
              <strong className="text-white">
                {formatCurrency(selectedExpensesSum)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setBulkDate('');
                setBulkApplyDate(false);
                setBulkVendor('');
                setBulkApplyVendor(false);
                setBulkItemId('');
                setBulkApplyItem(false);
                setBulkNotes('');
                setBulkApplyNotes(false);
                setIsBulkEditOpen(true);
              }}
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>עריכה מרוכזת ({selectedIds.length})</span>
            </button>

            <button
              onClick={handleTriggerBulkDelete}
              className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>מחיקה מרוכזת</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              בטל בחירה
            </button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold">
              {/* Checkbox column */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="בחר / בטל בחירת הכל"
                />
              </th>
              <th className="py-3 px-3.5">קוד FI</th>
              <th className="py-3 px-3.5">שם הסעיף</th>
              <th className="py-3 px-3.5">קבוצה ראשית</th>
              <th className="py-3 px-3.5">תאריך</th>
              <th className="py-3 px-3.5">ספק / בית עסק</th>
              <th className="py-3 px-3.5">אסמכתא / חשבונית</th>
              <th className="py-3 px-3.5 text-left">סכום בש"ח</th>
              <th className="py-3 px-3.5">הערות</th>
              <th className="py-3 px-3.5 text-center no-print">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center text-slate-400">
                  לא נרשמו הוצאות בתקופה זו (או שאין תוצאות התואמות את החיפוש).
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => {
                const item = itemsMap[exp.budget_item_id];
                const isSelected = selectedIds.includes(exp.id);

                return (
                  <tr
                    key={exp.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(exp.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* FI Code */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-blue-50 border border-blue-200/80 text-blue-900 px-2 py-0.5 rounded-md">
                        {exp.fi_code}
                      </span>
                    </td>

                    {/* Item Name */}
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                      {item ? item.name : '—'}
                    </td>

                    {/* Group */}
                    <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                      {item ? item.group : '—'}
                    </td>

                    {/* Date */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {exp.date}
                    </td>

                    {/* Vendor */}
                    <td className="py-2.5 px-3.5 font-medium text-slate-800 whitespace-nowrap">
                      {exp.vendor}
                    </td>

                    {/* Reference / Invoice Number */}
                    <td className="py-2.5 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {exp.ref_number}
                    </td>

                    {/* Amount (Inline Editable) */}
                    <td className="py-2.5 px-3.5 text-left font-black text-slate-900 whitespace-nowrap">
                      {editingAmountId === exp.id ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={editingAmountValue}
                            onChange={(e) => setEditingAmountValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveInlineAmount(exp);
                              if (e.key === 'Escape') setEditingAmountId(null);
                            }}
                            autoFocus
                            className="w-24 bg-white border border-blue-500 rounded px-1.5 py-0.5 text-xs text-left font-black ring-2 ring-blue-400/20"
                          />
                          <button
                            onClick={() => handleSaveInlineAmount(exp)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="שמור"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingAmountId(exp.id);
                            setEditingAmountValue(exp.amount.toString());
                          }}
                          className="group inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                          title="לחץ לעריכה מהירה של הסכום"
                        >
                          <span>{formatCurrency(exp.amount)}</span>
                          <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-2.5 px-3.5 text-slate-500 max-w-xs truncate" title={exp.notes}>
                      {exp.notes || '—'}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap no-print">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ערוך הוצאה"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`האם למחוק הוצאה זו בסך ${formatCurrency(exp.amount)}?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="מחק הוצאה"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Edit Modal Dialog */}
      {isBulkEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    עריכה מרוכזת של הוצאות
                  </h3>
                  <p className="text-xs text-slate-500">
                    עדכון שדות משותפים עבור {selectedIds.length} הוצאות שסומנו
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkEdit} className="mt-4 space-y-4">
              
              {/* Change Date */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={bulkApplyDate}
                    onChange={(e) => setBulkApplyDate(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    עדכן תאריך לכל ההוצאות המסומנות
                  </span>
                </label>
                {bulkApplyDate && (
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    required={bulkApplyDate}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                )}
              </div>

              {/* Change Vendor */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={bulkApplyVendor}
                    onChange={(e) => setBulkApplyVendor(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    עדכן שם ספק לכל ההוצאות המסומנות
                  </span>
                </label>
                {bulkApplyVendor && (
                  <input
                    type="text"
                    placeholder="הזן שם ספק חדש..."
                    value={bulkVendor}
                    onChange={(e) => setBulkVendor(e.target.value)}
                    required={bulkApplyVendor}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                  />
                )}
              </div>

              {/* Change FI Item */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={bulkApplyItem}
                    onChange={(e) => setBulkApplyItem(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    העבר את כל ההוצאות לסעיף תקציב / FI אחר
                  </span>
                </label>
                {bulkApplyItem && (
                  <select
                    value={bulkItemId}
                    onChange={(e) => setBulkItemId(e.target.value)}
                    required={bulkApplyItem}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs cursor-pointer"
                  >
                    <option value="">בחר סעיף תקציבי חדש...</option>
                    {budgetItems.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fi_code} - {b.name} ({b.group})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Update Notes */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={bulkApplyNotes}
                    onChange={(e) => setBulkApplyNotes(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    הוסף / עדכן הערה לכל ההוצאות
                  </span>
                </label>
                {bulkApplyNotes && (
                  <textarea
                    rows={2}
                    placeholder="הזן הערה מרוכזת..."
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs resize-none"
                  />
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={
                    !bulkApplyDate &&
                    !bulkApplyVendor &&
                    !bulkApplyItem &&
                    !bulkApplyNotes
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  החל שינויים על {selectedIds.length} הוצאות
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Edit Expense Modal Dialog */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                עריכת הוצאה: {editingExpense.fi_code}
              </h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  תאריך
                </label>
                <input
                  type="date"
                  value={editingExpense.date}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, date: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  סכום (₪)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editingExpense.amount}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ספק
                </label>
                <input
                  type="text"
                  value={editingExpense.vendor}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, vendor: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  מספר אסמכתא / חשבונית
                </label>
                <input
                  type="text"
                  value={editingExpense.ref_number}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, ref_number: e.target.value })
                  }
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  הערות
                </label>
                <textarea
                  rows={2}
                  value={editingExpense.notes || ''}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, notes: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  שמור שינויים
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

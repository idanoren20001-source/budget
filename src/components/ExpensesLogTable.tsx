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
  Paperclip,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  User,
  Hash,
  Tag,
  Briefcase,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Expense, BudgetItem, AnomalyAlert } from '../types';
import { formatCurrency, detectAnomalies } from '../utils/budgetUtils';
import { INITIAL_GROUPS } from '../data/initialData';

interface ExpensesLogTableProps {
  expenses: Expense[];
  budgetItems: BudgetItem[];
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (expense: Expense) => void;
  onBulkDeleteExpenses?: (ids: string[]) => void;
  onBulkUpdateExpenses?: (ids: string[], updates: Partial<Expense>) => void;
  onClearAllExpenses?: () => void;
  onOpenNewExpense: () => void;
  onOpenExcelImport?: () => void;
  periodLabel: string;
}

export const ExpensesLogTable: React.FC<ExpensesLogTableProps> = ({
  expenses,
  budgetItems,
  onDeleteExpense,
  onUpdateExpense,
  onBulkDeleteExpenses,
  onBulkUpdateExpenses,
  onClearAllExpenses,
  onOpenNewExpense,
  onOpenExcelImport,
  periodLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    name: string;
    type: string;
    data: string;
  } | null>(null);

  // Compute Anomalies (Duplicates, Spikes, Missing Ref)
  const anomaliesMap = useMemo(() => {
    return detectAnomalies(expenses);
  }, [expenses]);

  // Compute available groups from budget items + initial
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    INITIAL_GROUPS.forEach((g) => set.add(g.name));
    budgetItems.forEach((b) => {
      if (b.group) set.add(b.group);
    });
    return Array.from(set).sort();
  }, [budgetItems]);

  const totalAnomaliesCount = useMemo(() => {
    return Array.from(anomaliesMap.values()).reduce((sum, list) => sum + list.length, 0);
  }, [anomaliesMap]);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  // Bulk Edit Form State
  const [bulkDate, setBulkDate] = useState('');
  const [bulkApplyDate, setBulkApplyDate] = useState(false);
  const [bulkVendor, setBulkVendor] = useState('');
  const [bulkApplyVendor, setBulkApplyVendor] = useState(false);
  const [bulkCompany, setBulkCompany] = useState('');
  const [bulkApplyCompany, setBulkApplyCompany] = useState(false);
  const [bulkUser, setBulkUser] = useState('');
  const [bulkApplyUser, setBulkApplyUser] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkApplyStatus, setBulkApplyStatus] = useState(false);
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

      if (showAnomaliesOnly && !anomaliesMap.has(exp.id)) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          exp.fi_code.toLowerCase().includes(q) ||
          exp.vendor.toLowerCase().includes(q) ||
          (exp.vendor_number && exp.vendor_number.toLowerCase().includes(q)) ||
          (exp.company && exp.company.toLowerCase().includes(q)) ||
          (exp.details && exp.details.toLowerCase().includes(q)) ||
          (exp.po_number && exp.po_number.toLowerCase().includes(q)) ||
          (exp.pd_number && exp.pd_number.toLowerCase().includes(q)) ||
          (exp.user_name && exp.user_name.toLowerCase().includes(q)) ||
          (exp.status && exp.status.toLowerCase().includes(q)) ||
          (exp.date_approved && exp.date_approved.toLowerCase().includes(q)) ||
          exp.ref_number.toLowerCase().includes(q) ||
          itemName.toLowerCase().includes(q) ||
          (exp.notes && exp.notes.toLowerCase().includes(q)) ||
          (exp.extra_notes && exp.extra_notes.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [expenses, itemsMap, selectedGroup, searchTerm, showAnomaliesOnly, anomaliesMap]);

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
        `האם אתה בטוח שברצונך למחוק ${count} הוצאות שנבחרו (בסך כולל של ${formatCurrency(
          selectedSum
        )})?`
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

  // Bulk Edit Submit
  const handleSaveBulkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    const updates: Partial<Expense> = {};
    if (bulkApplyDate && bulkDate) updates.date = bulkDate;
    if (bulkApplyVendor && bulkVendor) updates.vendor = bulkVendor;
    if (bulkApplyCompany && bulkCompany) updates.company = bulkCompany;
    if (bulkApplyUser && bulkUser) updates.user_name = bulkUser;
    if (bulkApplyStatus && bulkStatus) updates.status = bulkStatus;
    if (bulkApplyNotes) updates.notes = bulkNotes;

    if (bulkApplyItem && bulkItemId) {
      const item = budgetItems.find((b) => b.id === bulkItemId);
      if (item) {
        updates.budget_item_id = item.id;
        updates.fi_code = item.fi_code;
      }
    }

    if (Object.keys(updates).length === 0) {
      alert('לא נבחרו שדות לעדכון.');
      return;
    }

    if (onBulkUpdateExpenses) {
      onBulkUpdateExpenses(selectedIds, updates);
    } else {
      expenses
        .filter((exp) => selectedIds.includes(exp.id))
        .forEach((exp) => {
          onUpdateExpense({ ...exp, ...updates });
        });
    }

    setIsBulkEditOpen(false);
    setSelectedIds([]);
  };

  // Single Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    onUpdateExpense(editingExpense);
    setEditingExpense(null);
  };

  const selectedExpensesSum = useMemo(() => {
    return expenses
      .filter((e) => selectedIds.includes(e.id))
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses, selectedIds]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mb-8 font-['Assistant',sans-serif]">
      
      {/* Header & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              יומן הוצאות וחשבוניות — {periodLabel}
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

        {/* Search, Group Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search box across all 13 fields */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש ספק, PO, PD, משתמש, סכום, קוד FI..."
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
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">כל הקבוצות ({availableGroups.length})</option>
            {availableGroups.map((groupName) => (
              <option key={groupName} value={groupName}>
                {groupName}
              </option>
            ))}
          </select>

          {/* Anomaly Filter Toggle Button */}
          {totalAnomaliesCount > 0 && (
            <button
              onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                showAnomaliesOnly
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
              }`}
              title="סנן והצג רק הוצאות עם חשד לכפילות או קפיצה חריגה בסכום"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>התראות ({totalAnomaliesCount})</span>
            </button>
          )}

          {/* New Expense button */}
          <button
            onClick={onOpenNewExpense}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>הוצאה חדשה</span>
          </button>

          {/* Clear all expenses button */}
          {expenses.length > 0 && onClearAllExpenses && (
            <button
              onClick={onClearAllExpenses}
              className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              title="מחק ורוקן את כל ההוצאות הקיימות במערכת"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>איפוס יומן</span>
            </button>
          )}

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
                setBulkCompany('');
                setBulkApplyCompany(false);
                setBulkUser('');
                setBulkApplyUser(false);
                setBulkStatus('');
                setBulkApplyStatus(false);
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
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold whitespace-nowrap">
              {/* Checkbox */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="בחר / בטל בחירת הכל"
                />
              </th>
              <th className="py-3 px-2.5">Date opened</th>
              <th className="py-3 px-3">ספק (Vendor)</th>
              <th className="py-3 px-2.5">מספר ספק</th>
              <th className="py-3 px-2.5">חברה</th>
              <th className="py-3 px-3">Details (פירוט)</th>
              <th className="py-3 px-2.5 font-mono">PO</th>
              <th className="py-3 px-2.5 font-mono">PD</th>
              <th className="py-3 px-3 text-left">Cost (עלות)</th>
              <th className="py-3 px-2.5">User</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2.5">Date approved</th>
              <th className="py-3 px-3">סעיף FI משויך</th>
              <th className="py-3 px-3 text-center no-print">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 whitespace-nowrap">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <FileSpreadsheet className="w-10 h-10 text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">
                      יומן ההוצאות ריק
                    </p>
                    <p className="text-xs text-slate-400">
                      לא נרשמו עדיין הוצאות. תוכל להעלות קובץ נתונים או לרשום הוצאה ראשונה.
                    </p>
                    {onOpenExcelImport && (
                      <button
                        onClick={onOpenExcelImport}
                        className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>ייבוא מקובץ אקסל / CSV עכשיו</span>
                      </button>
                    )}
                  </div>
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

                    {/* Date opened */}
                    <td className="py-2.5 px-2.5 font-mono text-slate-600">
                      {exp.date}
                    </td>

                    {/* Vendor */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{exp.vendor}</span>
                        {exp.attachment_data && (
                          <button
                            onClick={() =>
                              setPreviewAttachment({
                                name: exp.attachment_name || 'חשבונית',
                                type: exp.attachment_type || 'image/png',
                                data: exp.attachment_data!,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 p-0.5 rounded cursor-pointer"
                            title="צפה בצילום החשבונית המקורית"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {anomaliesMap.has(exp.id) && (
                        <div className="mt-0.5 space-y-0.5">
                          {anomaliesMap.get(exp.id)!.map((al) => (
                            <span
                              key={al.id}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                al.type === 'duplicate'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                              title={al.description}
                            >
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>{al.title}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Vendor Number */}
                    <td className="py-2.5 px-2.5 font-mono text-slate-500">
                      {exp.vendor_number || '—'}
                    </td>

                    {/* Company */}
                    <td className="py-2.5 px-2.5 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        {exp.company || 'IDE'}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-2.5 px-3 text-slate-600 max-w-[170px] truncate" title={exp.details || exp.notes}>
                      {exp.details || exp.notes || '—'}
                    </td>

                    {/* PO */}
                    <td className="py-2.5 px-2.5 font-mono font-bold text-blue-700">
                      {exp.po_number || '—'}
                    </td>

                    {/* PD */}
                    <td className="py-2.5 px-2.5 font-mono font-bold text-indigo-700">
                      {exp.pd_number || '—'}
                    </td>

                    {/* Cost (Inline Editable) */}
                    <td className="py-2.5 px-3 text-left font-black text-slate-900 font-mono">
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

                    {/* User */}
                    <td className="py-2.5 px-2.5 text-slate-600">
                      {exp.user_name || '—'}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        exp.status?.toLowerCase().includes('pending')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {exp.status || 'אושר'}
                      </span>
                    </td>

                    {/* Date approved */}
                    <td className="py-2.5 px-2.5 font-mono text-slate-500 text-[11px]">
                      {exp.date_approved || '—'}
                    </td>

                    {/* Matched FI Item */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold bg-blue-50 border border-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded text-[11px]">
                          {exp.fi_code}
                        </span>
                        <span className="font-medium text-slate-700 max-w-[130px] truncate" title={item?.name}>
                          {item ? item.name : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap no-print">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="ערוך את כל פרטי החשבונית"
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
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  עריכה מרוכזת ({selectedIds.length} שורות נבחרו)
                </h3>
              </div>
              <button
                onClick={() => setIsBulkEditOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBulkEdit} className="mt-4 space-y-3.5 text-xs">
              <p className="text-slate-500 text-xs">
                סמן ב-✓ את השדות שברצונך לשנות לכל השורות שנבחרו:
              </p>

              {/* Vendor */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkApplyVendor}
                    onChange={(e) => setBulkApplyVendor(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>עדכן ספק</span>
                </label>
                {bulkApplyVendor && (
                  <input
                    type="text"
                    value={bulkVendor}
                    onChange={(e) => setBulkVendor(e.target.value)}
                    placeholder="שם ספק חדש..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                )}
              </div>

              {/* Company */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkApplyCompany}
                    onChange={(e) => setBulkApplyCompany(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>עדכן חברה</span>
                </label>
                {bulkApplyCompany && (
                  <input
                    type="text"
                    value={bulkCompany}
                    onChange={(e) => setBulkCompany(e.target.value)}
                    placeholder="IDE Technologies..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                )}
              </div>

              {/* Status */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkApplyStatus}
                    onChange={(e) => setBulkApplyStatus(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>עדכן סטטוס</span>
                </label>
                {bulkApplyStatus && (
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer font-bold"
                  >
                    <option value="Approved">Approved (אושר)</option>
                    <option value="Pending">Pending (ממתין)</option>
                    <option value="In Review">In Review (בבדיקה)</option>
                    <option value="Paid">Paid (שולם)</option>
                  </select>
                )}
              </div>

              {/* FI Item */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkApplyItem}
                    onChange={(e) => setBulkApplyItem(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span>העבר לסעיף תקציב ו-FI אחר</span>
                </label>
                {bulkApplyItem && (
                  <select
                    value={bulkItemId}
                    onChange={(e) => setBulkItemId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="">בחר סעיף תקציב...</option>
                    {budgetItems.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fi_code} - {b.name} ({b.group})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkEditOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  החל על {selectedIds.length} שורות
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Edit Expense Modal Dialog (All 13 fields) */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  עריכת פרטי חשבונית: {editingExpense.vendor} ({editingExpense.fi_code})
                </h3>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-3.5 space-y-3 overflow-y-auto flex-1 pr-1 text-xs">
              
              {/* Row 1: Date opened | Date approved | Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date opened
                  </label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, date: e.target.value })
                    }
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Date approved
                  </label>
                  <input
                    type="date"
                    value={editingExpense.date_approved || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, date_approved: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingExpense.status || 'Approved'}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, status: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Vendor | מספר ספק | חברה */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={editingExpense.vendor}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, vendor: e.target.value })
                    }
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    מספר ספק
                  </label>
                  <input
                    type="text"
                    value={editingExpense.vendor_number || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, vendor_number: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    חברה
                  </label>
                  <input
                    type="text"
                    value={editingExpense.company || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, company: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Cost | PO | PD */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cost (₪)
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PO
                  </label>
                  <input
                    type="text"
                    value={editingExpense.po_number || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, po_number: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    PD
                  </label>
                  <input
                    type="text"
                    value={editingExpense.pd_number || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, pd_number: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              {/* Row 4: Details | User */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Details
                  </label>
                  <input
                    type="text"
                    value={editingExpense.details || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, details: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    User
                  </label>
                  <input
                    type="text"
                    value={editingExpense.user_name || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, user_name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* FI Item change */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  סעיף תקציב ו-FI
                </label>
                <select
                  value={editingExpense.budget_item_id}
                  onChange={(e) => {
                    const found = budgetItems.find((b) => b.id === e.target.value);
                    if (found) {
                      setEditingExpense({
                        ...editingExpense,
                        budget_item_id: found.id,
                        fi_code: found.fi_code,
                      });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                >
                  {budgetItems.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.fi_code} - {b.name} ({b.group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes & Extra notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    הערות
                  </label>
                  <textarea
                    rows={2}
                    value={editingExpense.notes || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, notes: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs resize-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    עוד הערות...
                  </label>
                  <textarea
                    rows={2}
                    value={editingExpense.extra_notes || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, extra_notes: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
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

      {/* Attachment Lightbox Modal */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">
                  {previewAttachment.name}
                </span>
                <span className="text-xs text-slate-400">
                  ({previewAttachment.type})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewAttachment.data}
                  download={previewAttachment.name}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>הורד קובץ</span>
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/5 min-h-[400px]">
              {previewAttachment.type.includes('pdf') ? (
                <iframe
                  src={previewAttachment.data}
                  title={previewAttachment.name}
                  className="w-full h-[650px] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewAttachment.data}
                  alt={previewAttachment.name}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

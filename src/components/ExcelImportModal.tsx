import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { BudgetItem, Expense } from '../types';
import { formatCurrency } from '../utils/budgetUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetItems: BudgetItem[];
  onImportExpenses: (expenses: Omit<Expense, 'id' | 'created_at'>[]) => void;
}

interface ParsedRow {
  id: string;
  selected: boolean;
  date: string;
  amount: number;
  vendor: string;
  ref_number: string;
  notes: string;
  budget_item_id: string;
  fi_code: string;
  isAutoMatched: boolean;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  budgetItems,
  onImportExpenses,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Smart matching helper
  const findMatchingBudgetItem = (
    vendor: string,
    rawFi: string,
    rawItem: string
  ): BudgetItem | null => {
    // 1. Exact or partial FI match
    if (rawFi) {
      const cleanFi = rawFi.replace(/[^0-9]/g, '');
      const match = budgetItems.find((b) => b.fi_code.includes(cleanFi));
      if (match) return match;
    }

    // 2. Item Name match
    if (rawItem) {
      const match = budgetItems.find((b) =>
        b.name.toLowerCase().includes(rawItem.toLowerCase())
      );
      if (match) return match;
    }

    // 3. Vendor keyword match
    const v = vendor.toLowerCase();
    if (v.includes('חשמל')) {
      const match = budgetItems.find((b) => b.name.includes('חשמל'));
      if (match) return match;
    }
    if (v.includes('דלק') || v.includes('פז') || v.includes('סונול') || v.includes('טן')) {
      const match = budgetItems.find((b) => b.name.includes('דלק'));
      if (match) return match;
    }
    if (v.includes('קייטרינג') || v.includes('אוכל') || v.includes('הסעדה')) {
      const match = budgetItems.find((b) => b.name.includes('ארוחות') || b.group.includes('הסעדה'));
      if (match) return match;
    }
    if (v.includes('בזק') || v.includes('סלקום') || v.includes('פרטנר') || v.includes('אינטרנט')) {
      const match = budgetItems.find((b) => b.group.includes('תקשורת'));
      if (match) return match;
    }
    if (v.includes('שכירות') || v.includes('ארנונה')) {
      const match = budgetItems.find((b) => b.group.includes('נדל"ן'));
      if (match) return match;
    }

    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setErrorMsg(null);
    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonRows.length === 0) {
          setErrorMsg('הקובץ שנבחר ריק או שאינו מכיל שורות תקינות.');
          return;
        }

        // Parse each row flexibly
        const rows: ParsedRow[] = jsonRows.map((row, idx) => {
          // Detect fields
          const keys = Object.keys(row);
          const findKey = (candidates: string[]) => {
            const found = keys.find((k) =>
              candidates.some((c) => k.toLowerCase().includes(c.toLowerCase()))
            );
            return found ? String(row[found]).trim() : '';
          };

          const rawDate = findKey(['תאריך', 'date', 'מועד']);
          const rawAmount = findKey(['סכום', 'amount', 'חובה', 'חיוב', 'בש"ח', 'ש"ח']);
          const rawVendor = findKey(['ספק', 'vendor', 'בית עסק', 'מוטב', 'payee', 'תיאור', 'שם']);
          const rawRef = findKey(['אסמכתא', 'ref', 'חשבונית', 'קבלה', 'מספר']);
          const rawFi = findKey(['fi', 'קוד']);
          const rawItem = findKey(['סעיף', 'שם סעיף', 'item']);
          const rawNotes = findKey(['הערות', 'notes', 'פירוט']);

          // Amount parsing
          const parsedAmount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]/g, ''))) || 0;

          // Date format normalize to YYYY-MM-DD
          let parsedDate = rawDate;
          if (rawDate && rawDate.includes('/')) {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              parsedDate = `${y}-${m}-${d}`;
            }
          }
          if (!parsedDate || parsedDate.length < 8) {
            parsedDate = new Date().toISOString().slice(0, 10);
          }

          // Smart match
          const matchedItem = findMatchingBudgetItem(rawVendor, rawFi, rawItem);
          const defaultItem = matchedItem || budgetItems[0];

          return {
            id: `import-${idx}-${Date.now()}`,
            selected: true,
            date: parsedDate,
            amount: parsedAmount,
            vendor: rawVendor || 'ספק כללי',
            ref_number: rawRef || `IMP-${Date.now().toString().slice(-4)}`,
            notes: rawNotes || 'נקלט מקובץ אקסל',
            budget_item_id: defaultItem ? defaultItem.id : '',
            fi_code: defaultItem ? defaultItem.fi_code : 'FI-100',
            isAutoMatched: !!matchedItem,
          };
        });

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Failed to parse Excel file:', err);
        setErrorMsg('שגיאה בקריאת הקובץ. אנא ודא שמדובר בקובץ אקסל (xlsx / xls / csv) תקין.');
      }
    };

    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const handleToggleRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleUpdateRowItem = (id: string, budgetItemId: string) => {
    const item = budgetItems.find((b) => b.id === budgetItemId);
    if (!item) return;
    setParsedRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, budget_item_id: item.id, fi_code: item.fi_code, isAutoMatched: true }
          : r
      )
    );
  };

  const handleCommitImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.amount > 0 && r.budget_item_id);
    if (selectedRows.length === 0) {
      alert('לא נבחרו שורות תקינות לקליטה.');
      return;
    }

    const newExpenses: Omit<Expense, 'id' | 'created_at'>[] = selectedRows.map((r) => ({
      budget_item_id: r.budget_item_id,
      fi_code: r.fi_code,
      date: r.date,
      amount: r.amount,
      vendor: r.vendor,
      ref_number: r.ref_number,
      notes: r.notes,
    }));

    onImportExpenses(newExpenses);
    onClose();
  };

  const selectedCount = parsedRows.filter((r) => r.selected).length;
  const totalSelectedSum = parsedRows
    .filter((r) => r.selected)
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Assistant',sans-serif]">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ייבוא הוצאות מקובץ אקסל / דוח בנק
              </h3>
              <p className="text-xs text-slate-500">
                העלה קובץ XLSX / CSV לקליטה מרוכזת עם זיהוי ספקים וקודי FI אוטומטי
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone (If no rows parsed yet) */}
        {parsedRows.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors my-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              גרור לכאן קובץ אקסל או לחץ לבחירה מהמחשב
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              תומך בקובצי XLSX, XLS ו-CSV (דוחות הנהלת חשבונות, פירוט כרטיס אשראי או דפי בנק)
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              בחר קובץ מהמחשב
            </button>

            {errorMsg && (
              <div className="mt-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        ) : (
          /* Parsed Rows Preview Table */
          <div className="flex-1 flex flex-col overflow-hidden my-3">
            
            {/* Top Toolbar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800">
                  נמצאו {parsedRows.length} שורות בקובץ "{file?.name}"
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {selectedCount} נבחרו לקליטה
                </span>
              </div>
              <div className="font-black text-slate-900">
                סך הכל נבחר: {formatCurrency(totalSelectedSum)}
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-28">תאריך</th>
                    <th className="py-2.5 px-3 w-40">ספק / מוטב</th>
                    <th className="py-2.5 px-3 text-left w-32">סכום בש"ח</th>
                    <th className="py-2.5 px-3 w-32">אסמכתא</th>
                    <th className="py-2.5 px-3">שיוך לסעיף תקציבי וקוד FI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !r.selected ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.selected}
                          onChange={() => handleToggleRow(r.id)}
                          className="rounded border-slate-300 text-emerald-600 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {r.date}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {r.vendor}
                      </td>
                      <td className="py-2 px-3 text-left font-black text-slate-900 font-mono">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {r.ref_number}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={r.budget_item_id}
                            onChange={(e) => handleUpdateRowItem(r.id, e.target.value)}
                            className={`w-full bg-white border rounded-lg px-2 py-1 text-xs cursor-pointer font-bold ${
                              r.isAutoMatched
                                ? 'border-emerald-300 text-slate-800'
                                : 'border-amber-400 bg-amber-50/50 text-amber-900'
                            }`}
                          >
                            {budgetItems.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.fi_code} - {b.name} ({b.group})
                              </option>
                            ))}
                          </select>
                          {r.isAutoMatched && (
                            <span title="זוהה אוטומטית" className="shrink-0 flex items-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {parsedRows.length > 0 ? (
            <button
              onClick={() => {
                setParsedRows([]);
                setFile(null);
              }}
              className="text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>בחר קובץ אחר</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
            >
              ביטול
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleCommitImport}
                disabled={selectedCount === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
              >
                קלוט {selectedCount} הוצאות למערכת
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

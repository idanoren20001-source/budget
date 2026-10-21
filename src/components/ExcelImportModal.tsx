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
  Sparkles,
  Building2,
  Calendar,
  DollarSign,
  User,
  Filter,
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
  date: string; // Date opened
  vendor: string; // Vendor
  vendor_number: string; // מספר ספק
  amount: number; // Cost
  company: string; // חברה
  details: string; // Details
  po_number: string; // PO
  pd_number: string; // PD
  notes: string; // הערות
  extra_notes: string; // עוד הערות...
  user_name: string; // User
  status: string; // Status
  date_approved: string; // Date approved
  ref_number: string; // אסמכתא (defaults to PO or PD or generated)
  budget_item_id: string;
  fi_code: string;
  isAutoMatched: boolean;
}

function parseExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  const str = String(val).trim();
  if (!str) return '';
  // dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  const dmy = str.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${m}-${d}`;
  }
  // yyyy-mm-dd or yyyy/mm/dd
  const ymd = str.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return str;
}

function parseExcelAmount(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.abs(val);
  const clean = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
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
  const [bulkFiSelect, setBulkFiSelect] = useState<string>('');
  const [previewFilter, setPreviewFilter] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Smart matching helper
  const findMatchingBudgetItem = (
    vendor: string,
    details: string,
    notes: string,
    rawFi: string
  ): BudgetItem | null => {
    // 1. Direct FI code in text or FI column
    const textToScan = `${rawFi} ${details} ${notes} ${vendor}`;
    const fiMatch = textToScan.match(/FI[-_\s]?(\d{3})/i);
    if (fiMatch) {
      const fiNum = fiMatch[1];
      const match = budgetItems.find((b) => b.fi_code.includes(fiNum));
      if (match) return match;
    }

    // 2. Budget Item Name match
    for (const item of budgetItems) {
      if (
        details.toLowerCase().includes(item.name.toLowerCase()) ||
        vendor.toLowerCase().includes(item.name.toLowerCase())
      ) {
        return item;
      }
    }

    // 3. Keyword heuristic match
    const v = (vendor + ' ' + details).toLowerCase();
    if (v.includes('חשמל')) {
      const match = budgetItems.find((b) => b.name.includes('חשמל'));
      if (match) return match;
    }
    if (v.includes('דלק') || v.includes('פז') || v.includes('סונול') || v.includes('טן')) {
      const match = budgetItems.find((b) => b.name.includes('דלק'));
      if (match) return match;
    }
    if (v.includes('קייטרינג') || v.includes('אוכל') || v.includes('הסעדה') || v.includes('קפה') || v.includes('ארוחות')) {
      const match = budgetItems.find((b) => b.group.includes('הסעדה'));
      if (match) return match;
    }
    if (v.includes('בזק') || v.includes('סלקום') || v.includes('פרטנר') || v.includes('אינטרנט') || v.includes('ניידים')) {
      const match = budgetItems.find((b) => b.group.includes('תקשורת'));
      if (match) return match;
    }
    if (v.includes('שכירות') || v.includes('ארנונה') || v.includes('שילוט')) {
      const match = budgetItems.find((b) => b.group.includes('נדל"ן'));
      if (match) return match;
    }
    if (v.includes('ליסינג') || v.includes('אלבר') || v.includes('שטיפה') || v.includes('כביש 6') || v.includes('חניה')) {
      const match = budgetItems.find((b) => b.group.includes('רכבים'));
      if (match) return match;
    }
    if (v.includes('ניקיון') || v.includes('אבטחה') || v.includes('מעליות') || v.includes('מים') || v.includes('אחזקה')) {
      const match = budgetItems.find((b) => b.group.includes('תפעול'));
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
          setErrorMsg('הקובץ שנבחר ריק או שאינו מכיל שורות נתונים.');
          return;
        }

        // Parse each row matching the exact 13 columns
        const rows: ParsedRow[] = jsonRows.map((row, idx) => {
          const keys = Object.keys(row);

          const getVal = (candidates: string[]) => {
            // First check exact match
            const exact = keys.find((k) =>
              candidates.some((c) => k.trim().toLowerCase() === c.trim().toLowerCase())
            );
            if (exact && row[exact] !== undefined && row[exact] !== '') {
              return row[exact];
            }
            // Secondary: contains match
            const partial = keys.find((k) =>
              candidates.some((c) => k.toLowerCase().includes(c.toLowerCase()))
            );
            return partial && row[partial] !== undefined ? row[partial] : '';
          };

          // Columns extraction matching the user's headers:
          // Date opened | Vendor | מספר ספק | Cost | חברה | Details | PO | PD | הערות | עוד הערות... | User | Status | Date approved
          const rawDateOpened = getVal(['Date opened', 'Date Opened', 'תאריך פתיחה', 'date opened', 'תאריך', 'date']);
          const rawVendor = String(getVal(['Vendor', 'vendor', 'ספק', 'שם ספק', 'בית עסק'])).trim();
          const rawVendorNum = String(getVal(['מספר ספק', 'קוד ספק', 'Vendor number', 'vendor no', 'vendor id', 'supplier no'])).trim();
          const rawCost = getVal(['Cost', 'cost', 'עלות', 'סכום', 'amount', 'סה"כ', 'מחיר']);
          const rawCompany = String(getVal(['חברה', 'Company', 'company', 'ישות'])).trim();
          const rawDetails = String(getVal(['Details', 'details', 'פירוט', 'תיאור', 'פרטים', 'נושא'])).trim();
          const rawPO = String(getVal(['PO', 'po', 'הזמנה', 'מספר הזמנה', 'purchase order'])).trim();
          const rawPD = String(getVal(['PD', 'pd', 'דרישה', 'מספר דרישה', 'payment document', 'pr'])).trim();
          const rawExtraNotes = String(getVal(['עוד הערות...', 'עוד הערות', 'הערות נוספות', 'extra notes', 'additional notes'])).trim();
          
          // Notes: avoid picking "עוד הערות" as notes if both exist
          let rawNotes = '';
          const notesKey = keys.find(
            (k) =>
              (k.toLowerCase().includes('הערות') || k.toLowerCase().includes('notes')) &&
              !k.includes('עוד') &&
              !k.toLowerCase().includes('extra') &&
              !k.toLowerCase().includes('additional')
          );
          if (notesKey && row[notesKey]) {
            rawNotes = String(row[notesKey]).trim();
          } else {
            rawNotes = String(getVal(['הערות', 'הערה', 'notes'])).trim();
          }

          const rawUser = String(getVal(['User', 'user', 'משתמש', 'דורש', 'יוצר', 'נוצר ע"י'])).trim();
          const rawStatus = String(getVal(['Status', 'status', 'סטטוס', 'מצב'])).trim();
          const rawDateApproved = getVal(['Date approved', 'Date Approved', 'תאריך אישור', 'date approved', 'approved date']);
          const rawFi = String(getVal(['fi', 'קוד fi', 'סעיף'])).trim();

          const parsedDate = parseExcelDate(rawDateOpened) || new Date().toISOString().slice(0, 10);
          const parsedApprovedDate = parseExcelDate(rawDateApproved);
          const parsedAmount = parseExcelAmount(rawCost);

          // Determine ref_number: PO or PD or Ref or auto-generated
          const refNumber = rawPO || rawPD || rawVendorNum || `INV-${Date.now().toString().slice(-5)}-${idx + 1}`;

          // Match FI budget item
          const matchedItem = findMatchingBudgetItem(rawVendor, rawDetails, rawNotes, rawFi);
          const defaultItem = matchedItem || budgetItems[0];

          return {
            id: `import-${idx}-${Date.now()}`,
            selected: true,
            date: parsedDate,
            vendor: rawVendor || 'ספק כללי',
            vendor_number: rawVendorNum,
            amount: parsedAmount,
            company: rawCompany || 'IDE Technologies',
            details: rawDetails,
            po_number: rawPO,
            pd_number: rawPD,
            notes: rawNotes,
            extra_notes: rawExtraNotes,
            user_name: rawUser || 'משתמש מערכת',
            status: rawStatus || 'אושר',
            date_approved: parsedApprovedDate || '',
            ref_number: refNumber,
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

  // Bulk assign budget item to all selected rows
  const handleApplyBulkFi = () => {
    if (!bulkFiSelect) return;
    const item = budgetItems.find((b) => b.id === bulkFiSelect);
    if (!item) return;
    setParsedRows((prev) =>
      prev.map((r) =>
        r.selected
          ? { ...r, budget_item_id: item.id, fi_code: item.fi_code, isAutoMatched: true }
          : r
      )
    );
  };

  const handleCommitImport = () => {
    const selectedRows = parsedRows.filter((r) => r.selected && r.amount > 0 && r.budget_item_id);
    if (selectedRows.length === 0) {
      alert('לא נבחרו שורות תקינות לקליטה (יש לוודא שקיים סכום ושיוך לסעיף תקציב).');
      return;
    }

    const newExpenses: Omit<Expense, 'id' | 'created_at'>[] = selectedRows.map((r) => ({
      budget_item_id: r.budget_item_id,
      fi_code: r.fi_code,
      date: r.date,
      vendor: r.vendor,
      vendor_number: r.vendor_number || undefined,
      amount: r.amount,
      company: r.company || undefined,
      details: r.details || undefined,
      po_number: r.po_number || undefined,
      pd_number: r.pd_number || undefined,
      ref_number: r.ref_number || r.po_number || r.pd_number || `INV-${Date.now().toString().slice(-4)}`,
      notes: r.notes || undefined,
      extra_notes: r.extra_notes || undefined,
      user_name: r.user_name || undefined,
      status: r.status || undefined,
      date_approved: r.date_approved || undefined,
    }));

    onImportExpenses(newExpenses);
    onClose();
  };

  const filteredPreviewRows = parsedRows.filter((r) => {
    if (!previewFilter.trim()) return true;
    const q = previewFilter.toLowerCase();
    return (
      r.vendor.toLowerCase().includes(q) ||
      r.vendor_number.toLowerCase().includes(q) ||
      r.company.toLowerCase().includes(q) ||
      r.details.toLowerCase().includes(q) ||
      r.po_number.toLowerCase().includes(q) ||
      r.pd_number.toLowerCase().includes(q) ||
      r.user_name.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.notes.toLowerCase().includes(q) ||
      r.fi_code.toLowerCase().includes(q)
    );
  });

  const selectedCount = parsedRows.filter((r) => r.selected).length;
  const totalSelectedSum = parsedRows
    .filter((r) => r.selected)
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Assistant',sans-serif]">
      <div className="bg-white rounded-3xl max-w-6xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ייבוא חשבוניות והוצאות מקובץ אקסל / CSV
              </h3>
              <p className="text-xs text-slate-500">
                זיהוי אוטומטי מלא של עמודות הנתונים: תאריך, ספק, מספר ספק, עלות, חברה, פירוט, PO, PD, הערות, עוד הערות, משתמש, סטטוס ותאריך אישור
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: File Upload Screen */}
        {parsedRows.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <div className="w-16 h-16 bg-white shadow-sm border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">
                לחץ לבחירת קובץ או גרור לכאן
              </h4>
              <p className="text-xs text-slate-500 text-center mb-3">
                תמיכה בקובצי Excel (.xlsx, .xls) ו-CSV
              </p>
              <div className="bg-white/80 border border-emerald-200 rounded-xl px-3 py-1.5 text-[11px] text-emerald-800 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>זיהוי אוטומטי של עמודות הקובץ המותאמות למערכת</span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          /* Step 2: Preview, FI Assignment & Import Confirmation */
          <div className="flex-1 flex flex-col min-h-0 py-4 gap-3">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800">
                  נמצאו {parsedRows.length} שורות בקובץ "{file?.name}"
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  {selectedCount} נבחרו לקליטה
                </span>
                <span className="font-black text-slate-900 bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
                  סך הכל נבחר: {formatCurrency(totalSelectedSum)}
                </span>
              </div>

              {/* Quick filter & Bulk assign */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={previewFilter}
                    onChange={(e) => setPreviewFilter(e.target.value)}
                    placeholder="חיפוש מהיר בטבלה..."
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs w-44"
                  />
                </div>

                {/* Bulk assign FI to selected */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
                  <select
                    value={bulkFiSelect}
                    onChange={(e) => setBulkFiSelect(e.target.value)}
                    className="bg-transparent text-xs text-slate-700 outline-none max-w-[160px] truncate"
                  >
                    <option value="">שייך סעיף לנבחרים...</option>
                    {budgetItems.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.fi_code} - {b.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleApplyBulkFi}
                    disabled={!bulkFiSelect}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-2.5 py-0.5 rounded-lg text-xs cursor-pointer"
                  >
                    החל
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-2xl shadow-xs">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10 whitespace-nowrap">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={parsedRows.length > 0 && parsedRows.every((r) => r.selected)}
                        onChange={(e) => handleToggleSelectAll(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-2.5">Date opened</th>
                    <th className="py-2.5 px-3">Vendor (ספק)</th>
                    <th className="py-2.5 px-2.5">מספר ספק</th>
                    <th className="py-2.5 px-3 text-left">Cost (עלות)</th>
                    <th className="py-2.5 px-2.5">חברה</th>
                    <th className="py-2.5 px-3">Details (פירוט)</th>
                    <th className="py-2.5 px-2.5 font-mono">PO</th>
                    <th className="py-2.5 px-2.5 font-mono">PD</th>
                    <th className="py-2.5 px-2.5">User</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2.5">Date approved</th>
                    <th className="py-2.5 px-3">שיוך לסעיף תקציב ו-FI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 whitespace-nowrap">
                  {filteredPreviewRows.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        !r.selected ? 'opacity-40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={r.selected}
                          onChange={() => handleToggleRow(r.id)}
                          className="rounded border-slate-300 text-emerald-600 cursor-pointer"
                        />
                      </td>

                      {/* Date opened */}
                      <td className="py-2 px-2.5 font-mono text-slate-600">
                        {r.date}
                      </td>

                      {/* Vendor */}
                      <td className="py-2 px-3 font-bold text-slate-900 max-w-[140px] truncate" title={r.vendor}>
                        {r.vendor}
                      </td>

                      {/* Vendor Number */}
                      <td className="py-2 px-2.5 font-mono text-slate-500">
                        {r.vendor_number || '—'}
                      </td>

                      {/* Cost */}
                      <td className="py-2 px-3 text-left font-black text-slate-900 font-mono">
                        {formatCurrency(r.amount)}
                      </td>

                      {/* Company */}
                      <td className="py-2 px-2.5 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                          {r.company || 'IDE'}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-2 px-3 text-slate-600 max-w-[160px] truncate" title={r.details}>
                        {r.details || '—'}
                      </td>

                      {/* PO */}
                      <td className="py-2 px-2.5 font-mono text-blue-600 font-bold">
                        {r.po_number || '—'}
                      </td>

                      {/* PD */}
                      <td className="py-2 px-2.5 font-mono text-indigo-600">
                        {r.pd_number || '—'}
                      </td>

                      {/* User */}
                      <td className="py-2 px-2.5 text-slate-600">
                        {r.user_name || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-2">
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {r.status || 'אושר'}
                        </span>
                      </td>

                      {/* Date approved */}
                      <td className="py-2 px-2.5 font-mono text-slate-500 text-[11px]">
                        {r.date_approved || '—'}
                      </td>

                      {/* FI Code & Budget Item Select */}
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
                            <span title="זוהה אוטומטית לפי ספק/פירוט" className="shrink-0 flex items-center">
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
                setErrorMsg(null);
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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>ייבא {selectedCount} חשבוניות למערכת</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

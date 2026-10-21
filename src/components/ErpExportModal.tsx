import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  FileSpreadsheet,
  Download,
  Building2,
  Boxes,
  Layers,
  Calendar,
  CheckCircle2,
  FileText,
  DollarSign,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';
import { BudgetItemCalculated, Expense, SiteId } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { getStoredBudgetItems, getStoredExpenses } from '../services/storageService';

export type ErpTemplateType = 'journal_entries' | 'invoices_erp' | 'budget_control';

interface ErpExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSite: SiteId;
  budgetItems: BudgetItemCalculated[];
  expenses: Expense[];
  periodLabel: string;
}

export const ErpExportModal: React.FC<ErpExportModalProps> = ({
  isOpen,
  onClose,
  activeSite,
  budgetItems,
  expenses,
  periodLabel,
}) => {
  const [template, setTemplate] = useState<ErpTemplateType>('journal_entries');
  const [exportScope, setExportScope] = useState<'current' | 'both'>('current');
  const [fileFormat, setFileFormat] = useState<'xlsx' | 'csv' | 'txt'>('xlsx');

  if (!isOpen) return null;

  // Retrieve data based on export scope (current site vs consolidated both sites)
  const scopedData = useMemo(() => {
    if (exportScope === 'current') {
      return {
        siteName: activeSite === 'marlog' ? 'מרלוג' : 'מתחם קדימה',
        siteCode: activeSite === 'marlog' ? 'CC-2000' : 'CC-1000',
        expenses,
        budgetItems,
      };
    }

    // Both sites consolidated
    const kadimaItems = getStoredBudgetItems('kadima');
    const kadimaExpenses = getStoredExpenses('kadima');
    const marlogItems = getStoredBudgetItems('marlog');
    const marlogExpenses = getStoredExpenses('marlog');

    return {
      siteName: 'מאוחד (קדימה + מרלוג)',
      siteCode: 'ALL-SITES',
      expenses: [
        ...kadimaExpenses.map((e) => ({ ...e, company: e.company || 'מתחם קדימה' })),
        ...marlogExpenses.map((e) => ({ ...e, company: e.company || 'מרלוג' })),
      ],
      budgetItems,
    };
  }, [exportScope, activeSite, expenses, budgetItems]);

  // Generate rows based on selected template
  const generatedRows = useMemo(() => {
    const budgetMap: Record<string, { name: string; group: string; fi: string }> = {};
    budgetItems.forEach((b) => {
      budgetMap[b.id] = { name: b.name, group: b.group, fi: b.fi_code };
    });

    if (template === 'journal_entries') {
      // 1. General Ledger Journal Entries (פקודות יומן)
      return scopedData.expenses.map((exp, idx) => {
        const item = budgetMap[exp.budget_item_id] || {
          name: 'הוצאות כלליות',
          group: 'כללי',
          fi: exp.fi_code || 'FI-GEN',
        };
        const costCenter =
          exp.company?.includes('מרלוג') || activeSite === 'marlog' ? 'CC-2000' : 'CC-1000';

        return {
          'מספר פקודה': idx + 1001,
          'תאריך פקודה': exp.date || new Date().toISOString().slice(0, 10),
          'חשבון חובה (FI)': item.fi,
          'שם חשבון חובה': item.name,
          'חשבון זכות (ספק)': exp.vendor_number || 'V-PENDING',
          'שם ספק / מוטב': exp.vendor,
          'סכום (₪)': exp.amount,
          'מטבע': 'ILS',
          'אסמכתא 1 (PO)': exp.po_number || '',
          'אסמכתא 2 (PD/Ref)': exp.pd_number || exp.ref_number || '',
          'תיאור התנועה': exp.details || exp.notes || 'תשלום שוטף',
          'מרכז עלות': costCenter,
          'קוד חברה': '1000 - IDE Technologies',
          'סטטוס': exp.status || 'Approved',
          'תאריך אישור': exp.date_approved || '',
        };
      });
    }

    if (template === 'invoices_erp') {
      // 2. Enterprise Invoices Register (קובץ ספקים וחשבוניות תואם SAP/ERP)
      return scopedData.expenses.map((exp) => {
        const item = budgetMap[exp.budget_item_id] || {
          name: 'סעיף כללי',
          group: 'כללי',
          fi: exp.fi_code || 'FI-GEN',
        };
        return {
          'Date opened': exp.date,
          'Vendor': exp.vendor,
          'מספר ספק': exp.vendor_number || '',
          'Cost': exp.amount,
          'חברה': exp.company || 'IDE Technologies',
          'Details': exp.details || '',
          'PO': exp.po_number || '',
          'PD': exp.pd_number || '',
          'הערות': exp.notes || '',
          'עוד הערות...': exp.extra_notes || '',
          'User': exp.user_name || '',
          'Status': exp.status || 'Approved',
          'Date approved': exp.date_approved || '',
          'קוד FI': item.fi,
          'שם סעיף': item.name,
          'קבוצה': item.group,
        };
      });
    }

    // 3. Budget Control Ledger (דוח בקרת תקציב למחלקת כספים)
    return budgetItems.map((item) => ({
      'קוד סעיף (FI)': item.fi_code,
      'שם סעיף תקציבי': item.name,
      'קבוצה / תחום': item.group,
      'תקציב חודשי ממוצע (₪)': item.monthly_budget,
      'תקציב שנתי מאושר (₪)': item.annual_budget || item.monthly_budget * 12,
      'תקציב לתקופה (₪)': item.adjusted_budget,
      'ביצוע בפועל (₪)': item.actual_spend,
      'יתרה לתקופה (₪)': item.remaining_balance,
      'אחוז ניצול': `${item.utilization_pct.toFixed(1)}%`,
      'סטטוס בריאות':
        item.status === 'over' ? 'חריגה' : item.status === 'warning' ? 'אזהרה' : 'תקין',
      'מספר הוצאות': item.expense_count,
    }));
  }, [template, scopedData, budgetItems, activeSite]);

  // Download Handler
  const handleDownload = () => {
    if (generatedRows.length === 0) {
      alert('אין נתונים לייצוא עבור הבחירה הנוכחית');
      return;
    }

    const baseName = `IDE_${template}_${scopedData.siteCode}_${new Date().toISOString().slice(0, 10)}`;

    if (fileFormat === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(generatedRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ERP Export');
      XLSX.writeFile(workbook, `${baseName}.xlsx`);
    } else if (fileFormat === 'csv') {
      // CSV with UTF-8 BOM so Excel opens Hebrew properly without garbled characters
      const worksheet = XLSX.utils.json_to_sheet(generatedRows);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (fileFormat === 'txt') {
      // Tab-delimited TXT
      const worksheet = XLSX.utils.json_to_sheet(generatedRows);
      const txtContent = XLSX.utils.sheet_to_txt(worksheet);
      const blob = new Blob(['\uFEFF' + txtContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  ייצוא מותאם למערכת ה-ERP והנהלת החשבונות
                </h2>
                <span className="bg-blue-500/30 text-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  SAP / Priority / ERP
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                הפקת פקודות יומן, קובצי חשבוניות ספקים ודוחות בקרה תקציבית בהתאמה לתקני חשבות IDE
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

        {/* Configuration Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Template Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                סוג תבנית ה-ERP:
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setTemplate('journal_entries')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    template === 'journal_entries'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>פקודות יומן (GL Entries)</span>
                  </div>
                  {template === 'journal_entries' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('invoices_erp')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    template === 'invoices_erp'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>חשבוניות ספקים (13 שדות)</span>
                  </div>
                  {template === 'invoices_erp' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('budget_control')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    template === 'budget_control'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>דוח ניצול ובקרה כספית</span>
                  </div>
                  {template === 'budget_control' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* 2. Scope Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                היקף המתחמים לייצוא:
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setExportScope('current')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    exportScope === 'current'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {activeSite === 'marlog' ? (
                      <Boxes className="w-4 h-4" />
                    ) : (
                      <Building2 className="w-4 h-4" />
                    )}
                    <span>מתחם נוכחי בלבד ({activeSite === 'marlog' ? 'מרלוג' : 'קדימה'})</span>
                  </div>
                  {exportScope === 'current' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('both')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    exportScope === 'both'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>ייצוא מאוחד (קדימה + מרלוג יחד)</span>
                  </div>
                  {exportScope === 'both' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* 3. File Format Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                פורמט וקידוד הקובץ:
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setFileFormat('xlsx')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    fileFormat === 'xlsx'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Microsoft Excel (.xlsx)</span>
                  </div>
                  {fileFormat === 'xlsx' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setFileFormat('csv')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    fileFormat === 'csv'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>CSV תואם ERP (UTF-8 עם BOM)</span>
                  </div>
                  {fileFormat === 'csv' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setFileFormat('txt')}
                  className={`w-full text-right p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    fileFormat === 'txt'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>קובץ טקסט מופרד טאב (.txt)</span>
                  </div>
                  {fileFormat === 'txt' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Live Preview Table Header */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>
              תצוגה מקדימה של הנתונים ({generatedRows.length} שורות מוכנות לייצוא):
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            מתחם: <strong>{scopedData.siteName}</strong> | תבנית:{' '}
            <strong>
              {template === 'journal_entries'
                ? 'פקודות יומן'
                : template === 'invoices_erp'
                ? 'חשבוניות ספקים'
                : 'בקרת תקציב'}
            </strong>
          </span>
        </div>

        {/* Live Preview Table Body */}
        <div className="p-6 overflow-y-auto flex-1 max-h-80">
          {generatedRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              אין שורות זמינות לייצוא
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10">
                  <tr>
                    {Object.keys(generatedRows[0] || {}).map((headerKey) => (
                      <th key={headerKey} className="py-2 px-3 whitespace-nowrap">
                        {headerKey}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedRows.slice(0, 50).map((row: any, rIdx: number) => (
                    <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.values(row).map((val: any, cIdx: number) => (
                        <td
                          key={cIdx}
                          className="py-2 px-3 whitespace-nowrap font-medium text-slate-800"
                        >
                          {typeof val === 'number' ? formatCurrency(val) : String(val ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            תואם תקני יומנים של SAP, Priority ומערכות ERP ארגוניות
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              ביטול
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>הורד קובץ ERP ({fileFormat.toUpperCase()})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

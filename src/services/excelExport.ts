import * as XLSX from 'xlsx';
import { BudgetItemCalculated, Expense, PeriodFilter } from '../types';

export function exportExpensesToExcel(
  expenses: Expense[],
  budgetItems: Record<string, { name: string; group: string }>,
  periodLabel: string
) {
  // Map rows matching the exact enterprise headers requested:
  // Date opened | Vendor | מספר ספק | Cost | חברה | Details | PO | PD | הערות | עוד הערות... | User | Status | Date approved
  const rows = expenses.map((exp) => {
    const item = budgetItems[exp.budget_item_id] || { name: 'סעיף כללי', group: 'אחר' };
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
      'קוד FI': exp.fi_code,
      'שם הסעיף': item.name,
      'קבוצה': item.group,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 14 }, // Date opened
    { wch: 25 }, // Vendor
    { wch: 14 }, // מספר ספק
    { wch: 14 }, // Cost
    { wch: 18 }, // חברה
    { wch: 30 }, // Details
    { wch: 14 }, // PO
    { wch: 14 }, // PD
    { wch: 25 }, // הערות
    { wch: 25 }, // עוד הערות...
    { wch: 16 }, // User
    { wch: 14 }, // Status
    { wch: 14 }, // Date approved
    { wch: 12 }, // קוד FI
    { wch: 28 }, // שם הסעיף
    { wch: 22 }, // קבוצה
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'יומן הוצאות');

  const fileName = `יומן_הוצאות_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportBudgetVsActualToExcel(
  items: BudgetItemCalculated[],
  periodLabel: string
) {
  const rows = items.map((item) => {
    const statusHebrew =
      item.status === 'over' ? 'חריגה' : item.status === 'warning' ? 'אזהרה' : 'תקין';
    return {
      'קוד FI': item.fi_code,
      'שם הסעיף': item.name,
      'קבוצה ראשית': item.group,
      'תקציב חודשי בסיס (₪)': item.monthly_budget,
      'תקציב מותאם לתקופה (₪)': item.adjusted_budget,
      'ביצוע בפועל (₪)': item.actual_spend,
      'יתרה נותרת (₪)': item.remaining_balance,
      'אחוז ניצול': `${item.utilization_pct.toFixed(1)}%`,
      'סטטוס': statusHebrew,
      'מספר תנועות': item.expense_count,
    };
  });

  // Calculate totals
  const totalBase = items.reduce((s, i) => s + i.monthly_budget, 0);
  const totalAdjusted = items.reduce((s, i) => s + i.adjusted_budget, 0);
  const totalActual = items.reduce((s, i) => s + i.actual_spend, 0);
  const totalRemaining = totalAdjusted - totalActual;
  const totalPct = totalAdjusted > 0 ? (totalActual / totalAdjusted) * 100 : 0;

  rows.push({
    'קוד FI': 'סה"כ כולל',
    'שם הסעיף': 'כלל סעיפי הארגון',
    'קבוצה ראשית': '—',
    'תקציב חודשי בסיס (₪)': totalBase,
    'תקציב מותאם לתקופה (₪)': totalAdjusted,
    'ביצוע בפועל (₪)': totalActual,
    'יתרה נותרת (₪)': totalRemaining,
    'אחוז ניצול': `${totalPct.toFixed(1)}%`,
    'סטטוס': totalPct > 100 ? 'חריגה כוללת' : totalPct >= 80 ? 'אזהרה' : 'תקין',
    'מספר תנועות': items.reduce((s, i) => s + i.expense_count, 0),
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 12 }, // קוד FI
    { wch: 35 }, // שם הסעיף
    { wch: 25 }, // קבוצה
    { wch: 20 }, // תקציב בסיס
    { wch: 22 }, // תקציב מותאם
    { wch: 18 }, // ביצוע בפועל
    { wch: 18 }, // יתרה נותרת
    { wch: 14 }, // אחוז ניצול
    { wch: 12 }, // סטטוס
    { wch: 14 }, // מספר תנועות
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'תקציב מול ביצוע');

  const fileName = `דוח_תקציב_מול_ביצוע_${periodLabel.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

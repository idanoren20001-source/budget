import {
  BudgetItem,
  BudgetItemCalculated,
  Expense,
  GroupSummary,
  OverallStats,
  PeriodFilter,
  HealthStatus,
  AnomalyAlert,
  PeriodForecast,
} from '../types';

export const HEBREW_MONTHS = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('he-IL').format(Math.round(amount));
}

export function getPeriodMultiplier(filter: PeriodFilter): number {
  switch (filter.type) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'annual':
      return 12;
    default:
      return 1;
  }
}

export function getPeriodLabel(filter: PeriodFilter): string {
  switch (filter.type) {
    case 'monthly': {
      const m = filter.month || 1;
      return `${HEBREW_MONTHS[m - 1]} ${filter.year}`;
    }
    case 'quarterly': {
      const q = filter.quarter || 1;
      return `רבעון ${q} (Q${q}) ${filter.year}`;
    }
    case 'annual':
      return `שנת ${filter.year}`;
    default:
      return `${filter.year}`;
  }
}

export function isExpenseInPeriod(expense: Expense, filter: PeriodFilter): boolean {
  if (!expense.date) return false;
  const [expYearStr, expMonthStr] = expense.date.split('-');
  const expYear = parseInt(expYearStr, 10);
  const expMonth = parseInt(expMonthStr, 10);

  if (expYear !== filter.year) return false;

  if (filter.type === 'monthly') {
    return expMonth === (filter.month || 1);
  }

  if (filter.type === 'quarterly') {
    const q = filter.quarter || 1;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    return expMonth >= startMonth && expMonth <= endMonth;
  }

  // annual
  return true;
}

export function calculateBudgetItems(
  items: BudgetItem[],
  expenses: Expense[],
  filter: PeriodFilter
): BudgetItemCalculated[] {
  const multiplier = getPeriodMultiplier(filter);
  const filteredExpenses = expenses.filter((e) => isExpenseInPeriod(e, filter));

  // Pre-aggregate expenses by budget_item_id
  const spendByItemId: Record<string, { total: number; count: number }> = {};
  filteredExpenses.forEach((exp) => {
    if (!spendByItemId[exp.budget_item_id]) {
      spendByItemId[exp.budget_item_id] = { total: 0, count: 0 };
    }
    spendByItemId[exp.budget_item_id].total += exp.amount;
    spendByItemId[exp.budget_item_id].count += 1;
  });

  return items.map((item) => {
    const hasBudgetOverride =
      item.manual_period_budget_override !== undefined &&
      item.manual_period_budget_override !== null;

    // Calculate base period budget dynamically based on period type
    let basePeriodBudget = item.monthly_budget * multiplier;
    if (filter.type === 'annual') {
      if (item.annual_budget !== undefined && item.annual_budget > 0) {
        basePeriodBudget = item.annual_budget;
      }
    } else if (filter.type === 'quarterly') {
      const q = filter.quarter || 1;
      const qKey = `q${q}` as 'q1' | 'q2' | 'q3' | 'q4';
      if (item.quarterly_budget?.[qKey] !== undefined && item.quarterly_budget[qKey] !== null) {
        basePeriodBudget = item.quarterly_budget[qKey]!;
      } else if (item.annual_budget !== undefined && item.annual_budget > 0) {
        basePeriodBudget = item.annual_budget / 4;
      }
    } else if (filter.type === 'monthly') {
      const m = filter.month || 1;
      if (item.monthly_breakdown?.[m] !== undefined && item.monthly_breakdown[m] !== null) {
        basePeriodBudget = item.monthly_breakdown[m]!;
      }
    }

    const adjusted_budget = hasBudgetOverride
      ? item.manual_period_budget_override!
      : basePeriodBudget;

    const hasActualOverride =
      item.manual_actual_override !== undefined &&
      item.manual_actual_override !== null;
    const agg = spendByItemId[item.id] || { total: 0, count: 0 };
    const actual_spend = hasActualOverride
      ? item.manual_actual_override!
      : agg.total;

    const remaining_balance = adjusted_budget - actual_spend;
    const utilization_pct =
      adjusted_budget > 0 ? (actual_spend / adjusted_budget) * 100 : 0;

    let status: HealthStatus = 'normal';
    if (utilization_pct > 100) {
      status = 'over';
    } else if (utilization_pct >= 80) {
      status = 'warning';
    }

    return {
      ...item,
      adjusted_budget,
      actual_spend,
      remaining_balance,
      utilization_pct,
      status,
      expense_count: agg.count,
      is_actual_overridden: hasActualOverride,
      is_budget_overridden: hasBudgetOverride,
    };
  });
}

export function calculateOverallStats(items: BudgetItemCalculated[]): OverallStats {
  let total_budget = 0;
  let total_spend = 0;
  let over_budget_items_count = 0;
  let over_budget_total_amount = 0;
  let warning_items_count = 0;
  let warning_remaining_amount = 0;
  let normal_items_count = 0;
  let normal_available_amount = 0;

  items.forEach((item) => {
    total_budget += item.adjusted_budget;
    total_spend += item.actual_spend;

    if (item.status === 'over') {
      over_budget_items_count += 1;
      over_budget_total_amount += item.actual_spend - item.adjusted_budget;
    } else if (item.status === 'warning') {
      warning_items_count += 1;
      warning_remaining_amount += Math.max(0, item.remaining_balance);
    } else {
      normal_items_count += 1;
      normal_available_amount += Math.max(0, item.remaining_balance);
    }
  });

  const total_remaining = total_budget - total_spend;
  const utilization_pct = total_budget > 0 ? (total_spend / total_budget) * 100 : 0;

  return {
    total_budget,
    total_spend,
    total_remaining,
    utilization_pct,
    over_budget_items_count,
    over_budget_total_amount,
    warning_items_count,
    warning_remaining_amount,
    normal_items_count,
    normal_available_amount,
  };
}

export function calculateGroupSummaries(items: BudgetItemCalculated[]): GroupSummary[] {
  const map: Record<string, GroupSummary> = {};

  items.forEach((item) => {
    if (!map[item.group]) {
      // Find FI prefix or default
      const prefixMatch = item.fi_code.match(/^FI-[0-9]{1}/);
      const fi_prefix = prefixMatch ? `${prefixMatch[0]}00` : 'FI';
      map[item.group] = {
        group: item.group,
        fi_prefix,
        total_budget: 0,
        total_spend: 0,
        remaining_balance: 0,
        utilization_pct: 0,
        item_count: 0,
        over_count: 0,
        warning_count: 0,
      };
    }

    const g = map[item.group];
    g.total_budget += item.adjusted_budget;
    g.total_spend += item.actual_spend;
    g.item_count += 1;
    if (item.status === 'over') g.over_count += 1;
    if (item.status === 'warning') g.warning_count += 1;
  });

  return Object.values(map).map((g) => {
    g.remaining_balance = g.total_budget - g.total_spend;
    g.utilization_pct = g.total_budget > 0 ? (g.total_spend / g.total_budget) * 100 : 0;
    return g;
  });
}

/**
 * Detects anomalies, duplicate payments, and sudden spikes in expenses.
 */
export function detectAnomalies(expenses: Expense[]): Map<string, AnomalyAlert[]> {
  const alertsMap = new Map<string, AnomalyAlert[]>();

  const addAlert = (expId: string, alert: AnomalyAlert) => {
    const existing = alertsMap.get(expId) || [];
    existing.push(alert);
    alertsMap.set(expId, existing);
  };

  // 1. Calculate average spend per vendor and per budget item
  const vendorTotals: Record<string, { total: number; count: number }> = {};
  expenses.forEach((e) => {
    const v = e.vendor.trim().toLowerCase();
    if (v) {
      if (!vendorTotals[v]) vendorTotals[v] = { total: 0, count: 0 };
      vendorTotals[v].total += e.amount;
      vendorTotals[v].count += 1;
    }
  });

  // 2. Scan for duplicates and spikes
  for (let i = 0; i < expenses.length; i++) {
    const expA = expenses[i];
    const vendorA = expA.vendor.trim().toLowerCase();
    const dateA = new Date(expA.date).getTime();

    // A. Check for potential duplicate with another expense
    for (let j = i + 1; j < expenses.length; j++) {
      const expB = expenses[j];
      const vendorB = expB.vendor.trim().toLowerCase();
      const dateB = new Date(expB.date).getTime();

      const daysDiff = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);

      // Same vendor, exact same amount, within 7 days
      if (
        vendorA &&
        vendorA === vendorB &&
        expA.amount === expB.amount &&
        daysDiff <= 7 &&
        expA.id !== expB.id
      ) {
        addAlert(expA.id, {
          id: `dup-${expA.id}-${expB.id}`,
          expenseId: expA.id,
          type: 'duplicate',
          severity: 'high',
          title: 'חשד לתשלום כפול',
          description: `נמצאה הוצאה זהה בסך ${formatCurrency(expA.amount)} לספק "${expA.vendor}" בתאריך ${expB.date} (הפרש של ${Math.round(daysDiff)} ימים).`,
          matchedExpenseId: expB.id,
        });

        addAlert(expB.id, {
          id: `dup-${expB.id}-${expA.id}`,
          expenseId: expB.id,
          type: 'duplicate',
          severity: 'high',
          title: 'חשד לתשלום כפול',
          description: `נמצאה הוצאה זהה בסך ${formatCurrency(expB.amount)} לספק "${expB.vendor}" בתאריך ${expA.date} (הפרש של ${Math.round(daysDiff)} ימים).`,
          matchedExpenseId: expA.id,
        });
      }
    }

    // B. Check for single expense spike (> 2.5x vendor average)
    if (vendorA && vendorTotals[vendorA] && vendorTotals[vendorA].count >= 3) {
      const avg = vendorTotals[vendorA].total / vendorTotals[vendorA].count;
      if (expA.amount >= 3000 && expA.amount > avg * 2.5) {
        addAlert(expA.id, {
          id: `spike-${expA.id}`,
          expenseId: expA.id,
          type: 'spike',
          severity: 'medium',
          title: 'קפיצה חריגה בסכום',
          description: `סכום ההוצאה (${formatCurrency(expA.amount)}) גבוה פי ${(expA.amount / avg).toFixed(1)} מהממוצע של ספק זה (${formatCurrency(avg)}).`,
        });
      }
    }

    // C. Missing reference on significant expense
    if (expA.amount >= 5000 && (!expA.ref_number || expA.ref_number.trim() === '')) {
      addAlert(expA.id, {
        id: `missing-ref-${expA.id}`,
        expenseId: expA.id,
        type: 'missing_ref',
        severity: 'medium',
        title: 'חסרה אסמכתא / חשבונית',
        description: `הוצאה משמעותית בסך ${formatCurrency(expA.amount)} נרשמה ללא מספר אסמכתא או חשבונית.`,
      });
    }
  }

  return alertsMap;
}

/**
 * Calculates Period Burn-Rate and Year-End/Period-End Forecast.
 */
export function calculatePeriodForecast(
  totalBudget: number,
  totalSpend: number,
  filter: PeriodFilter
): PeriodForecast {
  // Approximate days passed
  let totalDays = 30;
  let daysPassed = 21; // Default realistic simulation day within month

  if (filter.type === 'monthly') {
    const year = filter.year || 2026;
    const month = filter.month || 10;
    totalDays = new Date(year, month, 0).getDate();
    // If current calendar month matches, calculate days passed up to today
    const now = new Date();
    if (now.getFullYear() === year && now.getMonth() + 1 === month) {
      daysPassed = Math.max(1, Math.min(now.getDate(), totalDays));
    } else {
      daysPassed = Math.round(totalDays * 0.7);
    }
  } else if (filter.type === 'quarterly') {
    totalDays = 91;
    daysPassed = 65;
  } else if (filter.type === 'annual') {
    totalDays = 365;
    daysPassed = 295;
  }

  const percentTimePassed = Math.min(100, (daysPassed / totalDays) * 100);
  const dailyBurnRate = daysPassed > 0 ? totalSpend / daysPassed : 0;
  const projectedEndSpend = totalSpend + dailyBurnRate * (totalDays - daysPassed);
  const projectedVariance = totalBudget - projectedEndSpend;
  const isProjectedOver = projectedEndSpend > totalBudget;

  return {
    dailyBurnRate,
    projectedEndSpend,
    projectedVariance,
    isProjectedOver,
    daysPassed,
    totalDays,
    percentTimePassed,
  };
}

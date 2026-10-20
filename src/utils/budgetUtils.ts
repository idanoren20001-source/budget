import {
  BudgetItem,
  BudgetItemCalculated,
  Expense,
  GroupSummary,
  OverallStats,
  PeriodFilter,
  HealthStatus,
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
    const adjusted_budget = hasBudgetOverride
      ? item.manual_period_budget_override!
      : item.monthly_budget * multiplier;

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

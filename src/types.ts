export interface BudgetItem {
  id: string;
  fi_code: string;
  name: string;
  group: string;
  monthly_budget: number;
  manual_actual_override?: number | null; // Direct manual edit of actual spend
  manual_period_budget_override?: number | null; // Direct manual edit of period budget
  updated_at: string;
}

export interface Expense {
  id: string;
  budget_item_id: string;
  fi_code: string;
  date: string; // YYYY-MM-DD
  amount: number;
  vendor: string;
  ref_number: string;
  notes?: string;
  created_at: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_data?: string; // Base64 data URL
}

export type AnomalyType = 'duplicate' | 'spike' | 'missing_ref';

export interface AnomalyAlert {
  id: string;
  expenseId: string;
  type: AnomalyType;
  severity: 'high' | 'medium';
  title: string;
  description: string;
  matchedExpenseId?: string;
}

export interface PeriodForecast {
  dailyBurnRate: number;
  projectedEndSpend: number;
  projectedVariance: number;
  isProjectedOver: boolean;
  daysPassed: number;
  totalDays: number;
  percentTimePassed: number;
}

export type AppTab = 'dashboard' | 'expenses' | 'audit' | 'chat';

export type PeriodType = 'monthly' | 'quarterly' | 'annual';

export interface PeriodFilter {
  type: PeriodType;
  year: number;
  month?: number; // 1-12
  quarter?: number; // 1-4
}

export type HealthStatus = 'over' | 'warning' | 'normal';

export interface BudgetItemCalculated extends BudgetItem {
  adjusted_budget: number;
  actual_spend: number;
  remaining_balance: number;
  utilization_pct: number;
  status: HealthStatus;
  expense_count: number;
  is_actual_overridden?: boolean;
  is_budget_overridden?: boolean;
}

export interface GroupSummary {
  group: string;
  fi_prefix: string;
  total_budget: number;
  total_spend: number;
  remaining_balance: number;
  utilization_pct: number;
  item_count: number;
  over_count: number;
  warning_count: number;
}

export interface OverallStats {
  total_budget: number;
  total_spend: number;
  total_remaining: number;
  utilization_pct: number;
  over_budget_items_count: number;
  over_budget_total_amount: number;
  warning_items_count: number;
  warning_remaining_amount: number;
  normal_items_count: number;
  normal_available_amount: number;
}

export interface CloudConfig {
  provider: 'local' | 'supabase' | 'firebase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  firebaseConfig?: string;
  lastSyncedAt?: string;
  isOnline: boolean;
}

export type AuditActionType =
  | 'budget_update'
  | 'expense_create'
  | 'expense_update'
  | 'expense_delete'
  | 'item_create'
  | 'item_delete'
  | 'system_restore';

export interface AuditLog {
  id: string;
  timestamp: string;
  action_type: AuditActionType;
  entity_name: string;
  fi_code?: string;
  details: string;
  user?: string;
}

export interface DatabasePayload {
  budgetItems: BudgetItem[];
  expenses: Expense[];
  auditLogs: AuditLog[];
  version: number;
  lastModified: string;
}


import { BudgetItem, Expense, CloudConfig, AuditLog, DatabasePayload, AuditActionType } from '../types';
import { INITIAL_BUDGET_ITEMS, INITIAL_EXPENSES } from '../data/initialData';

const BUDGET_ITEMS_KEY = 'agy_budget_control_items_v3';
const EXPENSES_KEY = 'agy_budget_control_expenses_v3';
const AUDIT_LOGS_KEY = 'agy_budget_control_audit_v3';
const CLOUD_CONFIG_KEY = 'agy_budget_control_cloud_v3';
const CHANNEL_NAME = 'agy_budget_control_realtime_channel_v3';

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-01',
    timestamp: '2026-10-18T10:00:00Z',
    action_type: 'expense_create',
    entity_name: 'כביש 6',
    fi_code: 'FI-705',
    details: 'נרשמה הוצאה חדשה: 9,800 ₪ (ספק: דרך ארץ הייווי בע"מ, אסמכתא: KV-6-1026)',
    user: 'מנהל תקציב',
  },
  {
    id: 'audit-02',
    timestamp: '2026-10-16T16:45:00Z',
    action_type: 'expense_create',
    entity_name: 'סלופארק לב השרון',
    fi_code: 'FI-709',
    details: 'נרשמה הוצאה חדשה: 17,200 ₪ (ספק: סלופארק טכנולוגיות, אסמכתא: CP-2026-10) — חריגה מתקציב בסיס',
    user: 'מנהל רכב',
  },
  {
    id: 'audit-03',
    timestamp: '2026-10-15T14:10:00Z',
    action_type: 'expense_create',
    entity_name: 'דלק וסונול',
    fi_code: 'FI-701',
    details: 'נרשמה הוצאה חדשה: 36,400 ₪ (ספק: סונול ישראל)',
    user: 'רכש ותפעול',
  },
  {
    id: 'audit-04',
    timestamp: '2026-10-01T00:00:00Z',
    action_type: 'budget_update',
    entity_name: 'כלל הסעיפים',
    details: 'הגדרת תקציבי בסיס לשנת 2026 (82 סעיפי FI מובנים)',
    user: 'מערכת מרכזית',
  },
];

let currentLocalVersion = 1;
let isSaving = false;

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

// ----------------- Synchronous Local Cache Read/Write -----------------

export function getStoredBudgetItems(): BudgetItem[] {
  try {
    const raw = localStorage.getItem(BUDGET_ITEMS_KEY);
    if (!raw) return INITIAL_BUDGET_ITEMS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BUDGET_ITEMS;
  } catch (err) {
    return INITIAL_BUDGET_ITEMS;
  }
}

export function saveBudgetItems(items: BudgetItem[], syncServer = true): void {
  try {
    localStorage.setItem(BUDGET_ITEMS_KEY, JSON.stringify(items));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'BUDGET_ITEMS_UPDATED', timestamp: Date.now() });
    }
    if (syncServer) {
      syncToServer();
    }
  } catch (err) {
    console.error('Error saving budget items:', err);
  }
}

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) return INITIAL_EXPENSES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_EXPENSES;
  } catch (err) {
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: Expense[], syncServer = true): void {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'EXPENSES_UPDATED', timestamp: Date.now() });
    }
    if (syncServer) {
      syncToServer();
    }
  } catch (err) {
    console.error('Error saving expenses:', err);
  }
}

export function getStoredAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) return INITIAL_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch (err) {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveAuditLogs(logs: AuditLog[], syncServer = true): void {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'AUDIT_LOGS_UPDATED', timestamp: Date.now() });
    }
    if (syncServer) {
      syncToServer();
    }
  } catch (err) {
    console.error('Error saving audit logs:', err);
  }
}

export function logAuditEvent(
  action_type: AuditActionType,
  entity_name: string,
  details: string,
  fi_code?: string
): void {
  const currentLogs = getStoredAuditLogs();
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action_type,
    entity_name,
    fi_code,
    details,
    user: 'מנהל / משתמש',
  };
  saveAuditLogs([newLog, ...currentLogs], true);
}

export function getStoredCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (!raw) return { provider: 'local', isOnline: navigator.onLine };
    return JSON.parse(raw);
  } catch (err) {
    return { provider: 'local', isOnline: navigator.onLine };
  }
}

export function saveCloudConfig(config: CloudConfig): void {
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving cloud config:', err);
  }
}

export function resetToDefaults(): void {
  saveBudgetItems(INITIAL_BUDGET_ITEMS, false);
  saveExpenses(INITIAL_EXPENSES, false);
  saveAuditLogs(INITIAL_AUDIT_LOGS, false);
  logAuditEvent('system_restore', 'כלל המערכת', 'איפוס מלא של נתוני המערכת לברירת המחדל המקורית');
  syncToServer();
}

// ----------------- Central Server Synchronization (Cross-Device) -----------------

export async function syncToServer(): Promise<void> {
  if (isSaving) return;
  isSaving = true;
  try {
    const payload: DatabasePayload = {
      budgetItems: getStoredBudgetItems(),
      expenses: getStoredExpenses(),
      auditLogs: getStoredAuditLogs(),
      version: currentLocalVersion,
      lastModified: new Date().toISOString(),
    };

    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.version) {
        currentLocalVersion = result.version;
      }
    }
  } catch (err) {
    // Offline or server not responding, quiet fallback
  } finally {
    isSaving = false;
  }
}

/**
 * Initializes the client by fetching central server data first.
 * If another computer updated data, this ensures Computer B immediately gets it.
 */
export async function initializeStorageFromServer(): Promise<{
  budgetItems: BudgetItem[];
  expenses: Expense[];
  auditLogs: AuditLog[];
}> {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      if (data && data.budgetItems && Array.isArray(data.budgetItems) && data.budgetItems.length > 0) {
        currentLocalVersion = data.version || 1;
        localStorage.setItem(BUDGET_ITEMS_KEY, JSON.stringify(data.budgetItems));
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(data.expenses || []));
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(data.auditLogs || []));
        return {
          budgetItems: data.budgetItems,
          expenses: data.expenses || [],
          auditLogs: data.auditLogs || [],
        };
      }
    }
  } catch (e) {
    console.warn('Could not fetch server data on startup, using local cache', e);
  }

  // Fallback to local storage or defaults
  const budgetItems = getStoredBudgetItems();
  const expenses = getStoredExpenses();
  const auditLogs = getStoredAuditLogs();

  // If local storage has data but server was empty, push local data to server
  syncToServer();

  return { budgetItems, expenses, auditLogs };
}

let isServerAvailable = true;

// Periodic Server Polling Heartbeat for Multi-PC sync
export function startServerHeartbeat(onRemoteUpdate: (data: DatabasePayload) => void): () => void {
  const interval = setInterval(async () => {
    if (!isServerAvailable) return;
    try {
      const res = await fetch('/api/data');
      if (res.status === 404) {
        // Static hosting like Netlify Drop without server functions
        isServerAvailable = false;
        return;
      }
      if (!res.ok) return;
      const data = await res.json();

      if (data && data.version && data.version > currentLocalVersion) {
        currentLocalVersion = data.version;
        // Central server has newer data from another computer!
        localStorage.setItem(BUDGET_ITEMS_KEY, JSON.stringify(data.budgetItems));
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(data.expenses || []));
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(data.auditLogs || []));
        onRemoteUpdate(data);

        if (broadcastChannel) {
          broadcastChannel.postMessage({ type: 'REMOTE_SYNC_UPDATE', timestamp: Date.now() });
        }
      }
    } catch (e) {
      // Ignore network errors during heartbeat
    }
  }, 1500);

  return () => clearInterval(interval);
}

// ----------------- Cross-Tab & Storage Listener -----------------

export function subscribeToSync(onSync: () => void): () => void {
  const handleBroadcast = () => {
    onSync();
  };

  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === BUDGET_ITEMS_KEY ||
      e.key === EXPENSES_KEY ||
      e.key === AUDIT_LOGS_KEY ||
      e.key === CLOUD_CONFIG_KEY
    ) {
      onSync();
    }
  };

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
}

// ----------------- Backup & Restore Snapshot Helpers -----------------

export function createFullBackupSnapshot(): string {
  const snapshot: DatabasePayload = {
    budgetItems: getStoredBudgetItems(),
    expenses: getStoredExpenses(),
    auditLogs: getStoredAuditLogs(),
    version: currentLocalVersion + 1,
    lastModified: new Date().toISOString(),
  };
  return JSON.stringify(snapshot, null, 2);
}

export function restoreFromSnapshot(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.budgetItems || !Array.isArray(parsed.budgetItems)) {
      throw new Error('קובץ הגיבוי אינו תקין: חסרים סעיפי תקציב');
    }
    saveBudgetItems(parsed.budgetItems, false);
    saveExpenses(parsed.expenses || [], false);
    saveAuditLogs(parsed.auditLogs || [], false);
    logAuditEvent(
      'system_restore',
      'שחזור מקובץ',
      `שוחזרו בהצלחה ${parsed.budgetItems.length} סעיפים ו-${(parsed.expenses || []).length} הוצאות`
    );
    syncToServer();
    return true;
  } catch (err: any) {
    alert(`שגיאה בטעינת קובץ גיבוי: ${err.message}`);
    return false;
  }
}

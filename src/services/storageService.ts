import { BudgetItem, Expense, CloudConfig, AuditLog, DatabasePayload, AuditActionType, SiteId, SiteData } from '../types';
import {
  INITIAL_BUDGET_ITEMS_KADIMA,
  INITIAL_BUDGET_ITEMS_MARLOG,
  INITIAL_EXPENSES,
} from '../data/initialData';

const BUDGET_ITEMS_KEY_KADIMA = 'agy_budget_control_items_kadima_v1';
const BUDGET_ITEMS_KEY_MARLOG = 'agy_budget_control_items_marlog_v1';
const EXPENSES_KEY_KADIMA = 'agy_budget_control_expenses_kadima_v1';
const EXPENSES_KEY_MARLOG = 'agy_budget_control_expenses_marlog_v1';
const AUDIT_LOGS_KEY_KADIMA = 'agy_budget_control_audit_kadima_v1';
const AUDIT_LOGS_KEY_MARLOG = 'agy_budget_control_audit_marlog_v1';

const CLOUD_CONFIG_KEY = 'agy_budget_control_cloud_v3';
const CHANNEL_NAME = 'agy_budget_control_realtime_channel_v3';
const AUTH_KEY = 'ide_auth_token';
const ACTIVE_SITE_KEY = 'ide_active_site';

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-01',
    timestamp: '2026-10-21T09:00:00Z',
    action_type: 'system_restore',
    entity_name: 'מערכת מרכזית',
    details: 'אתחול מערכת בקרת תקציב IDE Technologies — מוכנה לקליטת נתונים',
    user: 'מנהל מערכת',
  },
];

let currentLocalVersion = 100;
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

// ----------------- Auth & Active Site -----------------

export function checkIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

export function setAuthenticated(val: boolean): void {
  if (typeof window === 'undefined') return;
  if (val) {
    sessionStorage.setItem(AUTH_KEY, 'true');
  } else {
    sessionStorage.removeItem(AUTH_KEY);
  }
}

export function getActiveSiteFromStorage(): SiteId | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(ACTIVE_SITE_KEY);
  return stored === 'kadima' || stored === 'marlog' ? stored : null;
}

export function saveActiveSiteToStorage(site: SiteId | null): void {
  if (typeof window === 'undefined') return;
  if (site) {
    localStorage.setItem(ACTIVE_SITE_KEY, site);
  } else {
    localStorage.removeItem(ACTIVE_SITE_KEY);
  }
}

// ----------------- Helpers for site keys -----------------

function getBudgetItemsKey(site: SiteId): string {
  return site === 'marlog' ? BUDGET_ITEMS_KEY_MARLOG : BUDGET_ITEMS_KEY_KADIMA;
}

function getExpensesKey(site: SiteId): string {
  return site === 'marlog' ? EXPENSES_KEY_MARLOG : EXPENSES_KEY_KADIMA;
}

function getAuditLogsKey(site: SiteId): string {
  return site === 'marlog' ? AUDIT_LOGS_KEY_MARLOG : AUDIT_LOGS_KEY_KADIMA;
}

function getDefaultBudgetItems(site: SiteId): BudgetItem[] {
  return site === 'marlog' ? INITIAL_BUDGET_ITEMS_MARLOG : INITIAL_BUDGET_ITEMS_KADIMA;
}

// ----------------- Local Cache Read/Write per Site -----------------

export function getStoredBudgetItems(site: SiteId = 'kadima'): BudgetItem[] {
  try {
    const key = getBudgetItemsKey(site);
    const raw = localStorage.getItem(key);
    if (!raw) return getDefaultBudgetItems(site);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultBudgetItems(site);
  } catch (err) {
    return getDefaultBudgetItems(site);
  }
}

export function saveBudgetItems(items: BudgetItem[], site: SiteId = 'kadima', syncServer = true): void {
  try {
    const key = getBudgetItemsKey(site);
    localStorage.setItem(key, JSON.stringify(items));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'BUDGET_ITEMS_UPDATED', site, timestamp: Date.now() });
    }
    if (syncServer) {
      syncToServer();
    }
  } catch (err) {
    console.error('Error saving budget items:', err);
  }
}

export function getStoredExpenses(site: SiteId = 'kadima'): Expense[] {
  try {
    const key = getExpensesKey(site);
    const raw = localStorage.getItem(key);
    if (!raw) return INITIAL_EXPENSES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_EXPENSES;
  } catch (err) {
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: Expense[], site: SiteId = 'kadima', syncServer = true): void {
  try {
    const key = getExpensesKey(site);
    localStorage.setItem(key, JSON.stringify(expenses));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'EXPENSES_UPDATED', site, timestamp: Date.now() });
    }
    if (syncServer) {
      syncToServer();
    }
  } catch (err) {
    console.error('Error saving expenses:', err);
  }
}

export function getStoredAuditLogs(site: SiteId = 'kadima'): AuditLog[] {
  try {
    const key = getAuditLogsKey(site);
    const raw = localStorage.getItem(key);
    if (!raw) return INITIAL_AUDIT_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_AUDIT_LOGS;
  } catch (err) {
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveAuditLogs(logs: AuditLog[], site: SiteId = 'kadima', syncServer = true): void {
  try {
    const key = getAuditLogsKey(site);
    localStorage.setItem(key, JSON.stringify(logs));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'AUDIT_LOGS_UPDATED', site, timestamp: Date.now() });
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
  fi_code?: string,
  site: SiteId = 'kadima'
): void {
  const currentLogs = getStoredAuditLogs(site);
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action_type,
    entity_name,
    fi_code,
    details,
    user: 'מנהל / משתמש',
  };
  saveAuditLogs([newLog, ...currentLogs], site, true);
}

export function getStoredCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (!raw) return { provider: 'local', isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true };
    return JSON.parse(raw);
  } catch (err) {
    return { provider: 'local', isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true };
  }
}

export function saveCloudConfig(config: CloudConfig): void {
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving cloud config:', err);
  }
}

// ----------------- Central Server Synchronization (Cross-Device) -----------------

export async function syncToServer(): Promise<void> {
  if (isSaving) return;
  isSaving = true;
  try {
    const kadimaItems = getStoredBudgetItems('kadima');
    const kadimaExpenses = getStoredExpenses('kadima');
    const kadimaLogs = getStoredAuditLogs('kadima');

    const marlogItems = getStoredBudgetItems('marlog');
    const marlogExpenses = getStoredExpenses('marlog');
    const marlogLogs = getStoredAuditLogs('marlog');

    const payload: DatabasePayload = {
      sites: {
        kadima: {
          budgetItems: kadimaItems,
          expenses: kadimaExpenses,
          auditLogs: kadimaLogs,
        },
        marlog: {
          budgetItems: marlogItems,
          expenses: marlogExpenses,
          auditLogs: marlogLogs,
        },
      },
      // Backward-compatibility mirror for Kadima
      budgetItems: kadimaItems,
      expenses: kadimaExpenses,
      auditLogs: kadimaLogs,
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

export async function initializeStorageFromServer(): Promise<{
  sites: Record<SiteId, SiteData>;
}> {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const data = await res.json();
      if (data && (data.sites || data.budgetItems)) {
        currentLocalVersion = data.version || 100;

        let kadimaData: SiteData;
        let marlogData: SiteData;

        if (data.sites?.kadima) {
          kadimaData = {
            budgetItems: data.sites.kadima.budgetItems || getDefaultBudgetItems('kadima'),
            expenses: data.sites.kadima.expenses || [],
            auditLogs: data.sites.kadima.auditLogs || INITIAL_AUDIT_LOGS,
          };
        } else {
          kadimaData = {
            budgetItems: data.budgetItems || getDefaultBudgetItems('kadima'),
            expenses: data.expenses || [],
            auditLogs: data.auditLogs || INITIAL_AUDIT_LOGS,
          };
        }

        if (data.sites?.marlog) {
          marlogData = {
            budgetItems: data.sites.marlog.budgetItems || getDefaultBudgetItems('marlog'),
            expenses: data.sites.marlog.expenses || [],
            auditLogs: data.sites.marlog.auditLogs || INITIAL_AUDIT_LOGS,
          };
        } else {
          marlogData = {
            budgetItems: getStoredBudgetItems('marlog'),
            expenses: getStoredExpenses('marlog'),
            auditLogs: getStoredAuditLogs('marlog'),
          };
        }

        // Cache locally
        localStorage.setItem(BUDGET_ITEMS_KEY_KADIMA, JSON.stringify(kadimaData.budgetItems));
        localStorage.setItem(EXPENSES_KEY_KADIMA, JSON.stringify(kadimaData.expenses));
        localStorage.setItem(AUDIT_LOGS_KEY_KADIMA, JSON.stringify(kadimaData.auditLogs));

        localStorage.setItem(BUDGET_ITEMS_KEY_MARLOG, JSON.stringify(marlogData.budgetItems));
        localStorage.setItem(EXPENSES_KEY_MARLOG, JSON.stringify(marlogData.expenses));
        localStorage.setItem(AUDIT_LOGS_KEY_MARLOG, JSON.stringify(marlogData.auditLogs));

        return {
          sites: {
            kadima: kadimaData,
            marlog: marlogData,
          },
        };
      }
    }
  } catch (e) {
    console.warn('Could not fetch server data on startup, using local cache', e);
  }

  // Fallback to local
  const kadimaData: SiteData = {
    budgetItems: getStoredBudgetItems('kadima'),
    expenses: getStoredExpenses('kadima'),
    auditLogs: getStoredAuditLogs('kadima'),
  };

  const marlogData: SiteData = {
    budgetItems: getStoredBudgetItems('marlog'),
    expenses: getStoredExpenses('marlog'),
    auditLogs: getStoredAuditLogs('marlog'),
  };

  syncToServer();

  return {
    sites: {
      kadima: kadimaData,
      marlog: marlogData,
    },
  };
}

let isServerAvailable = true;

// Periodic Server Polling Heartbeat for Multi-PC sync
export function startServerHeartbeat(onRemoteUpdate: (data: DatabasePayload) => void): () => void {
  const interval = setInterval(async () => {
    if (!isServerAvailable) return;
    try {
      const res = await fetch('/api/data');
      if (res.status === 404) {
        isServerAvailable = false;
        return;
      }
      if (!res.ok) return;
      const data = await res.json();

      if (data && data.version && data.version > currentLocalVersion) {
        currentLocalVersion = data.version;

        if (data.sites?.kadima) {
          localStorage.setItem(BUDGET_ITEMS_KEY_KADIMA, JSON.stringify(data.sites.kadima.budgetItems));
          localStorage.setItem(EXPENSES_KEY_KADIMA, JSON.stringify(data.sites.kadima.expenses || []));
          localStorage.setItem(AUDIT_LOGS_KEY_KADIMA, JSON.stringify(data.sites.kadima.auditLogs || []));
        }
        if (data.sites?.marlog) {
          localStorage.setItem(BUDGET_ITEMS_KEY_MARLOG, JSON.stringify(data.sites.marlog.budgetItems));
          localStorage.setItem(EXPENSES_KEY_MARLOG, JSON.stringify(data.sites.marlog.expenses || []));
          localStorage.setItem(AUDIT_LOGS_KEY_MARLOG, JSON.stringify(data.sites.marlog.auditLogs || []));
        }

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

// ----------------- Backup & Restore Snapshot Helpers -----------------

export function resetToDefaults(site: SiteId = 'kadima'): void {
  saveBudgetItems(getDefaultBudgetItems(site), site, false);
  saveExpenses([], site, false);
  saveAuditLogs(INITIAL_AUDIT_LOGS, site, false);
  logAuditEvent('system_restore', 'כלל המערכת', 'איפוס מלא של נתוני המערכת לברירת המחדל המקורית', undefined, site);
  syncToServer();
}

export function createFullBackupSnapshot(): string {
  const snapshot: DatabasePayload = {
    sites: {
      kadima: {
        budgetItems: getStoredBudgetItems('kadima'),
        expenses: getStoredExpenses('kadima'),
        auditLogs: getStoredAuditLogs('kadima'),
      },
      marlog: {
        budgetItems: getStoredBudgetItems('marlog'),
        expenses: getStoredExpenses('marlog'),
        auditLogs: getStoredAuditLogs('marlog'),
      },
    },
    budgetItems: getStoredBudgetItems('kadima'),
    expenses: getStoredExpenses('kadima'),
    auditLogs: getStoredAuditLogs('kadima'),
    version: currentLocalVersion + 1,
    lastModified: new Date().toISOString(),
  };
  return JSON.stringify(snapshot, null, 2);
}

export function restoreFromSnapshot(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.sites?.kadima && parsed.sites?.marlog) {
      saveBudgetItems(parsed.sites.kadima.budgetItems || [], 'kadima', false);
      saveExpenses(parsed.sites.kadima.expenses || [], 'kadima', false);
      saveAuditLogs(parsed.sites.kadima.auditLogs || [], 'kadima', false);

      saveBudgetItems(parsed.sites.marlog.budgetItems || [], 'marlog', false);
      saveExpenses(parsed.sites.marlog.expenses || [], 'marlog', false);
      saveAuditLogs(parsed.sites.marlog.auditLogs || [], 'marlog', false);
    } else if (parsed.budgetItems && Array.isArray(parsed.budgetItems)) {
      saveBudgetItems(parsed.budgetItems, 'kadima', false);
      saveExpenses(parsed.expenses || [], 'kadima', false);
      saveAuditLogs(parsed.auditLogs || [], 'kadima', false);
    } else {
      throw new Error('קובץ הגיבוי אינו תקין: חסרים סעיפי תקציב');
    }
    logAuditEvent(
      'system_restore',
      'שחזור מקובץ',
      'שוחזרו בהצלחה נתוני תקציב והוצאות מקובץ גיבוי'
    );
    syncToServer();
    return true;
  } catch (err: any) {
    alert(`שגיאה בטעינת קובץ גיבוי: ${err.message}`);
    return false;
  }
}


export function subscribeToSync(onSync: () => void): () => void {
  const handleBroadcast = () => {
    onSync();
  };

  const handleStorage = (e: StorageEvent) => {
    if (
      e.key?.includes('agy_budget_control') ||
      e.key === CLOUD_CONFIG_KEY ||
      e.key === ACTIVE_SITE_KEY
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

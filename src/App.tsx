import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { PeriodSelector } from './components/PeriodSelector';
import { HealthAlerts } from './components/HealthAlerts';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { BudgetTable } from './components/BudgetTable';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetManagerModal } from './components/BudgetManagerModal';
import { ExpensesLogTable } from './components/ExpensesLogTable';
import { CloudSettingsModal } from './components/CloudSettingsModal';
import { ItemDrawer } from './components/ItemDrawer';
import { AuditTrailTable } from './components/AuditTrailTable';
import { BackupModal } from './components/BackupModal';
import { SmartBudgetChat } from './components/SmartBudgetChat';
import { SmartAssistantWorkspace } from './components/SmartAssistantWorkspace';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { BudgetExcelImportModal } from './components/BudgetExcelImportModal';
import { LoginScreen } from './components/LoginScreen';
import { SiteSelectionScreen } from './components/SiteSelectionScreen';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

import {
  BudgetItem,
  Expense,
  PeriodFilter,
  HealthStatus,
  BudgetItemCalculated,
  AuditLog,
  AppTab,
  SiteId,
} from './types';
import {
  getStoredBudgetItems,
  saveBudgetItems,
  getStoredExpenses,
  saveExpenses,
  getStoredAuditLogs,
  saveAuditLogs,
  logAuditEvent,
  subscribeToSync,
  startServerHeartbeat,
  initializeStorageFromServer,
  checkIsAuthenticated,
  setAuthenticated,
  getActiveSiteFromStorage,
  saveActiveSiteToStorage,
} from './services/storageService';
import {
  calculateBudgetItems,
  calculateOverallStats,
  calculateGroupSummaries,
  getPeriodLabel,
  isExpenseInPeriod,
  formatCurrency,
} from './utils/budgetUtils';
import {
  exportExpensesToExcel,
  exportBudgetVsActualToExcel,
} from './services/excelExport';

export function App() {
  // --- Auth & Facility State ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => checkIsAuthenticated());
  const [activeSite, setActiveSite] = useState<SiteId | null>(() => getActiveSiteFromStorage());
  const currentSite: SiteId = activeSite || 'kadima';

  // --- Core State per Site ---
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() =>
    getStoredBudgetItems(currentSite)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    getStoredExpenses(currentSite)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getStoredAuditLogs(currentSite)
  );

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  // When activeSite changes, reload that site's data immediately
  useEffect(() => {
    if (activeSite) {
      setBudgetItems(getStoredBudgetItems(activeSite));
      setExpenses(getStoredExpenses(activeSite));
      setAuditLogs(getStoredAuditLogs(activeSite));
    }
  }, [activeSite]);

  // Period Filter: default to current period (October 2026)
  const [filter, setFilter] = useState<PeriodFilter>({
    type: 'monthly',
    year: 2026,
    month: 10,
  });

  // Traffic Light Status Filter (over, warning, normal, or null for all)
  const [statusFilter, setStatusFilter] = useState<HealthStatus | null>(null);

  // Navigation tab: 'dashboard' | 'expenses' | 'audit' | 'chat'
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Modals & Drawer state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [preselectedItemId, setPreselectedItemId] = useState<string | null>(null);
  const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState(false);
  const [isCloudSettingsOpen, setIsCloudSettingsOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isBudgetExcelImportOpen, setIsBudgetExcelImportOpen] = useState(false);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
  const [selectedDrawerItem, setSelectedDrawerItem] = useState<BudgetItemCalculated | null>(null);

  // Smart Budget Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --- Real-time Sync & Multi-PC Heartbeat ---
  useEffect(() => {
    // 0. Initial load from central server
    initializeStorageFromServer().then((data) => {
      const site = getActiveSiteFromStorage() || 'kadima';
      if (data?.sites?.[site]) {
        setBudgetItems(data.sites[site].budgetItems);
        setExpenses(data.sites[site].expenses);
        setAuditLogs(data.sites[site].auditLogs);
      }
    });

    // 1. Cross-Tab Broadcast listener
    const unsubscribeBroadcast = subscribeToSync(() => {
      const site = getActiveSiteFromStorage() || 'kadima';
      setBudgetItems(getStoredBudgetItems(site));
      setExpenses(getStoredExpenses(site));
      setAuditLogs(getStoredAuditLogs(site));
    });

    // 2. Central Server Heartbeat (fetches from other computers every 1.5s)
    const unsubscribeHeartbeat = startServerHeartbeat((remoteData) => {
      const site = getActiveSiteFromStorage() || 'kadima';
      if (remoteData?.sites?.[site]) {
        setBudgetItems(remoteData.sites[site].budgetItems);
        setExpenses(remoteData.sites[site].expenses);
        setAuditLogs(remoteData.sites[site].auditLogs);
      }
    });

    return () => {
      unsubscribeBroadcast();
      unsubscribeHeartbeat();
    };
  }, [activeSite]);

  // --- Global Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'N' or 'Ctrl+N' to open New Expense (if not typing in input)
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        setPreselectedItemId(null);
        setIsExpenseModalOpen(true);
      }
      // 'Escape' closes any open modal/drawer
      if (e.key === 'Escape') {
        setIsExpenseModalOpen(false);
        setIsBudgetManagerOpen(false);
        setIsCloudSettingsOpen(false);
        setIsBackupModalOpen(false);
        setIsExcelImportOpen(false);
        setIsBudgetExcelImportOpen(false);
        setSelectedDrawerItem(null);
        setIsChatOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Calculations ---
  const calculatedItems = useMemo(() => {
    return calculateBudgetItems(budgetItems, expenses, filter);
  }, [budgetItems, expenses, filter]);

  const stats = useMemo(() => {
    return calculateOverallStats(calculatedItems);
  }, [calculatedItems]);

  const groupSummaries = useMemo(() => {
    return calculateGroupSummaries(calculatedItems);
  }, [calculatedItems]);

  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => isExpenseInPeriod(e, filter));
  }, [expenses, filter]);

  const periodLabel = useMemo(() => {
    return getPeriodLabel(filter);
  }, [filter]);

  // Keep selected drawer item in sync with updated calculations
  const activeDrawerItem = useMemo(() => {
    if (!selectedDrawerItem) return null;
    return calculatedItems.find((i) => i.id === selectedDrawerItem.id) || null;
  }, [selectedDrawerItem, calculatedItems]);

  // --- Actions with Full Audit Logging ---

  // Add new expense
  const handleSaveExpense = useCallback(
    (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
      const newExp: Expense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
      };
      const updated = [newExp, ...expenses];
      setExpenses(updated);
      saveExpenses(updated, currentSite, true);

      // Audit log
      const item = budgetItems.find((b) => b.id === expenseData.budget_item_id);
      logAuditEvent(
        'expense_create',
        item ? item.name : 'הוצאה',
        `נרשמה הוצאה חדשה: ${formatCurrency(expenseData.amount)} לספק "${expenseData.vendor}" (אסמכתא: ${expenseData.ref_number})`,
        expenseData.fi_code,
        currentSite
      );
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [expenses, budgetItems, currentSite]
  );

  // Update existing expense
  const handleUpdateExpense = useCallback(
    (updatedExp: Expense) => {
      const prevExp = expenses.find((e) => e.id === updatedExp.id);
      const updated = expenses.map((e) =>
        e.id === updatedExp.id ? updatedExp : e
      );
      setExpenses(updated);
      saveExpenses(updated, currentSite, true);

      // Audit log
      logAuditEvent(
        'expense_update',
        `הוצאה ${updatedExp.fi_code}`,
        `עודכנה הוצאה: סכום ${formatCurrency(updatedExp.amount)} (לפני כן: ${prevExp ? formatCurrency(prevExp.amount) : '—'}), ספק: "${updatedExp.vendor}"`,
        updatedExp.fi_code,
        currentSite
      );
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [expenses, currentSite]
  );

  // Delete single expense
  const handleDeleteExpense = useCallback(
    (id: string) => {
      const expToDelete = expenses.find((e) => e.id === id);
      const updated = expenses.filter((e) => e.id !== id);
      setExpenses(updated);
      saveExpenses(updated, currentSite, true);

      // Audit log
      if (expToDelete) {
        logAuditEvent(
          'expense_delete',
          `הוצאה ${expToDelete.fi_code}`,
          `נמחקה הוצאה בסך ${formatCurrency(expToDelete.amount)} עבור "${expToDelete.vendor}" (אסמכתא: ${expToDelete.ref_number})`,
          expToDelete.fi_code,
          currentSite
        );
      }
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [expenses, currentSite]
  );

  // Bulk Delete Expenses
  const handleBulkDeleteExpenses = useCallback(
    (ids: string[]) => {
      const toDelete = expenses.filter((e) => ids.includes(e.id));
      const totalDeletedSum = toDelete.reduce((s, e) => s + e.amount, 0);
      const updated = expenses.filter((e) => !ids.includes(e.id));

      setExpenses(updated);
      saveExpenses(updated, currentSite, true);

      logAuditEvent(
        'expense_delete',
        'מחיקה מרוכזת',
        `נמחקו ${ids.length} הוצאות בסך כולל של ${formatCurrency(totalDeletedSum)}`,
        undefined,
        currentSite
      );
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [expenses, currentSite]
  );

  // Bulk Update Expenses
  const handleBulkUpdateExpenses = useCallback(
    (ids: string[], updates: Partial<Expense>) => {
      const updated = expenses.map((e) =>
        ids.includes(e.id) ? { ...e, ...updates } : e
      );
      setExpenses(updated);
      saveExpenses(updated, currentSite, true);

      logAuditEvent(
        'expense_update',
        'עריכה מרוכזת',
        `עודכנו ${ids.length} הוצאות במקביל (שדות שעודכנו: ${Object.keys(updates).join(', ')})`,
        undefined,
        currentSite
      );
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [expenses, currentSite]
  );

  // Clear all expenses (clean slate)
  const handleClearAllExpenses = useCallback(() => {
    if (
      confirm(
        'האם אתה בטוח שברצונך למחוק את כל ההוצאות והחשבוניות? פעולה זו תנקה את יומן ההוצאות לחלוטין לקראת קליטת קובץ חדש.'
      )
    ) {
      setExpenses([]);
      saveExpenses([], currentSite, true);
      logAuditEvent('expense_delete', 'איפוס יומן הוצאות', 'כל ההוצאות והחשבוניות נמחקו מהמערכת', undefined, currentSite);
      setAuditLogs(getStoredAuditLogs(currentSite));
    }
  }, [currentSite]);

  // Batch import expenses from Excel/CSV Importer
  const handleImportExpenses = useCallback(
    (newExpensesList: Omit<Expense, 'id' | 'created_at'>[]) => {
      const created: Expense[] = newExpensesList.map((exp, idx) => ({
        ...exp,
        id: `exp_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
      }));
      const updated = [...created, ...expenses];
      setExpenses(updated);
      saveExpenses(updated, currentSite, true);
      logAuditEvent(
        'expense_create',
        'ייבוא אקסל',
        `יובאו בהצלחה ${created.length} הוצאות מקובץ אקסל/CSV בסכום כולל של ${formatCurrency(
          created.reduce((s, e) => s + e.amount, 0)
        )}`,
        undefined,
        currentSite
      );
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [expenses, currentSite]
  );

  // Delete selected audit logs
  const handleBulkDeleteAuditLogs = useCallback(
    (ids: string[]) => {
      const updated = auditLogs.filter((l) => !ids.includes(l.id));
      setAuditLogs(updated);
      saveAuditLogs(updated, currentSite, true);
    },
    [auditLogs, currentSite]
  );

  // Clear all audit logs
  const handleClearAllAuditLogs = useCallback(() => {
    const freshLog: AuditLog[] = [
      {
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action_type: 'system_restore',
        entity_name: 'יומן שינויים',
        details: 'יומן השינויים אופס על ידי המשתמש',
        user: 'מנהל מערכת',
      },
    ];
    setAuditLogs(freshLog);
    saveAuditLogs(freshLog, currentSite, true);
  }, [currentSite]);

  // Update single monthly budget (Inline Edit or Drawer)
  const handleUpdateMonthlyBudget = useCallback(
    (itemId: string, newMonthlyBudget: number) => {
      const prevItem = budgetItems.find((i) => i.id === itemId);
      const updated = budgetItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              monthly_budget: newMonthlyBudget,
              updated_at: new Date().toISOString(),
            }
          : item
      );
      setBudgetItems(updated);
      saveBudgetItems(updated, currentSite, true);

      // Audit log
      if (prevItem && prevItem.monthly_budget !== newMonthlyBudget) {
        logAuditEvent(
          'budget_update',
          prevItem.name,
          `תקציב בסיס חודשי שונה מ-${formatCurrency(prevItem.monthly_budget)} ל-${formatCurrency(newMonthlyBudget)}`,
          prevItem.fi_code,
          currentSite
        );
        setAuditLogs(getStoredAuditLogs(currentSite));
      }
    },
    [budgetItems, currentSite]
  );

  // Direct manual override of Actual Spend (editing the actual spend cell directly)
  const handleUpdateActualSpendOverride = useCallback(
    (itemId: string, newActual: number | null) => {
      const prevItem = budgetItems.find((i) => i.id === itemId);
      const updated = budgetItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              manual_actual_override: newActual,
              updated_at: new Date().toISOString(),
            }
          : item
      );
      setBudgetItems(updated);
      saveBudgetItems(updated, currentSite, true);

      if (prevItem) {
        logAuditEvent(
          'expense_update',
          prevItem.name,
          newActual !== null
            ? `סכום ביצוע בפועל נקבע ידנית ל-${formatCurrency(newActual)}`
            : `הוסר עדכון ביצוע ידני — חזרה לחישוב אוטומטי מהוצאות`,
          prevItem.fi_code,
          currentSite
        );
        setAuditLogs(getStoredAuditLogs(currentSite));
      }
    },
    [budgetItems, currentSite]
  );

  // Batch save all budget items (from Budget Manager Modal)
  const handleSaveAllBudgetItems = useCallback(
    (updatedItems: BudgetItem[]) => {
      setBudgetItems(updatedItems);
      saveBudgetItems(updatedItems, currentSite, true);
      logAuditEvent('budget_update', 'סעיפי תקציב', `בוצע עדכון מרוכז של ${updatedItems.length} סעיפי תקציב`, undefined, currentSite);
      setAuditLogs(getStoredAuditLogs(currentSite));
    },
    [currentSite]
  );

  // Import budget items from Excel (with quarters, annual and categories)
  const handleImportBudget = useCallback(
    (newItems: BudgetItem[], targetSite: SiteId, mode: 'replace' | 'merge') => {
      let finalItems: BudgetItem[] = [];
      if (mode === 'replace') {
        finalItems = newItems;
      } else {
        // Merge with existing items by FI code
        const currentStored = getStoredBudgetItems(targetSite);
        const map = new Map<string, BudgetItem>();
        currentStored.forEach((item) => map.set(item.fi_code.toLowerCase(), item));
        newItems.forEach((item) => {
          const key = item.fi_code.toLowerCase();
          if (map.has(key)) {
            map.set(key, { ...map.get(key)!, ...item });
          } else {
            map.set(key, item);
          }
        });
        finalItems = Array.from(map.values());
      }

      saveBudgetItems(finalItems, targetSite, true);
      if (targetSite === currentSite) {
        setBudgetItems(finalItems);
      }
      logAuditEvent(
        'budget_update',
        `תקציב ${targetSite === 'marlog' ? 'מרלוג' : 'קדימה'}`,
        `נטענו ${newItems.length} סעיפי תקציב מאקסל (${mode === 'replace' ? 'החלפה נקייה' : 'מיזוג'})`,
        undefined,
        targetSite
      );
      setAuditLogs(getStoredAuditLogs(currentSite));
      triggerConfetti();
    },
    [currentSite]
  );

  // Quick add expense for a specific table row
  const handleQuickAddExpense = useCallback(
    (item: BudgetItemCalculated) => {
      setPreselectedItemId(item.id);
      setIsExpenseModalOpen(true);
    },
    []
  );

  // Open item drawer
  const handleSelectItem = useCallback((item: BudgetItemCalculated) => {
    setSelectedDrawerItem(item);
  }, []);

  // Export to Excel: Expenses Log
  const handleExportExpenses = useCallback(() => {
    const budgetMap: Record<string, { name: string; group: string }> = {};
    budgetItems.forEach((b) => {
      budgetMap[b.id] = { name: b.name, group: b.group };
    });
    exportExpensesToExcel(periodExpenses, budgetMap, periodLabel);
  }, [periodExpenses, budgetItems, periodLabel]);

  // Export to Excel: Budget vs Actual
  const handleExportBudgetReport = useCallback(() => {
    exportBudgetVsActualToExcel(calculatedItems, periodLabel);
  }, [calculatedItems, periodLabel]);

  // Print friendly view / PDF
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // 1. Password Protection Gate (Password: ide2026)
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setAuthenticated(true);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // 2. Facility Selection Landing Screen (קדימה vs מרלוג)
  if (!activeSite) {
    return (
      <SiteSelectionScreen
        onSelectSite={(site) => {
          saveActiveSiteToStorage(site);
          setActiveSite(site);
        }}
        onLogout={() => {
          setAuthenticated(false);
          setIsAuthenticated(false);
          saveActiveSiteToStorage(null);
          setActiveSite(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Assistant',sans-serif] relative">
      
      {/* Header with Navigation, Tabs, Facility Switcher and Logout */}
      <Header
        onOpenNewExpense={() => {
          setPreselectedItemId(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenBudgetManager={() => setIsBudgetManagerOpen(true)}
        onOpenCloudSettings={() => setIsCloudSettingsOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onExportExpenses={handleExportExpenses}
        onExportBudgetReport={handleExportBudgetReport}
        onPrint={handlePrint}
        onOpenExcelImport={() => setIsExcelImportOpen(true)}
        onOpenBudgetImport={() => setIsBudgetExcelImportOpen(true)}
        onOpenExecutiveReport={() => setIsExecutiveReportOpen(true)}
        onToggleChat={() => setActiveTab(activeTab === 'chat' ? 'dashboard' : 'chat')}
        isChatOpen={activeTab === 'chat'}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        expensesCount={periodExpenses.length}
        auditCount={auditLogs.length}
        activeSite={currentSite}
        onSwitchSite={(site) => {
          saveActiveSiteToStorage(site);
          setActiveSite(site);
        }}
        onOpenSiteSelector={() => {
          saveActiveSiteToStorage(null);
          setActiveSite(null);
        }}
        onLogout={() => {
          setAuthenticated(false);
          setIsAuthenticated(false);
          saveActiveSiteToStorage(null);
          setActiveSite(null);
        }}
      />

      {/* Main Container */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 ${activeTab === 'chat' ? 'max-w-[1650px]' : 'max-w-7xl'}`}>
        
        {/* Printable Header */}
        <div className="hidden print:block mb-6 pb-4 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="IDE Technologies" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-bold">דוח בקרת תקציב ומשאבים ארגוניים</h1>
                <p className="text-sm text-slate-600">
                  IDE Technologies | תקופת דוח: <strong>{periodLabel}</strong> | הופק בתאריך:{' '}
                  {new Date().toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-700">IDE Technologies</span>
            </div>
          </div>
        </div>

        {/* Dynamic Period Selector (Month / Quarter / Year) */}
        {activeTab !== 'audit' && activeTab !== 'chat' && (
          <PeriodSelector filter={filter} onChange={setFilter} />
        )}

        {/* 1. Main Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            {/* Traffic Light Health Alerts & Clickable Filter */}
            <HealthAlerts
              stats={stats}
              selectedStatusFilter={statusFilter}
              onSelectStatusFilter={setStatusFilter}
            />

            {/* Overall Financial KPI Cards */}
            <KpiCards stats={stats} />

            {/* Interactive Visualizations (Double Bar Chart + Donut Chart) */}
            <ChartsSection groups={groupSummaries} />

            {/* Detailed Budget & Actual Table with Inline Edit & Row Click Drill-Down */}
            <BudgetTable
              items={calculatedItems}
              statusFilter={statusFilter}
              onUpdateMonthlyBudget={handleUpdateMonthlyBudget}
              onUpdateActualSpendOverride={handleUpdateActualSpendOverride}
              onQuickAddExpense={handleQuickAddExpense}
              onSelectItem={handleSelectItem}
              onOpenBudgetExcelImport={() => setIsBudgetExcelImportOpen(true)}
            />
          </>
        )}

        {/* 2. Expenses Log View with Multi-Selection & Bulk Actions */}
        {activeTab === 'expenses' && (
          <ExpensesLogTable
            expenses={periodExpenses}
            budgetItems={budgetItems}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            onBulkDeleteExpenses={handleBulkDeleteExpenses}
            onBulkUpdateExpenses={handleBulkUpdateExpenses}
            onClearAllExpenses={handleClearAllExpenses}
            onOpenNewExpense={() => {
              setPreselectedItemId(null);
              setIsExpenseModalOpen(true);
            }}
            onOpenExcelImport={() => setIsExcelImportOpen(true)}
            periodLabel={periodLabel}
          />
        )}

        {/* 3. Dedicated Full-Page Smart Assistant Workspace (Matching IDE HR Tree & Filter Bar) */}
        {activeTab === 'chat' && (
          <SmartAssistantWorkspace
            budgetItems={budgetItems}
            expenses={expenses}
            currentFilter={filter}
            onOpenNewExpense={() => {
              setPreselectedItemId(null);
              setIsExpenseModalOpen(true);
            }}
          />
        )}

        {/* 4. Audit Trail View with Multi-Selection */}
        {activeTab === 'audit' && (
          <AuditTrailTable
            logs={auditLogs}
            onDeleteLogs={handleBulkDeleteAuditLogs}
            onClearAllLogs={handleClearAllAuditLogs}
          />
        )}

      </main>

      {/* Floating Action Button for AI Smart Assistant (Bottom Left) */}
      {!isChatOpen && activeTab !== 'chat' && (
        <button
          onClick={() => setActiveTab('chat')}
          className="fixed bottom-5 left-5 z-40 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white p-3.5 rounded-full shadow-xl shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer no-print group"
          title="פתח עוזר תקציבי חכם (AI)"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin [animation-duration:8s]" />
          <span className="text-xs font-bold pl-1 max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300">
            שאל את העוזר התקציבי
          </span>
        </button>
      )}

      {/* Smart Budget AI Chatbot Drawer/Window (Quick side drawer) */}
      <SmartBudgetChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        budgetItems={budgetItems}
        expenses={expenses}
        currentFilter={filter}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span>מערכת ווב לבקרת תקציב ומשאבים ארגוניים</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● סנכרון רשת מרכזי מופעל
            </span>
          </div>
          <div>
            7 קבוצות ראשיות • {budgetItems.length} סעיפי FI מוגדרים • עוזר תקציבי חכם פעיל
          </div>
        </div>
      </footer>

      {/* --- Modals & Drawer --- */}
      
      {/* 1. Fast Expense Logging Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        budgetItems={budgetItems}
        onSaveExpense={handleSaveExpense}
        preselectedItemId={preselectedItemId}
      />

      {/* 2. Budget and FI Manager Modal */}
      <BudgetManagerModal
        isOpen={isBudgetManagerOpen}
        onClose={() => setIsBudgetManagerOpen(false)}
        items={budgetItems}
        onSaveItems={handleSaveAllBudgetItems}
        onOpenBudgetExcelImport={() => setIsBudgetExcelImportOpen(true)}
      />

      {/* 3. Cloud Settings and Realtime Modal */}
      <CloudSettingsModal
        isOpen={isCloudSettingsOpen}
        onClose={() => setIsCloudSettingsOpen(false)}
        onResetData={() => {
          setBudgetItems(getStoredBudgetItems());
          setExpenses(getStoredExpenses());
          setAuditLogs(getStoredAuditLogs());
        }}
      />

      {/* 4. Full JSON Backup & Multi-PC Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRestored={() => {
          setBudgetItems(getStoredBudgetItems());
          setExpenses(getStoredExpenses());
          setAuditLogs(getStoredAuditLogs());
        }}
      />

      {/* 5. Item Detail & Direct Number Edit Drawer */}
      <ItemDrawer
        item={activeDrawerItem}
        onClose={() => setSelectedDrawerItem(null)}
        expenses={expenses}
        auditLogs={auditLogs}
        onUpdateMonthlyBudget={handleUpdateMonthlyBudget}
        onUpdateActualSpendOverride={handleUpdateActualSpendOverride}
        onDeleteExpense={handleDeleteExpense}
        onUpdateExpense={handleUpdateExpense}
        onAddExpense={handleSaveExpense}
        periodLabel={periodLabel}
      />

      {/* 6. Excel/CSV Smart Importer Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
        budgetItems={budgetItems}
        onImportExpenses={handleImportExpenses}
      />

      {/* 7. Executive 1-Pager Printable Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        stats={stats}
        groups={groupSummaries}
        items={calculatedItems}
        periodLabel={periodLabel}
      />

      {/* 8. Budget Excel Smart Importer Modal */}
      <BudgetExcelImportModal
        isOpen={isBudgetExcelImportOpen}
        onClose={() => setIsBudgetExcelImportOpen(false)}
        activeSite={currentSite}
        onImportBudget={handleImportBudget}
      />

    </div>
  );
}

export default App;

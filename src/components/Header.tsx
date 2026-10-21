import React, { useState } from 'react';
import {
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Cloud,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  HardDrive,
  History,
  Sparkles,
  UploadCloud,
  FileBarChart2,
  MessageSquare,
} from 'lucide-react';
import { AppTab } from '../types';

interface HeaderProps {
  onOpenNewExpense: () => void;
  onOpenBudgetManager: () => void;
  onOpenCloudSettings: () => void;
  onOpenBackupModal: () => void;
  onExportExpenses: () => void;
  onExportBudgetReport: () => void;
  onPrint: () => void;
  onOpenExcelImport?: () => void;
  onOpenExecutiveReport?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  expensesCount: number;
  auditCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewExpense,
  onOpenBudgetManager,
  onOpenCloudSettings,
  onOpenBackupModal,
  onExportExpenses,
  onExportBudgetReport,
  onPrint,
  onOpenExcelImport,
  onOpenExecutiveReport,
  onToggleChat,
  isChatOpen,
  activeTab,
  setActiveTab,
  expensesCount,
  auditCount,
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* Logo & System Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 px-2.5 py-1 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-center">
              <img
                src="/logo.png"
                alt="IDE Technologies"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  בקרת תקציב ומשאבים ארגוניים
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  סנכרון רשת מרכזי פעיל
                </span>
              </div>
              <p className="text-xs text-slate-500">
                IDE Technologies — ניהול, בקרה ומעקב תקציבי שוטף מול ביצוע בפועל לפי קודי FI
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Dashboard / Expenses Log / Smart Chat / Audit Trail) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              דשבורד ראשי
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>יומן הוצאות</span>
              {expensesCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {expensesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-indigo-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>צ'אט חכם</span>
              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                AI
              </span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>יומן שינויים</span>
              {auditCount > 0 && (
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {auditCount}
                </span>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 no-print">
            
            {/* New Expense Button (Prominent) */}
            <button
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-sm shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>הוצאה חדשה</span>
              <kbd className="hidden lg:inline bg-blue-800/40 text-[10px] px-1.5 py-0.5 rounded text-blue-100 font-mono">N</kbd>
            </button>

            {/* Excel Smart Importer */}
            {onOpenExcelImport && (
              <button
                onClick={onOpenExcelImport}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
                title="ייבוא מרוכז של הוצאות מקובץ Excel או CSV"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>ייבוא אקסל</span>
              </button>
            )}

            {/* Executive 1-Pager Report */}
            {onOpenExecutiveReport && (
              <button
                onClick={onOpenExecutiveReport}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
                title="דוח מנהלים 1-Pager מעוצב להדפסה ולייצוא"
              >
                <FileBarChart2 className="w-3.5 h-3.5 text-blue-400" />
                <span>דוח מנהלים</span>
              </button>
            )}

            {/* Budget & FI Manager */}
            <button
              onClick={onOpenBudgetManager}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl font-medium text-xs transition-all shadow-2xs cursor-pointer"
              title="עריכת תקציבים וקודי FI"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xl:inline">עריכת תקציבים ו-FI</span>
            </button>

            {/* Backup & Multi-PC Modal */}
            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 px-2.5 py-2 rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
              title="גיבוי, שחזור וחיבור ממחשבים אחרים"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">גיבוי וסנכרון</span>
            </button>

            {/* Excel Export Menu */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl font-medium text-xs transition-all shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">ייצוא לאקסל</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {exportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-right animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        onExportExpenses();
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                    >
                      <span>ייצוא יומן הוצאות</span>
                      <span className="text-[10px] text-slate-400">FI בעמודה 1</span>
                    </button>
                    <button
                      onClick={() => {
                        onExportBudgetReport();
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-right px-4 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between border-t border-slate-100"
                    >
                      <span>דוח תקציב מול ביצוע</span>
                      <span className="text-[10px] text-slate-400">ריכוז סעיפים</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Print / PDF Button */}
            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 p-2 sm:px-2.5 sm:py-2 rounded-xl font-medium text-xs transition-all shadow-2xs cursor-pointer"
              title="הדפסת דוח / יצירת PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden 2xl:inline">הדפסה</span>
            </button>

            {/* Cloud & Realtime Settings */}
            <button
              onClick={onOpenCloudSettings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="הגדרות ענן וחיבור זמן אמת"
            >
              <Cloud className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

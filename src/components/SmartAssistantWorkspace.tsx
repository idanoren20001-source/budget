import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles,
  Search,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Filter,
  CheckCircle,
  Wrench,
  Car,
  Calendar,
  PieChart,
  TrendingUp,
  Utensils,
  Monitor,
  Building,
  Briefcase,
  AlertTriangle,
  Layers,
  ChevronDown,
  FileSpreadsheet,
  History,
  Send,
  Bot,
  User,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
} from 'lucide-react';
import {
  BudgetItem,
  Expense,
  PeriodFilter,
  BudgetItemCalculated,
  GroupSummary,
} from '../types';
import {
  ChatMessage,
  QUESTION_CATEGORIES,
  CATEGORIZED_QUESTIONS,
  QuestionCategoryType,
  CatalogQuestion,
  answerBudgetQuestion,
} from '../services/budgetChatEngine';
import { formatCurrency, calculateBudgetItems, calculateOverallStats } from '../utils/budgetUtils';
import { INITIAL_GROUPS } from '../data/initialData';
import { exportExpensesToExcel } from '../services/excelExport';

interface SmartAssistantWorkspaceProps {
  budgetItems: BudgetItem[];
  expenses: Expense[];
  currentFilter: PeriodFilter;
  onOpenNewExpense?: () => void;
}

export const SmartAssistantWorkspace: React.FC<SmartAssistantWorkspaceProps> = ({
  budgetItems,
  expenses,
  currentFilter,
  onOpenNewExpense,
}) => {
  // Active Question & Selection State
  const [selectedQuestion, setSelectedQuestion] = useState<CatalogQuestion | null>(() => CATEGORIZED_QUESTIONS[0]);
  const [activeCategory, setActiveCategory] = useState<QuestionCategoryType>('all');
  
  // Top Filter Bar State
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');

  // Compute available groups dynamically from budget items + initial
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    INITIAL_GROUPS.forEach((g) => set.add(g.name));
    budgetItems.forEach((b) => {
      if (b.group) set.add(b.group);
    });
    return Array.from(set).sort();
  }, [budgetItems]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [freeSearchText, setFreeSearchText] = useState<string>('');

  // Conversation & Follow-up State
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Compute live active answer
  const currentAnswer = useMemo(() => {
    const qText = selectedQuestion ? selectedQuestion.text : 'תמונת מצב כללית';
    return answerBudgetQuestion(qText, budgetItems, expenses, currentFilter);
  }, [selectedQuestion, budgetItems, expenses, currentFilter]);

  // Overall calculations for summary box
  const calculatedItems = useMemo(() => {
    return calculateBudgetItems(budgetItems, expenses, currentFilter);
  }, [budgetItems, expenses, currentFilter]);

  const stats = useMemo(() => {
    return calculateOverallStats(calculatedItems);
  }, [calculatedItems]);

  // Filter questions based on Top Filter Bar & Search
  const filteredQuestions = useMemo(() => {
    const q = freeSearchText.trim().toLowerCase();

    return CATEGORIZED_QUESTIONS.filter((item) => {
      // 1. Sidebar Category
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // 2. Dropdown Group Filter
      if (selectedGroupFilter !== 'all') {
        const matchesGroup =
          item.text.includes(selectedGroupFilter) ||
          item.description.includes(selectedGroupFilter) ||
          item.keywords.some((k) => k.includes(selectedGroupFilter));
        if (!matchesGroup) return false;
      }
      // 3. Dropdown Status Filter
      if (selectedStatusFilter === 'over' && !item.keywords.some((k) => k.includes('חריג') || k.includes('אדום'))) {
        return false;
      }
      if (selectedStatusFilter === 'warning' && !item.keywords.some((k) => k.includes('אזהרה') || k.includes('צהוב'))) {
        return false;
      }
      // 4. Free text search
      if (q) {
        const matchesText = item.text.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        if (!matchesText && !matchesDesc && !matchesKeywords) return false;
      }

      return true;
    });
  }, [activeCategory, selectedGroupFilter, selectedStatusFilter, freeSearchText]);

  // Handle Question Click
  const handleSelectQuestion = (q: CatalogQuestion) => {
    setSelectedQuestion(q);
    const ans = answerBudgetQuestion(q.text, budgetItems, expenses, currentFilter);
    setConversationHistory((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}`,
        sender: 'user',
        text: q.text,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: ans.text,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        structuredData: ans.structuredData,
      },
    ]);
  };

  // Handle Custom Question Submit
  const handleSendCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = customInputValue.trim();
    if (!query) return;

    setCustomInputValue('');
    setIsTyping(true);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setConversationHistory((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const ans = answerBudgetQuestion(query, budgetItems, expenses, currentFilter);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: ans.text,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        structuredData: ans.structuredData,
      };
      setConversationHistory((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      // Create a temporary question for view
      setSelectedQuestion({
        id: `custom-${Date.now()}`,
        text: query,
        category: 'all',
        description: 'שאילתה מותאמת אישית של המשתמש',
        keywords: [query],
      });
    }, 250);
  };

  // Export current results to Excel
  const handleExportResults = () => {
    const budgetMap: Record<string, { name: string; group: string }> = {};
    budgetItems.forEach((b) => {
      budgetMap[b.id] = { name: b.name, group: b.group };
    });
    exportExpensesToExcel(expenses, budgetMap, selectedQuestion ? selectedQuestion.text : 'דוח עוזר חכם');
  };

  const getCategoryIcon = (cat: QuestionCategoryType) => {
    switch (cat) {
      case 'operations':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'vehicles':
        return <Car className="w-4 h-4 text-blue-600" />;
      case 'months':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'quarters':
        return <PieChart className="w-4 h-4 text-purple-600" />;
      case 'annual':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'catering':
        return <Utensils className="w-4 h-4 text-orange-600" />;
      case 'it':
        return <Monitor className="w-4 h-4 text-cyan-600" />;
      case 'realestate':
        return <Building className="w-4 h-4 text-teal-600" />;
      case 'vendors':
        return <Briefcase className="w-4 h-4 text-slate-700" />;
      case 'alerts':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Layers className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 font-['Assistant',sans-serif] min-h-[calc(100vh-12rem)] pb-10">
      
      {/* ============================================================== */}
      {/* 1. RIGHT SIDEBAR: Categorized Tree & Summary Box               */}
      {/* ============================================================== */}
      <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
        
        {/* Navigation Tree Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-800 tracking-tight">
                סייר נושאים ושאלות
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              {CATEGORIZED_QUESTIONS.length} שאלות
            </span>
          </div>

          <nav className="p-2 space-y-1 text-xs">
            {QUESTION_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              const count =
                cat.key === 'all'
                  ? CATEGORIZED_QUESTIONS.length
                  : CATEGORIZED_QUESTIONS.filter((q) => q.category === cat.key).length;

              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-right transition-all cursor-pointer font-bold ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'text-white' : ''}>
                      {getCategoryIcon(cat.key)}
                    </span>
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Summary Box (Matching the IDE HR screenshot layout) */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-slate-300">סטטוס תקציבי כולל</span>
            <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
              IDE Tech
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">סה"כ סעיפי FI:</span>
              <strong className="text-white font-mono">82 סעיפים</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">תקציב מאושר:</span>
              <strong className="text-emerald-300 font-mono">{formatCurrency(stats.total_budget)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ביצוע בפועל:</span>
              <strong className="text-indigo-200 font-mono">{formatCurrency(stats.total_spend)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">סעיפים בחריגה:</span>
              <strong className="text-rose-300 font-mono">{stats.over_budget_items_count} סעיפים</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 text-center">
            סה"כ {filteredQuestions.length} שאלות מסוננות להרצה
          </div>
        </div>

      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN CENTER WORKSPACE: Top Filter Bar + Active Question Table */}
      {/* ============================================================== */}
      <section className="flex-1 flex flex-col gap-4 min-w-0">
        
        {/* Top Advanced Filter & Sort Bar (Matching Screenshot: מיון מתקדם) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                סינון ומיון מתקדם של נתוני התקציב
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportResults}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="ייצוא תוצאות לאקסל"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>ייצוא תוצאות</span>
              </button>

              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="היסטוריית שאלות"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>היסטוריה ({conversationHistory.length / 2 | 0})</span>
              </button>
            </div>
          </div>

          {/* Row of Dropdowns + Search Box (as in the screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 items-center">
            
            {/* 1. Group Dropdown */}
            <div>
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">כל הקבוצות ({availableGroups.length})</option>
                {availableGroups.map((groupName) => (
                  <option key={groupName} value={groupName}>
                    {groupName}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Period Dropdown */}
            <div>
              <select
                value={selectedPeriodFilter}
                onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">כל התקופות</option>
                <option value="current">חודש נוכחי (אוקטובר 2026)</option>
                <option value="prev">חודש קודם (ספטמבר 2026)</option>
                <option value="q4">רבעון 4 (Q4 2026)</option>
                <option value="annual">שנתי (2026)</option>
              </select>
            </div>

            {/* 3. Status Dropdown */}
            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="all">כל הסטטוסים</option>
                <option value="over">חריגה (אדום מעל 100%)</option>
                <option value="warning">אזהרה (צהוב 80-99%)</option>
                <option value="normal">תקין (מתחת ל-80%)</option>
              </select>
            </div>

            {/* 4. Free Text Search Box */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder='חיפוש חופשי... (לדוגמה: "תפעול", "דלק", "חשמל", "1001")'
                value={freeSearchText}
                onChange={(e) => setFreeSearchText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-16 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 font-medium"
              />
              {freeSearchText && (
                <button
                  onClick={() => setFreeSearchText('')}
                  className="absolute left-2 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕ נקה
                </button>
              )}
            </div>

          </div>

          {/* Filter status indicator pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span className="font-bold">
              נמצאו {filteredQuestions.length} שאלות וניתוחים התואמים את הסינון הנוכחי
            </span>
            {(selectedGroupFilter !== 'all' || selectedStatusFilter !== 'all' || freeSearchText) && (
              <button
                onClick={() => {
                  setSelectedGroupFilter('all');
                  setSelectedStatusFilter('all');
                  setFreeSearchText('');
                  setActiveCategory('all');
                }}
                className="text-blue-600 hover:underline font-bold cursor-pointer"
              >
                איפוס כל הסינונים
              </button>
            )}
          </div>
        </div>

        {/* Active Question Title & Answer Container */}
        {selectedQuestion && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            
            {/* Question Header Banner */}
            <div className="bg-gradient-to-l from-blue-800 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/15">
                  {getCategoryIcon(selectedQuestion.category)}
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">
                    {selectedQuestion.text}
                  </h2>
                  <p className="text-xs text-blue-100/80 mt-0.5">
                    {selectedQuestion.description}
                  </p>
                </div>
              </div>

              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                ניתוח בזמן אמת
              </span>
            </div>

            {/* AI Textual Insight Box */}
            <div className="p-4 bg-blue-50/40 border-b border-blue-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {currentAnswer.text}
            </div>

            {/* Structured Financial Table / Data Representation */}
            {currentAnswer.structuredData && currentAnswer.structuredData.items && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-800">
                    {currentAnswer.structuredData.title || 'פירוט נתונים וסעיפים רלוונטיים'}
                  </h4>
                  {currentAnswer.structuredData.totalAmount !== undefined && (
                    <span className="text-xs font-black text-blue-900">
                      סך הכל: {formatCurrency(currentAnswer.structuredData.totalAmount)}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">סעיף / ישות</th>
                        <th className="py-2.5 px-3">פרטים ומועד</th>
                        <th className="py-2.5 px-3 text-left">סכום / ביצוע</th>
                        <th className="py-2.5 px-3 text-center">סטטוס / תגית</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentAnswer.structuredData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {item.label}
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {item.secondary || '—'}
                          </td>
                          <td className="py-2 px-3 text-left font-black text-slate-900 font-mono">
                            {item.value}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {item.badge ? (
                              <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.badge.color === 'red'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : item.badge.color === 'yellow'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : item.badge.color === 'green'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {item.badge.text}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Questions Grid Explorer: Click any question to ask it */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-900">
                שאלות מומלצות לבחירה בלחיצה אחת ({filteredQuestions.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              לחץ על כל שאלה כדי לחשב ולהציג נתונים
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredQuestions.map((q) => {
              const isCurrent = selectedQuestion?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="p-1 rounded-lg bg-white shadow-2xs shrink-0 mt-0.5">
                      {getCategoryIcon(q.category)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {q.text}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {q.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400">
                    <ArrowRight className="w-3.5 h-3.5 transform rotate-180" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Interactive Custom Query Input Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3">
          <form onSubmit={handleSendCustom} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="שאל אותי כל שאלה פיננסית נוספת בשפה חופשית (למשל: כמה הוצאנו על דלק ברבעון 4?)..."
              value={customInputValue}
              onChange={(e) => setCustomInputValue(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 font-medium"
            />
            <button
              type="submit"
              disabled={!customInputValue.trim() || isTyping}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>שאל</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </section>

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  היסטוריית שאלות ותשובות שנשאלו
                </h3>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {conversationHistory.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  טרם נשאלו שאלות בשיחה הנוכחית.
                </div>
              ) : (
                conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'bg-slate-50 text-slate-800 border border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 mb-1">
                      {msg.sender === 'user' ? 'שאלה שלך' : 'מענה העוזר'}{' '}
                      • {msg.timestamp}
                    </div>
                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  Search,
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
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { BudgetItem, Expense, PeriodFilter } from '../types';
import {
  ChatMessage,
  QUESTION_CATEGORIES,
  CATEGORIZED_QUESTIONS,
  QuestionCategoryType,
  CatalogQuestion,
  answerBudgetQuestion,
} from '../services/budgetChatEngine';

interface SmartBudgetChatProps {
  isOpen: boolean;
  onClose: () => void;
  budgetItems: BudgetItem[];
  expenses: Expense[];
  currentFilter: PeriodFilter;
}

export const SmartBudgetChat: React.FC<SmartBudgetChatProps> = ({
  isOpen,
  onClose,
  budgetItems,
  expenses,
  currentFilter,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'שלום! אני העוזר התקציבי החכם שלך. 🤖\nבסרגל הימני תמצא **מאגר שאלות וסינונים** לפי נושאים.\n\nנסה להקליד בחיפוש **"תפעול"**, **"רכבים"**, **"רבעון"** או **"חריגה"** כדי לראות מיד את כל השאלות הרלוונטיות וללחוץ עליהן!',
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategoryType>('all');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [lastClickedQuestionId, setLastClickedQuestionId] = useState<string | null>(null);

  // Mobile active tab ('questions' | 'chat')
  const [mobileTab, setMobileTab] = useState<'questions' | 'chat'>('questions');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = (textToSend?: string, questionId?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (questionId) {
      setLastClickedQuestionId(questionId);
    }

    // On mobile switch to chat tab
    setMobileTab('chat');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = answerBudgetQuestion(text, budgetItems, expenses, currentFilter);
      const assistantMsg: ChatMessage = {
        ...response,
        id: `assistant-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 300);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: 'השיחה אופסה. בחר שאלה מהסרגל הימני או הקלד שאלה חופשית.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setLastClickedQuestionId(null);
  };

  // Filtered Questions using both category and keyword search
  const filteredQuestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return CATEGORIZED_QUESTIONS.filter((item) => {
      // 1. Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // 2. Keyword/text filter
      if (q) {
        const matchesText = item.text.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        return matchesText || matchesDesc || matchesKeywords;
      }
      return true;
    });
  }, [selectedCategory, searchTerm]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const counts: Record<string, number> = { all: 0 };

    CATEGORIZED_QUESTIONS.forEach((item) => {
      let matchesSearch = true;
      if (q) {
        matchesSearch =
          item.text.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q));
      }

      if (matchesSearch) {
        counts.all += 1;
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });

    return counts;
  }, [searchTerm]);

  const getCategoryIcon = (cat: QuestionCategoryType) => {
    switch (cat) {
      case 'operations':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'vehicles':
        return <Car className="w-3.5 h-3.5" />;
      case 'months':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'quarters':
        return <PieChart className="w-3.5 h-3.5" />;
      case 'annual':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'catering':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'it':
        return <Monitor className="w-3.5 h-3.5" />;
      case 'realestate':
        return <Building className="w-3.5 h-3.5" />;
      case 'vendors':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'alerts':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[840px] max-w-[calc(100vw-2rem)] h-[690px] max-h-[calc(100vh-4rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-['Assistant',sans-serif]">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-blue-700 text-white px-5 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/25 shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-none">עוזר תקציבי חכם (AI Financial Assistant)</h3>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                AI Live
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/80 mt-0.5">
              חיפוש שאלות מובנות לפי תפעול, רכבים, חודשים, רבעונים וספקים
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 text-white/80">
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors cursor-pointer text-white"
            title="הצג / הסתר סרגל שאלות"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isSidePanelOpen ? 'הסתר מאגר' : 'הצג מאגר'}</span>
          </button>

          <button
            onClick={handleResetChat}
            className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            title="איפוס שיחה"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            title="סגור חלון"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on small screens) */}
      <div className="flex md:hidden border-b border-slate-200 bg-slate-50 text-xs font-bold">
        <button
          onClick={() => setMobileTab('questions')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            mobileTab === 'questions'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500'
          }`}
        >
          🔍 מאגר שאלות וחיפוש ({filteredQuestions.length})
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-center border-b-2 transition-all ${
            mobileTab === 'chat'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500'
          }`}
        >
          💬 שיחה ותשובות ({messages.length})
        </button>
      </div>

      {/* Dual Panel Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ============================================================== */}
        {/* PANEL 1: Question Explorer & Instant Search (Right Side)       */}
        {/* ============================================================== */}
        {(isSidePanelOpen || mobileTab === 'questions') && (
          <div
            className={`w-full md:w-[350px] shrink-0 border-l border-slate-200 bg-slate-50/70 flex flex-col overflow-hidden ${
              mobileTab === 'questions' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* Top Search Bar */}
            <div className="p-3 bg-white border-b border-slate-200 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-indigo-500 absolute right-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder='חיפוש שאלה או נושא (למשל: "תפעול", "דלק", "רבעון")...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-7 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills (Horizontal scrollable) */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {QUESTION_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.key] || 0;
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {getCategoryIcon(cat.key)}
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 px-1 flex items-center justify-between">
                <span>
                  {searchTerm
                    ? `תוצאות עבור "${searchTerm}" (${filteredQuestions.length})`
                    : `שאלות בקטגוריה (${filteredQuestions.length})`}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold">
                  לחץ לבחירה והרצה
                </span>
              </div>

              {filteredQuestions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <p>לא נמצאו שאלות תואמות לחיפוש "{searchTerm}".</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    נקה סינונים והצג הכל
                  </button>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = lastClickedQuestionId === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => handleSend(q.text, q.id)}
                      className={`group border rounded-2xl p-2.5 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-2.5 text-right ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-400/30'
                          : 'bg-white hover:bg-indigo-50/60 border-slate-200/90 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`p-1 rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white'
                            }`}
                          >
                            {getCategoryIcon(q.category)}
                          </span>
                          <h4
                            className={`text-xs font-bold transition-colors leading-tight truncate ${
                              isSelected
                                ? 'text-indigo-900 font-black'
                                : 'text-slate-900 group-hover:text-indigo-950'
                            }`}
                          >
                            {q.text}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 pr-5">
                          {q.description}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 p-1 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white'
                        }`}
                      >
                        <ArrowRight className="w-3 h-3 transform rotate-180" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Quick Count */}
            <div className="p-2 bg-white border-t border-slate-200 text-center text-[11px] text-slate-400">
              מאגר שאלות מובנה ({CATEGORIZED_QUESTIONS.length} שאלות זמינות)
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PANEL 2: Conversation & Live Answers (Left Side)               */}
        {/* ============================================================== */}
        <div
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                  }`}
                >
                  {/* Message Text with newlines */}
                  <div className="whitespace-pre-line leading-relaxed text-xs">
                    {msg.text}
                  </div>

                  {/* Structured Financial Data (KPI Cards / Mini Tables) */}
                  {msg.structuredData && msg.structuredData.items && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                      {msg.structuredData.title && (
                        <div className="text-[11px] font-bold text-slate-500 mb-1">
                          {msg.structuredData.title}:
                        </div>
                      )}

                      {msg.structuredData.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50/80 rounded-xl p-2 border border-slate-100 flex items-center justify-between gap-2"
                        >
                          <div className="truncate pr-1">
                            <div className="font-bold text-slate-900 truncate">
                              {it.label}
                            </div>
                            {it.secondary && (
                              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                {it.secondary}
                              </div>
                            )}
                          </div>

                          <div className="text-left shrink-0">
                            <div className="font-black text-slate-900">
                              {it.value}
                            </div>
                            {it.badge && (
                              <span
                                className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md mt-0.5 ${
                                  it.badge.color === 'red'
                                    ? 'bg-rose-100 text-rose-800'
                                    : it.badge.color === 'yellow'
                                    ? 'bg-amber-100 text-amber-800'
                                    : it.badge.color === 'green'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {it.badge.text}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs py-1">
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/50 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-2xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[11px] font-medium text-slate-500 mr-1">
                    מנתח נתוני תקציב והוצאות...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Custom Query Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={chatInputRef}
                type="text"
                placeholder="הקלד שאלה חופשית בעברית או בחר שאלה מהסרגל..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-8 h-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                title="שלח שאלה"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

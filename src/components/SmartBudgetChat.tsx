import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Calendar,
  PieChart,
  Building2,
  Briefcase,
  AlertTriangle,
  History,
  Search,
  BookOpen,
  ArrowRight,
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
      text: 'שלום! אני העוזר התקציבי החכם שלך. 🤖\nלרשותך מאגר שאלות עשיר ומחולק לפי קטגוריות: **חודשים, רבעונים, שנתי, קבוצות, ספקים וחריגות**.\n\nתוכל לבחור שאלה מוכנה בלחיצה אחת או להקליד כל שאלה בשפה חופשית!',
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Question Catalog State
  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategoryType>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    if (isOpen && !showCatalog) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, showCatalog]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // Close catalog when sending
    setShowCatalog(false);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate smart fast reasoning
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
        text: 'השיחה אופסה. תוכל לבחור שאלה מתוך המאגר או להקליד שאלה חדשה.',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Filter questions for catalog
  const filteredCatalogQuestions = useMemo(() => {
    return CATEGORIZED_QUESTIONS.filter((q) => {
      if (selectedCategory !== 'all' && q.category !== selectedCategory) {
        return false;
      }
      if (catalogSearch.trim()) {
        const query = catalogSearch.toLowerCase();
        return (
          q.text.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [selectedCategory, catalogSearch]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CATEGORIZED_QUESTIONS.length };
    CATEGORIZED_QUESTIONS.forEach((q) => {
      counts[q.category] = (counts[q.category] || 0) + 1;
    });
    return counts;
  }, []);

  const getCategoryIcon = (cat: QuestionCategoryType) => {
    switch (cat) {
      case 'months':
        return <Calendar className="w-3.5 h-3.5" />;
      case 'quarters':
        return <PieChart className="w-3.5 h-3.5" />;
      case 'annual':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'groups':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'vendors':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'alerts':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'audit':
        return <History className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[470px] max-w-[calc(100vw-2rem)] h-[670px] max-h-[calc(100vh-5rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-['Assistant',sans-serif]">
      
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-800 via-indigo-700 to-blue-600 text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/25">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm leading-none">עוזר תקציבי חכם</h3>
              <span className="bg-emerald-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                AI Live
              </span>
            </div>
            <p className="text-[11px] text-indigo-100/80 mt-0.5">
              מענה תקציבי מבוסס חודשים, רבעונים, שנתי וספקים
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-white/80">
          {/* Toggle Catalog vs Chat button */}
          <button
            onClick={() => setShowCatalog(!showCatalog)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              showCatalog
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title="פתח מאגר שאלות מומלצות לפי קטגוריות"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>מאגר שאלות</span>
            <span className="bg-black/20 text-[10px] px-1 rounded-full font-mono">
              {CATEGORIZED_QUESTIONS.length}
            </span>
          </button>

          <button
            onClick={handleResetChat}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
            title="איפוס שיחה"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
            title="סגור חלון"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW A: Full Categorized Questions Catalog */}
      {showCatalog ? (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-150">
          
          {/* Catalog Search & Category Tabs */}
          <div className="p-3 bg-white border-b border-slate-200 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="חיפוש שאלה במאגר (לדוגמה: רבעון, ספק, אחזקה, חריגה)..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch('')}
                  className="absolute left-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category horizontal pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
              {QUESTION_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.key] || 0;
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {getCategoryIcon(cat.key)}
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Questions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 px-1 flex items-center justify-between">
              <span>
                נמצאו {filteredCatalogQuestions.length} שאלות זמינות
              </span>
              <button
                onClick={() => setShowCatalog(false)}
                className="text-indigo-600 hover:underline"
              >
                חזרה לצ'אט ←
              </button>
            </div>

            {filteredCatalogQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                לא נמצאו שאלות התואמות לחיפוש שלך.
              </div>
            ) : (
              filteredCatalogQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => handleSend(q.text)}
                  className="group bg-white hover:bg-indigo-50/70 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-3 transition-all cursor-pointer shadow-2xs flex items-center justify-between gap-3 text-right"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {getCategoryIcon(q.category)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
                        {q.text}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 pr-6">
                      {q.description}
                    </p>
                  </div>

                  <div className="shrink-0 p-1.5 rounded-xl bg-slate-100 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white transition-all">
                    <ArrowRight className="w-3.5 h-3.5 transform rotate-180" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Catalog Footer */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>לחץ על כל שאלה כדי לשלוח אותה מיידית</span>
            <button
              onClick={() => setShowCatalog(false)}
              className="text-indigo-600 font-bold hover:underline"
            >
              סגור מאגר שאלות
            </button>
          </div>

        </div>
      ) : (
        /* VIEW B: Active Chat Messages View */
        <>
          {/* Quick horizontal category chip bar */}
          <div className="bg-slate-50/90 border-b border-slate-200/70 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setShowCatalog(true)}
              className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
            >
              <BookOpen className="w-3 h-3" />
              <span>כל המאגר ({CATEGORIZED_QUESTIONS.length})</span>
            </button>

            {/* Quick popular chips */}
            {CATEGORIZED_QUESTIONS.slice(0, 5).map((sq) => (
              <button
                key={sq.id}
                onClick={() => handleSend(sq.text)}
                className="whitespace-nowrap bg-white hover:bg-indigo-50 text-indigo-950 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer shrink-0"
              >
                {sq.text}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
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
                  {/* Message text with newline support */}
                  <div className="whitespace-pre-line leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Structured Data Attachment (Cards/Lists/Tables) */}
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
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-1 shadow-2xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[11px] font-medium text-slate-500 mr-1.5">
                    מנתח נתונים תקציביים...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="הקלד שאלה או בחר ממאגר השאלות למעלה..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
        </>
      )}

    </div>
  );
};

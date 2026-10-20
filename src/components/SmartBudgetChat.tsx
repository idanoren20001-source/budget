import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { BudgetItem, Expense, PeriodFilter } from '../types';
import {
  ChatMessage,
  SUGGESTED_QUESTIONS,
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
      text: 'שלום! אני העוזר התקציבי החכם שלך. 🤖\nאני יכול לענות לך על כל שאלה בנוגע להוצאות, תקציבים, ספקים, חריגות וחלוקה לפי חודשים וקבוצות.\n\nתוכל להקליד כל שאלה בשפה חופשית או לבחור באחת מהשאלות הנפוצות למטה.',
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

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
    }, 350);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: 'השיחה אופסה. במה אוכל לעזור לך כעת?',
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-5rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 font-['Assistant',sans-serif]">
      
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-700 via-indigo-600 to-blue-600 text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
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
              מענה מיידי לכל שאילתה פיננסית
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-white/80">
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

      {/* Suggested Questions Bar (Scrollable chips) */}
      <div className="bg-slate-50/90 border-b border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap pl-1 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-500" />
          שאלות מומלצות:
        </span>
        {SUGGESTED_QUESTIONS.map((sq) => (
          <button
            key={sq.id}
            onClick={() => handleSend(sq.text)}
            className="whitespace-nowrap bg-white hover:bg-indigo-50 text-indigo-900 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
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
            placeholder="שאל אותי כל דבר (למשל: כמה הוצאנו החודש בתפעול?)..."
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

    </div>
  );
};

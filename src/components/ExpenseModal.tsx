import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Check, Calendar, CreditCard, Building2, FileText, MessageSquare, Paperclip, Upload, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BudgetItem, Expense } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetItems: BudgetItem[];
  onSaveExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  preselectedItemId?: string | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  budgetItems,
  onSaveExpense,
  preselectedItemId,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [refNumber, setRefNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // File Attachment State
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentType, setAttachmentType] = useState<string>('');
  const [attachmentData, setAttachmentData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart select search state
  const [itemSearch, setItemSearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setAmount('');
      setVendor('');
      setRefNumber('');
      setNotes('');
      setAttachmentName('');
      setAttachmentType('');
      setAttachmentData('');
      setItemSearch('');
      setIsDropdownOpen(false);

      if (preselectedItemId) {
        setSelectedItemId(preselectedItemId);
      } else if (budgetItems.length > 0 && !selectedItemId) {
        setSelectedItemId(budgetItems[0].id);
      }
    }
  }, [isOpen, preselectedItemId, budgetItems]);

  // Click outside to close custom select dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const selectedItem = budgetItems.find((i) => i.id === selectedItemId);

  // Filter items in Smart Select dropdown
  const filteredDropdownItems = budgetItems.filter((item) => {
    if (!itemSearch.trim()) return true;
    const q = itemSearch.toLowerCase();
    const matchCode = item.fi_code.toLowerCase().includes(q);
    const matchName = item.name.toLowerCase().includes(q);
    const matchGroup = item.group.toLowerCase().includes(q);
    // Support typing numbers like "707" to match "FI-707"
    const numberOnlyCode = item.fi_code.replace(/[^0-9]/g, '');
    const matchNumber = numberOnlyCode.includes(q.replace(/[^0-9]/g, ''));
    return matchCode || matchName || matchGroup || (q.match(/^[0-9]+$/) && matchNumber);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId) {
      alert('אנא בחר סעיף תקציבי');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('אנא הזן סכום תקין בש"ח');
      return;
    }
    if (!vendor.trim()) {
      alert('אנא הזן שם ספק / בית עסק');
      return;
    }
    if (!refNumber.trim()) {
      alert('אנא הזן מספר אסמכתא או חשבונית');
      return;
    }

    const item = budgetItems.find((i) => i.id === selectedItemId);
    const fi_code = item ? item.fi_code : '';

    onSaveExpense({
      budget_item_id: selectedItemId,
      fi_code,
      date,
      amount: parsedAmount,
      vendor: vendor.trim(),
      ref_number: refNumber.trim(),
      notes: notes.trim(),
      attachment_name: attachmentName || undefined,
      attachment_type: attachmentType || undefined,
      attachment_data: attachmentData || undefined,
    });

    // Delightful celebration for fast data entry
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                רישום הוצאה חדשה (Smart FI Entry)
              </h3>
              <p className="text-xs text-slate-400">
                הזנה מהירה בפחות מ-10 שניות — מסתנכרנת מיידית במערכת
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Smart Select: Budget Item with Instant FI Search */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              סעיף תקציב וקוד FI <span className="text-rose-500">*</span>
            </label>

            {/* Custom Trigger Box */}
            <div
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs text-right cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
            >
              {selectedItem ? (
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-[11px]">
                    [{selectedItem.fi_code}]
                  </span>
                  <span className="font-bold text-slate-800 truncate">
                    {selectedItem.name}
                  </span>
                  <span className="text-slate-400 text-[11px] truncate">
                    — {selectedItem.group}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400">בחר סעיף תקציב...</span>
              )}
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {/* Dropdown with instant filter */}
            {isDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="הקלד קוד FI (למשל 707) או שם סעיף..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-56 divide-y divide-slate-50">
                  {filteredDropdownItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      לא נמצא סעיף מתאים
                    </div>
                  ) : (
                    filteredDropdownItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedItemId(item.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`p-2.5 text-xs hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors ${
                          selectedItemId === item.id ? 'bg-blue-50/80 font-bold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                            {item.fi_code}
                          </span>
                          <span className="text-slate-800 truncate">{item.name}</span>
                          <span className="text-slate-400 text-[11px] truncate">
                            ({item.group})
                          </span>
                        </div>
                        {selectedItemId === item.id && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                תאריך ההוצאה <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                סכום בש"ח (כולל מע"מ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₪</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-2 text-xs font-black text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Vendor & Invoice Reference Number Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שם הספק / בית העסק <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="למשל: סלופארק, פז, קייטרינג"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                מספר חשבונית / אסמכתא <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="למשל: INV-10492"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              הערות ופירוט נוסף
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <textarea
                rows={2}
                placeholder="פירוט רכישה, מחלקה מקושרת, או יעד..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs resize-none"
              />
            </div>
          </div>

          {/* File Attachment (Invoice / Receipt PDF or Image) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              צירוף צילום חשבונית / מסמך PDF (אופציונלי)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setAttachmentName(f.name);
                  setAttachmentType(f.type);
                  const r = new FileReader();
                  r.onload = (ev) => {
                    setAttachmentData(ev.target?.result as string);
                  };
                  r.readAsDataURL(f);
                }
              }}
              className="hidden"
            />
            {attachmentName ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold truncate">
                  <Paperclip className="w-4 h-4 shrink-0" />
                  <span className="truncate">{attachmentName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName('');
                    setAttachmentType('');
                    setAttachmentData('');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-xl text-xs text-slate-600 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>לחץ להעלאת צילום חשבונית או קובץ PDF</span>
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>שמור הוצאה במערכת</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Check,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  MessageSquare,
  Paperclip,
  Upload,
  Trash2,
  Hash,
  User,
  CheckCircle2,
  Tag,
  Briefcase,
} from 'lucide-react';
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
  // Core FI item
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // 13 Required Fields:
  // Date opened | Vendor | מספר ספק | Cost | חברה | Details | PO | PD | הערות | עוד הערות... | User | Status | Date approved
  const [dateOpened, setDateOpened] = useState<string>('');
  const [vendor, setVendor] = useState<string>('');
  const [vendorNumber, setVendorNumber] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [company, setCompany] = useState<string>('IDE Technologies');
  const [details, setDetails] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [pdNumber, setPdNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [extraNotes, setExtraNotes] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [status, setStatus] = useState<string>('Approved');
  const [dateApproved, setDateApproved] = useState<string>('');

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
      setDateOpened(today);
      setDateApproved(today);
      setVendor('');
      setVendorNumber('');
      setCost('');
      setCompany('IDE Technologies');
      setDetails('');
      setPoNumber('');
      setPdNumber('');
      setNotes('');
      setExtraNotes('');
      setUserName('');
      setStatus('Approved');
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
    const numberOnlyCode = item.fi_code.replace(/[^0-9]/g, '');
    const matchNumber = numberOnlyCode.includes(q.replace(/[^0-9]/g, ''));
    return matchCode || matchName || matchGroup || (q.match(/^[0-9]+$/) && matchNumber);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId) {
      alert('אנא בחר סעיף תקציבי וקוד FI');
      return;
    }
    const parsedAmount = parseFloat(cost);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('אנא הזן סכום / Cost תקין');
      return;
    }
    if (!vendor.trim()) {
      alert('אנא הזן שם ספק / Vendor');
      return;
    }

    const item = budgetItems.find((i) => i.id === selectedItemId);
    const fi_code = item ? item.fi_code : '';
    const ref_number = poNumber.trim() || pdNumber.trim() || `INV-${Date.now().toString().slice(-5)}`;

    onSaveExpense({
      budget_item_id: selectedItemId,
      fi_code,
      date: dateOpened || new Date().toISOString().slice(0, 10),
      amount: parsedAmount,
      vendor: vendor.trim(),
      vendor_number: vendorNumber.trim() || undefined,
      company: company.trim() || undefined,
      details: details.trim() || undefined,
      po_number: poNumber.trim() || undefined,
      pd_number: pdNumber.trim() || undefined,
      ref_number,
      notes: notes.trim() || undefined,
      extra_notes: extraNotes.trim() || undefined,
      user_name: userName.trim() || undefined,
      status: status.trim() || undefined,
      date_approved: dateApproved.trim() || undefined,
      attachment_name: attachmentName || undefined,
      attachment_type: attachmentType || undefined,
      attachment_data: attachmentData || undefined,
    });

    // Delightful confetti celebration
    try {
      confetti({
        particleCount: 35,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-['Assistant',sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                רישום והעלאת חשבונית חדשה
              </h3>
              <p className="text-xs text-slate-500">
                טופס מובנה הכולל את כל שדות החשבונית (ספק, PO, PD, עלות, חברה, אישורים)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3.5 overflow-y-auto flex-1 pr-1">
          
          {/* Smart Select: Budget Item with Instant FI Search */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              סעיף תקציב וקוד FI <span className="text-rose-500">*</span>
            </label>

            <div
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3.5 py-2 text-xs text-right cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
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

          {/* Row 1: Date opened | Date approved | Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date opened (תאריך פתיחה) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={dateOpened}
                  onChange={(e) => setDateOpened(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-mono font-medium focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date approved (תאריך אישור)
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  value={dateApproved}
                  onChange={(e) => setDateApproved(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-mono font-medium focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status (סטטוס)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:bg-white focus:border-blue-500 cursor-pointer"
              >
                <option value="Approved">Approved (אושר)</option>
                <option value="Pending">Pending (ממתין לאישור)</option>
                <option value="In Review">In Review (בבדיקה)</option>
                <option value="Paid">Paid (שולם)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Vendor | מספר ספק | חברה */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor (שם ספק) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="למשל: סלופארק, פז, קייטרינג"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-bold focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                מספר ספק
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="למשל: 51482019"
                  value={vendorNumber}
                  onChange={(e) => setVendorNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-mono focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                חברה (Company)
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="IDE Technologies"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-medium focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Cost | PO | PD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cost (עלות בש"ח) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₪</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-2.5 py-1.5 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PO (מספר הזמנת רכש)
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="למשל: PO-450012"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-mono font-bold text-blue-700 focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PD (מספר דרישת רכש / תשלום)
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="למשל: PD-10023"
                  value={pdNumber}
                  onChange={(e) => setPdNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs font-mono font-bold text-indigo-700 focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Details | User */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Details (פירוט / תיאור ההוצאה)
              </label>
              <input
                type="text"
                placeholder="פירוט רכישה, שירות, יעד, או אספקה..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                User (משתמש / דורש)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="שם העובד / דורש"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-2.5 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: הערות | עוד הערות... */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                הערות
              </label>
              <textarea
                rows={2}
                placeholder="הערות שוטפות..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                עוד הערות...
              </label>
              <textarea
                rows={2}
                placeholder="הערות ניהוליות או פירוט נוסף..."
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* File Attachment */}
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
              <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold truncate">
                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
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
                className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-xl text-xs text-slate-600 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
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
              <span>שמור חשבונית במערכת</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

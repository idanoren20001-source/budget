import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Save,
  SlidersHorizontal,
  Check,
  AlertCircle,
} from 'lucide-react';
import { BudgetItem } from '../types';
import { INITIAL_GROUPS } from '../data/initialData';
import { formatCurrency } from '../utils/budgetUtils';

interface BudgetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BudgetItem[];
  onSaveItems: (updatedItems: BudgetItem[]) => void;
}

export const BudgetManagerModal: React.FC<BudgetManagerModalProps> = ({
  isOpen,
  onClose,
  items,
  onSaveItems,
}) => {
  const [localItems, setLocalItems] = useState<BudgetItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);

  // New item form
  const [newFiCode, setNewFiCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState(INITIAL_GROUPS[0].name);
  const [newMonthlyBudget, setNewMonthlyBudget] = useState('');

  // Sync state when opening modal
  React.useEffect(() => {
    if (isOpen) {
      setLocalItems(JSON.parse(JSON.stringify(items)));
      setHasChanges(false);
      setShowAddNew(false);
      setSearchTerm('');
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleItemChange = (
    id: string,
    field: 'fi_code' | 'name' | 'monthly_budget',
    value: any
  ) => {
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === 'monthly_budget' ? parseFloat(value) || 0 : value,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    setHasChanges(true);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הסעיף "${name}"?`)) {
      setLocalItems((prev) => prev.filter((item) => item.id !== id));
      setHasChanges(true);
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiCode.trim() || !newName.trim()) {
      alert('נא למלא קוד FI ושם סעיף');
      return;
    }
    const budgetVal = parseFloat(newMonthlyBudget) || 0;
    const newItem: BudgetItem = {
      id: `bi-custom-${Date.now()}`,
      fi_code: newFiCode.trim(),
      name: newName.trim(),
      group: newGroup,
      monthly_budget: budgetVal,
      updated_at: new Date().toISOString(),
    };

    setLocalItems((prev) => [newItem, ...prev]);
    setHasChanges(true);
    setNewFiCode('');
    setNewName('');
    setNewMonthlyBudget('');
    setShowAddNew(false);
  };

  const handleSaveAll = () => {
    onSaveItems(localItems);
    setHasChanges(false);
    onClose();
  };

  const filtered = localItems.filter((item) => {
    if (groupFilter !== 'all' && item.group !== groupFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.fi_code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                ניהול ועריכת תקציבים וקודי FI
              </h3>
              <p className="text-xs text-slate-400">
                עריכה מרוכזת של כלל סעיפי הארגון, שינוי קודים והגדרת מסגרות חודשיות
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

        {/* Controls: Search, Filter, and Add New Toggle */}
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="חיפוש סעיף או קוד FI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Group selector */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">כל הקבוצות</option>
              {INITIAL_GROUPS.map((g) => (
                <option key={g.code} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowAddNew(!showAddNew)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוספת סעיף חדש</span>
            </button>
          </div>
        </div>

        {/* Form: Add New Item Drawer/Card */}
        {showAddNew && (
          <form
            onSubmit={handleAddNewItem}
            className="mb-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl shrink-0 animate-in fade-in duration-100"
          >
            <div className="text-xs font-bold text-blue-900 mb-2">
              הוספת סעיף תקציבי חדש למערכת:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="קוד FI (למשל FI-801)"
                value={newFiCode}
                onChange={(e) => setNewFiCode(e.target.value)}
                required
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
              />
              <input
                type="text"
                placeholder="שם הסעיף"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
              />
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
              >
                {INITIAL_GROUPS.map((g) => (
                  <option key={g.code} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="תקציב חודשי (₪)"
                  value={newMonthlyBudget}
                  onChange={(e) => setNewMonthlyBudget(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                >
                  הוסף
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Scrollable Items Table */}
        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-2xl divide-y divide-slate-100">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 sticky top-0 z-10 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-28">קוד FI</th>
                <th className="py-2.5 px-3">שם הסעיף</th>
                <th className="py-2.5 px-3">קבוצה</th>
                <th className="py-2.5 px-3 w-36 text-left">תקציב חודשי בסיס (₪)</th>
                <th className="py-2.5 px-3 w-16 text-center">מחיקה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* FI Code */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.fi_code}
                      onChange={(e) =>
                        handleItemChange(item.id, 'fi_code', e.target.value)
                      }
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
                    />
                  </td>

                  {/* Name */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(item.id, 'name', e.target.value)
                      }
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
                    />
                  </td>

                  {/* Group */}
                  <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                    {item.group}
                  </td>

                  {/* Monthly Budget */}
                  <td className="py-2 px-3 text-left">
                    <div className="relative inline-flex items-center w-full">
                      <span className="absolute right-2 text-slate-400 text-xs">₪</span>
                      <input
                        type="number"
                        value={item.monthly_budget}
                        onChange={(e) =>
                          handleItemChange(item.id, 'monthly_budget', e.target.value)
                        }
                        className="w-full bg-white border border-slate-200 rounded pr-6 pl-2 py-1 text-xs font-bold text-left text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </td>

                  {/* Delete Button */}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="מחק סעיף"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 mt-4 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            סה"כ: <strong>{localItems.length} סעיפים</strong>
            {hasChanges && (
              <span className="mr-2 text-amber-600 font-bold">
                • קיימים שינויים שטרם נשמרו
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              ביטול
            </button>
            <button
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>שמור את כל השינויים</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

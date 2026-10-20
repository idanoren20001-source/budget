import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  DollarSign,
  PlusCircle,
  Edit2,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  Clock,
  User,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { AuditLog, AuditActionType } from '../types';

interface AuditTrailTableProps {
  logs: AuditLog[];
  onDeleteLogs?: (ids: string[]) => void;
  onClearAllLogs?: () => void;
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  logs,
  onDeleteLogs,
  onClearAllLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.action_type !== actionFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          log.entity_name.toLowerCase().includes(q) ||
          (log.fi_code && log.fi_code.toLowerCase().includes(q)) ||
          log.details.toLowerCase().includes(q) ||
          (log.user && log.user.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, actionFilter, searchTerm]);

  // Selection
  const isAllSelected =
    filteredLogs.length > 0 &&
    filteredLogs.every((l) => selectedIds.includes(l.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLogs.map((l) => l.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (
      confirm(
        `האם למחוק ${selectedIds.length} רשומות מיומן הפעולות? פעולה זו תוסר מההיסטוריה.`
      )
    ) {
      if (onDeleteLogs) {
        onDeleteLogs(selectedIds);
      }
      setSelectedIds([]);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'האם אתה בטוח שברצונך לאפס ולמחוק את כל יומן הפעולות והשינויים? (לא מומלץ למחוק היסטוריה ארגונית)'
      )
    ) {
      if (onClearAllLogs) {
        onClearAllLogs();
      }
      setSelectedIds([]);
    }
  };

  const getActionBadge = (type: AuditActionType) => {
    switch (type) {
      case 'budget_update':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold">
            <SlidersHorizontal className="w-3 h-3 text-blue-600" />
            עדכון תקציב
          </span>
        );
      case 'expense_create':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold">
            <PlusCircle className="w-3 h-3 text-emerald-600" />
            רישום הוצאה
          </span>
        );
      case 'expense_update':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold">
            <Edit2 className="w-3 h-3 text-amber-600" />
            עריכת הוצאה
          </span>
        );
      case 'expense_delete':
      case 'item_delete':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold">
            <Trash2 className="w-3 h-3 text-rose-600" />
            מחיקה
          </span>
        );
      case 'system_restore':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200/60 px-2 py-0.5 rounded-full text-[11px] font-bold">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            שחזור מערכת
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-bold">
            פעולה
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-8">
      
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                יומן פעולות ושינויים (Audit Trail & Change History)
              </h3>
              <p className="text-xs text-slate-500">
                תיעוד אוטומטי של כל עדכון תקציב, רישום הוצאה או שינוי במערכת ({logs.length} רשומות)
              </p>
            </div>
          </div>
        </div>

        {/* Filter, Search & Clear */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש לפי סעיף, FI או פעולה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">כל סוגי הפעולות</option>
            <option value="budget_update">עדכוני תקציב</option>
            <option value="expense_create">רישום הוצאות חדשות</option>
            <option value="expense_update">עריכת הוצאות</option>
            <option value="expense_delete">מחיקות</option>
            <option value="system_restore">שחזור מערכת</option>
          </select>

          {logs.length > 0 && onClearAllLogs && (
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 transition-colors whitespace-nowrap cursor-pointer"
              title="נקה יומן שלם"
            >
              נקה הכל
            </button>
          )}
        </div>
      </div>

      {/* Bulk Toolbar for Audit Logs */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="bg-slate-700 px-2 py-0.5 rounded font-bold">
              {selectedIds.length} רשומות נבחרו
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>מחק רשומות נבחרות</span>
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              בטל בחירה
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="בחר / בטל הכל"
                />
              </th>
              <th className="py-3 px-3.5 w-40">מועד הפעולה</th>
              <th className="py-3 px-3.5 w-32">סוג פעולה</th>
              <th className="py-3 px-3.5 w-24">קוד FI</th>
              <th className="py-3 px-3.5 w-48">ישות / סעיף</th>
              <th className="py-3 px-3.5">פירוט השינוי</th>
              <th className="py-3 px-3.5 w-28">משתמש</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  לא נמצאו רשומות ביומן הפעולות התואמות את החיפוש.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <tr
                    key={log.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(log.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('he-IL', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {getActionBadge(log.action_type)}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {log.fi_code ? (
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.fi_code}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.entity_name}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-700 leading-relaxed">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.user || 'משתמש'}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

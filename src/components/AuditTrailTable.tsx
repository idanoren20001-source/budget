import React, { useState } from 'react';
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
} from 'lucide-react';
import { AuditLog, AuditActionType } from '../types';

interface AuditTrailTableProps {
  logs: AuditLog[];
}

export const AuditTrailTable: React.FC<AuditTrailTableProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
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
                תיעוד אוטומטי של כל עדכון תקציב, רישום הוצאה או שינוי במערכת
              </p>
            </div>
          </div>
        </div>

        {/* Filter and Search */}
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
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold">
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
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  לא נמצאו רשומות ביומן הפעולות התואמות את החיפוש.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
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
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

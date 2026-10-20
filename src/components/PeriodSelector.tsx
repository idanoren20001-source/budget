import React from 'react';
import { Calendar, Filter, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { PeriodFilter, PeriodType } from '../types';
import { HEBREW_MONTHS, getPeriodLabel } from '../utils/budgetUtils';

interface PeriodSelectorProps {
  filter: PeriodFilter;
  onChange: (newFilter: PeriodFilter) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ filter, onChange }) => {
  const currentYear = filter.year;

  const handleTypeChange = (type: PeriodType) => {
    if (type === 'monthly') {
      onChange({
        type: 'monthly',
        year: filter.year,
        month: filter.month || 10, // Default to October
      });
    } else if (type === 'quarterly') {
      const q = filter.month ? Math.ceil(filter.month / 3) : 4;
      onChange({
        type: 'quarterly',
        year: filter.year,
        quarter: q,
      });
    } else {
      onChange({
        type: 'annual',
        year: filter.year,
      });
    }
  };

  const handleYearChange = (year: number) => {
    onChange({ ...filter, year });
  };

  const handleMonthChange = (month: number) => {
    onChange({ ...filter, month });
  };

  const handleQuarterChange = (quarter: number) => {
    onChange({ ...filter, quarter });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Type Switcher (Monthly / Quarterly / Annual) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-xs ml-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>תקופת דיווח:</span>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => handleTypeChange('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter.type === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              חודשי (בסיס)
            </button>
            <button
              onClick={() => handleTypeChange('quarterly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter.type === 'quarterly'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              רבעוני (פי 3)
            </button>
            <button
              onClick={() => handleTypeChange('annual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter.type === 'annual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              שנתי (פי 12)
            </button>
          </div>
        </div>

        {/* Center: Specific Selection Dropdowns */}
        <div className="flex items-center flex-wrap gap-2.5">
          
          {/* Year selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
            <span className="text-xs text-slate-500 font-medium">שנה:</span>
            <select
              value={currentYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Month selector if Monthly */}
          {filter.type === 'monthly' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <span className="text-xs text-slate-500 font-medium">חודש:</span>
              <select
                value={filter.month || 10}
                onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {HEBREW_MONTHS.map((monthName, idx) => (
                  <option key={idx} value={idx + 1}>
                    {monthName} (חודש {idx + 1})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quarter selector if Quarterly */}
          {filter.type === 'quarterly' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <span className="text-xs text-slate-500 font-medium">רבעון:</span>
              <select
                value={filter.quarter || 1}
                onChange={(e) => handleQuarterChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value={1}>רבעון 1 (ינואר - מרץ)</option>
                <option value={2}>רבעון 2 (אפריל - יוני)</option>
                <option value={3}>רבעון 3 (יולי - ספטמבר)</option>
                <option value={4}>רבעון 4 (אוקטובר - דצמבר)</option>
              </select>
            </div>
          )}

        </div>

        {/* Right: Active Period Badge with calculation multiplier explanation */}
        <div className="flex items-center gap-2 self-start lg:self-auto bg-blue-50/70 border border-blue-200/70 text-blue-900 rounded-xl px-3 py-1.5 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            תקופה מוצגת: <strong>{getPeriodLabel(filter)}</strong>
          </span>
          <span className="text-blue-500">•</span>
          <span className="text-blue-700">
            {filter.type === 'monthly' && 'חישוב לפי תקציב חודשי בסיסי (1x)'}
            {filter.type === 'quarterly' && 'חישוב תקציב מוכפל פי 3 (3 חודשים)'}
            {filter.type === 'annual' && 'חישוב תקציב שנתי מוכפל פי 12 (שנה מלאה)'}
          </span>
        </div>

      </div>
    </div>
  );
};

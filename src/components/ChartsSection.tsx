import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { GroupSummary, BudgetItemCalculated, Expense } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ChartsSectionProps {
  groups: GroupSummary[];
  items?: BudgetItemCalculated[];
  expenses?: Expense[];
  currentYear?: number;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#f97316', // Orange
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  groups,
  items = [],
  expenses = [],
  currentYear = 2026,
}) => {
  const [activeView, setActiveView] = useState<'categories' | 'quarterly'>('categories');

  // --- Category Bar & Donut Data ---
  const barData = useMemo(() => {
    return groups.map((g) => ({
      name: g.group,
      shortName: g.group.length > 14 ? g.group.slice(0, 14) + '...' : g.group,
      'תקציב מאושר': g.total_budget,
      'ביצוע בפועל': g.total_spend,
    }));
  }, [groups]);

  const donutData = useMemo(() => {
    return groups
      .filter((g) => g.total_spend > 0)
      .map((g, index) => ({
        name: g.group,
        value: g.total_spend,
        color: COLORS[index % COLORS.length],
      }));
  }, [groups]);

  const totalSpent = useMemo(() => {
    return donutData.reduce((acc, curr) => acc + curr.value, 0);
  }, [donutData]);

  // --- Quarterly Plan vs Actual Breakdown (Option 2) ---
  const quarterlyAnalysis = useMemo(() => {
    // 1. Calculate Planned Budget per quarter from all items
    let q1Budget = 0;
    let q2Budget = 0;
    let q3Budget = 0;
    let q4Budget = 0;

    items.forEach((item) => {
      if (item.quarterly_budget) {
        q1Budget += item.quarterly_budget.q1 ?? item.monthly_budget * 3;
        q2Budget += item.quarterly_budget.q2 ?? item.monthly_budget * 3;
        q3Budget += item.quarterly_budget.q3 ?? item.monthly_budget * 3;
        q4Budget += item.quarterly_budget.q4 ?? item.monthly_budget * 3;
      } else if (item.annual_budget) {
        const qVal = Math.round(item.annual_budget / 4);
        q1Budget += qVal;
        q2Budget += qVal;
        q3Budget += qVal;
        q4Budget += qVal;
      } else {
        const qVal = item.monthly_budget * 3;
        q1Budget += qVal;
        q2Budget += qVal;
        q3Budget += qVal;
        q4Budget += qVal;
      }
    });

    // 2. Calculate Actual Spend per quarter from expenses matching current year
    let q1Spend = 0;
    let q2Spend = 0;
    let q3Spend = 0;
    let q4Spend = 0;

    expenses.forEach((exp) => {
      if (!exp.date) return;
      const [yearStr, monthStr] = exp.date.split('-');
      if (parseInt(yearStr, 10) !== currentYear) return;
      const month = parseInt(monthStr, 10);

      if (month >= 1 && month <= 3) {
        q1Spend += exp.amount;
      } else if (month >= 4 && month <= 6) {
        q2Spend += exp.amount;
      } else if (month >= 7 && month <= 9) {
        q3Spend += exp.amount;
      } else if (month >= 10 && month <= 12) {
        q4Spend += exp.amount;
      }
    });

    const quarters = [
      {
        quarter: 'Q1 (ינואר-מרץ)',
        short: 'Q1',
        budget: q1Budget,
        spend: q1Spend,
        variance: q1Budget - q1Spend,
        pct: q1Budget > 0 ? (q1Spend / q1Budget) * 100 : 0,
        status: q1Spend > q1Budget ? 'over' : q1Spend >= q1Budget * 0.85 ? 'warning' : 'normal',
      },
      {
        quarter: 'Q2 (אפריל-יוני)',
        short: 'Q2',
        budget: q2Budget,
        spend: q2Spend,
        variance: q2Budget - q2Spend,
        pct: q2Budget > 0 ? (q2Spend / q2Budget) * 100 : 0,
        status: q2Spend > q2Budget ? 'over' : q2Spend >= q2Budget * 0.85 ? 'warning' : 'normal',
      },
      {
        quarter: 'Q3 (יולי-ספטמבר)',
        short: 'Q3',
        budget: q3Budget,
        spend: q3Spend,
        variance: q3Budget - q3Spend,
        pct: q3Budget > 0 ? (q3Spend / q3Budget) * 100 : 0,
        status: q3Spend > q3Budget ? 'over' : q3Spend >= q3Budget * 0.85 ? 'warning' : 'normal',
      },
      {
        quarter: 'Q4 (אוקטובר-דצמבר)',
        short: 'Q4',
        budget: q4Budget,
        spend: q4Spend,
        variance: q4Budget - q4Spend,
        pct: q4Budget > 0 ? (q4Spend / q4Budget) * 100 : 0,
        status: q4Spend > q4Budget ? 'over' : q4Spend >= q4Budget * 0.85 ? 'warning' : 'normal',
      },
    ];

    const totalAnnualBudget = q1Budget + q2Budget + q3Budget + q4Budget;
    const totalAnnualSpend = q1Spend + q2Spend + q3Spend + q4Spend;
    const annualPct = totalAnnualBudget > 0 ? (totalAnnualSpend / totalAnnualBudget) * 100 : 0;

    // Projected year-end spend calculation based on current progress
    // Assume current date in 2026 (e.g. October -> ~294 days into 365)
    const daysPassed = 294; // approx Oct 21
    const totalDays = 365;
    const dailyRate = daysPassed > 0 ? totalAnnualSpend / daysPassed : 0;
    const projectedEndSpend = Math.round(dailyRate * totalDays);
    const projectedVariance = totalAnnualBudget - projectedEndSpend;

    return {
      quarters,
      totalAnnualBudget,
      totalAnnualSpend,
      annualPct,
      projectedEndSpend,
      projectedVariance,
    };
  }, [items, expenses, currentYear]);

  // Chart data for Quarterly Plan vs Actual
  const quarterlyChartData = useMemo(() => {
    return quarterlyAnalysis.quarters.map((q) => ({
      name: q.quarter,
      short: q.short,
      'תקציב מתוכנן': q.budget,
      'ביצוע בפועל': q.spend,
    }));
  }, [quarterlyAnalysis]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 mb-8">
      
      {/* Top Toggle Bar: Categories View vs. Quarterly Breakdown */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            {activeView === 'quarterly' ? (
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            ) : (
              <BarChart3 className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activeView === 'quarterly'
                ? `השוואה רבעונית ותחזית תקציבית לשנת ${currentYear}`
                : 'ניתוח חזותי: ביצוע מול תקציב לפי קטגוריות'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeView === 'quarterly'
                ? 'מעקב רבעוני צמוד (Q1 עד Q4), פערים תקציביים ותחזית צפויה לסוף השנה'
                : 'השוואת ביצוע מול תקציב והתפלגות הוצאות לפי תחומי פעילות'}
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveView('categories')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'categories'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>לפי קטגוריות</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('quarterly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'quarterly'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-indigo-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>השוואה רבעונית (Q1-Q4)</span>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              חדש
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Categories View (Double Bar + Donut Chart) */}
      {activeView === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Bar Chart: Budget vs Actual per Group */}
          <div className="lg:col-span-7">
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    labelFormatter={(label) => `קבוצה: ${label}`}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0',
                      direction: 'rtl',
                      textAlign: 'right',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="תקציב מאושר"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="ביצוע בפועל"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart: Distribution */}
          <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-slate-100 lg:pr-5 pt-4 lg:pt-0">
            <div>
              <div className="h-56 w-full relative" dir="ltr">
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [
                          `${formatCurrency(Number(val))} (${((Number(val) / (totalSpent || 1)) * 100).toFixed(1)}%)`,
                          'הוצאה',
                        ]}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid #e2e8f0',
                          direction: 'rtl',
                          textAlign: 'right',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    אין הוצאות להצגה בתקופה זו
                  </div>
                )}

                {donutData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] text-slate-400 font-medium">סך ביצוע</span>
                    <span className="text-sm font-black text-slate-800 font-mono">
                      {formatCurrency(totalSpent)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
              {donutData.map((entry) => {
                const pct = totalSpent > 0 ? (entry.value / totalSpent) * 100 : 0;
                return (
                  <div key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate max-w-[125px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-slate-600 truncate">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 shrink-0">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Quarterly Plan vs Actual Breakdown (Option 2) */}
      {activeView === 'quarterly' && (
        <div className="space-y-6">
          
          {/* 4 Quarterly Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {quarterlyAnalysis.quarters.map((q) => {
              const isOver = q.status === 'over';
              const isWarning = q.status === 'warning';

              return (
                <div
                  key={q.short}
                  className={`rounded-2xl border p-4 transition-all ${
                    isOver
                      ? 'bg-rose-50/60 border-rose-200'
                      : isWarning
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{q.quarter}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {q.pct.toFixed(0)}% ניצול
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>תקציב מתוכנן:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrency(q.budget)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>ביצוע בפועל:</span>
                      <span className="font-mono font-bold text-indigo-950">
                        {formatCurrency(q.spend)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/80 font-bold">
                      <span className={isOver ? 'text-rose-700' : 'text-slate-700'}>
                        {isOver ? 'חריגה ברבעון:' : 'יתרה ברבעון:'}
                      </span>
                      <span
                        className={`font-mono ${
                          isOver ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {isOver
                          ? `+${formatCurrency(Math.abs(q.variance))}`
                          : formatCurrency(q.variance)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, q.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quarterly Paired Bar Chart + Forecast Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            
            {/* Chart: Q1 to Q4 */}
            <div className="lg:col-span-8">
              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={quarterlyChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#334155', fontSize: 11, fontWeight: 'bold' }}
                      height={35}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => `₪${(val / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value)), '']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0',
                        direction: 'rtl',
                        textAlign: 'right',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="תקציב מתוכנן"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                    <Bar
                      dataKey="ביצוע בפועל"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Annual Forecast & Burn Rate Banner */}
            <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  תחזית שנתית לסוף {currentYear}
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-slate-300">תקציב שנתי כולל (4 רבעונים):</div>
                  <div className="text-xl font-black font-mono mt-0.5">
                    {formatCurrency(quarterlyAnalysis.totalAnnualBudget)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-slate-300">ביצוע בפועל מצטבר:</div>
                  <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(quarterlyAnalysis.totalAnnualSpend)} ({quarterlyAnalysis.annualPct.toFixed(1)}%)
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/80">
                  <div className="text-[11px] text-indigo-300">צפי הוצאה לסוף השנה (Forecast):</div>
                  <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                    {formatCurrency(quarterlyAnalysis.projectedEndSpend)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {quarterlyAnalysis.projectedVariance >= 0
                      ? `חיסכון צפוי של ${formatCurrency(quarterlyAnalysis.projectedVariance)} מתחת לתקציב`
                      : `חריגה צפויה של ${formatCurrency(Math.abs(quarterlyAnalysis.projectedVariance))} מעל התקציב`}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

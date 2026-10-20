import React from 'react';
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
import { GroupSummary } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface ChartsSectionProps {
  groups: GroupSummary[];
}

const COLORS = [
  '#3b82f6', // Blue (הסעדה)
  '#10b981', // Emerald (תפעול ואחזקה)
  '#8b5cf6', // Violet (ציוד משרדי)
  '#06b6d4', // Cyan (תקשורת ומחשוב)
  '#f59e0b', // Amber (נדל"ן)
  '#ec4899', // Pink (נסיעות)
  '#f97316', // Orange (רכבים ודלק)
];

export const ChartsSection: React.FC<ChartsSectionProps> = ({ groups }) => {
  // Data for bar chart: Budget vs Actual
  const barData = groups.map((g) => ({
    name: g.group,
    shortName: g.group.length > 14 ? g.group.slice(0, 14) + '...' : g.group,
    'תקציב מאושר': g.total_budget,
    'ביצוע בפועל': g.total_spend,
  }));

  // Data for donut chart: distribution of actual spend > 0
  const donutData = groups
    .filter((g) => g.total_spend > 0)
    .map((g, index) => ({
      name: g.group,
      value: g.total_spend,
      color: COLORS[index % COLORS.length],
    }));

  const totalSpent = donutData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
      
      {/* 1. Bar Chart: Budget vs Actual Comparison (8 cols on lg) */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                תקציב מול ביצוע לפי קבוצות ראשיות
              </h3>
              <p className="text-xs text-slate-400">
                השוואה שקלית של מסגרת התקציב מול סך ההוצאות בפועל
              </p>
            </div>
          </div>
        </div>

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

      {/* 2. Donut Chart: Actual Expenses Distribution (5 cols on lg) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                התפלגות הוצאות בפועל לפי תחומים
              </h3>
              <p className="text-xs text-slate-400">
                חלוקת העוגה של סך התשלומים שבוצעו
              </p>
            </div>
          </div>

          <div className="h-60 w-full relative" dir="ltr">
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
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
                      'סכום',
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

            {/* Inner text inside donut */}
            {donutData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[11px] text-slate-400 font-medium">סך ביצוע</span>
                <span className="text-sm font-black text-slate-800">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Legend underneath */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
          {donutData.map((entry) => {
            const pct = totalSpent > 0 ? (entry.value / totalSpent) * 100 : 0;
            return (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate max-w-[130px]">
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
  );
};

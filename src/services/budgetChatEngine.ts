import { BudgetItem, Expense, BudgetItemCalculated, AuditLog, PeriodFilter } from '../types';
import { formatCurrency, calculateBudgetItems } from '../utils/budgetUtils';
import { INITIAL_GROUPS } from '../data/initialData';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  structuredData?: {
    type: 'kpi' | 'table' | 'items_list' | 'vendors_list' | 'comparison';
    title?: string;
    totalAmount?: number;
    items?: Array<{
      label: string;
      value: string | number;
      secondary?: string;
      badge?: { text: string; color: 'red' | 'yellow' | 'green' | 'blue' };
    }>;
  };
}

export interface SuggestedQuestion {
  id: string;
  text: string;
  category: 'expenses' | 'budget' | 'vendors' | 'groups';
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: '1',
    text: 'כמה כסף הוצאנו בחודש אוקטובר בסך הכל?',
    category: 'expenses',
  },
  {
    id: '2',
    text: 'כמה הוצאנו בחודש מסוים בתפעול ואחזקה?',
    category: 'groups',
  },
  {
    id: '3',
    text: 'אילו סעיפים נמצאים כרגע בחריגה תקציבית?',
    category: 'budget',
  },
  {
    id: '4',
    text: 'מי הספק שהוצאנו עליו הכי הרבה כסף?',
    category: 'vendors',
  },
  {
    id: '5',
    text: 'מה היתרה שנותרה ברכבים ודלק?',
    category: 'budget',
  },
  {
    id: '6',
    text: 'מהן 5 ההוצאות הגבוהות ביותר שנרשמו?',
    category: 'expenses',
  },
  {
    id: '7',
    text: 'מה תמונת המצב התקציבית הכללית החודש?',
    category: 'budget',
  },
];

const MONTH_NAMES_HEBREW: Record<string, number> = {
  'ינואר': 1,
  'פברואר': 2,
  'מרץ': 3,
  'אפריל': 4,
  'מאי': 5,
  'יוני': 6,
  'יולי': 7,
  'אוגוסט': 8,
  'ספטמבר': 9,
  'אוקטובר': 10,
  'נובמבר': 11,
  'דצמבר': 12,
};

/**
 * Parses user natural language query and computes accurate financial answers.
 */
export function answerBudgetQuestion(
  query: string,
  budgetItems: BudgetItem[],
  expenses: Expense[],
  currentFilter: PeriodFilter
): Omit<ChatMessage, 'id' | 'timestamp'> {
  const q = query.trim().toLowerCase();

  // 1. Identify target month if mentioned
  let targetMonth: number | null = null;
  for (const [name, num] of Object.entries(MONTH_NAMES_HEBREW)) {
    if (q.includes(name)) {
      targetMonth = num;
      break;
    }
  }

  // Also check for "חודש X" (e.g., חודש 10)
  const monthNumMatch = q.match(/חודש\s*(\d{1,2})/);
  if (monthNumMatch && !targetMonth) {
    const val = parseInt(monthNumMatch[1], 10);
    if (val >= 1 && val <= 12) {
      targetMonth = val;
    }
  }

  if (q.includes('החודש') && !targetMonth) {
    targetMonth = currentFilter.month || new Date().getMonth() + 1;
  } else if (q.includes('חודש שעבר') && !targetMonth) {
    const cur = currentFilter.month || new Date().getMonth() + 1;
    targetMonth = cur > 1 ? cur - 1 : 12;
  }

  // 2. Identify target group if mentioned
  let targetGroup: string | null = null;
  const groupsList = [
    { name: 'תפעול ואחזקה', keys: ['תפעול', 'אחזקה', 'תפעול ואחזקה', 'אחזקת'] },
    { name: 'הסעדה וכיבוד', keys: ['הסעדה', 'אוכל', 'כיבוד', 'קייטרינג'] },
    { name: 'רכבים ודלק', keys: ['רכב', 'רכבים', 'דלק', 'ליסינג', 'חניה'] },
    { name: 'תקשורת ומחשוב', keys: ['תקשורת', 'מחשוב', 'אינטרנט', 'סלולר', 'חומרה'] },
    { name: 'נדל"ן ושכירות', keys: ['נדל"ן', 'נדלן', 'שכירות', 'ארנונה', 'דמי ניהול'] },
    { name: 'מערכות מידע ותוכנה', keys: ['מערכות מידע', 'תוכנה', 'ענן', 'רישיונות'] },
    { name: 'הנהלה וכלליות', keys: ['הנהלה', 'כלליות', 'ביטוח', 'יועצים', 'משפטי'] },
  ];

  for (const g of groupsList) {
    if (g.keys.some((k) => q.includes(k))) {
      targetGroup = g.name;
      break;
    }
  }

  // Month label for response
  const monthName = targetMonth
    ? Object.keys(MONTH_NAMES_HEBREW).find((k) => MONTH_NAMES_HEBREW[k] === targetMonth) || `חודש ${targetMonth}`
    : null;

  // Filter expenses according to detected month
  const targetYear = 2026;
  const filteredExpenses = expenses.filter((e) => {
    if (!targetMonth) return true; // all if unspecified, or period
    const [y, m] = e.date.split('-').map(Number);
    return y === targetYear && m === targetMonth;
  });

  // Calculate items for this period
  const filterForCalc: PeriodFilter = {
    type: 'monthly',
    year: targetYear,
    month: targetMonth || currentFilter.month || 10,
  };
  const calculated = calculateBudgetItems(budgetItems, expenses, filterForCalc);

  // --- INTENT ROUTING ---

  // A. Over-budget items intent (חריגות / סעיפים חורגים / אדומים)
  if (q.includes('חריג') || q.includes('חריגה') || q.includes('חריגות') || q.includes('אדום') || q.includes('מעל התקציב')) {
    const overItems = calculated.filter((i) => i.status === 'over');
    const warningItems = calculated.filter((i) => i.status === 'warning');

    if (overItems.length === 0 && warningItems.length === 0) {
      return {
        sender: 'assistant',
        text: `חדשות מעולות! ${monthName ? `בחודש ${monthName}` : 'בתקופה הנוכחית'} אין אף סעיף בחריגה או באזהרה. כל הסעיפים עומדים במסגרת התקציב המאושרת (מתחת ל-80% ניצול).`,
      };
    }

    const itemsData = [
      ...overItems.map((i) => ({
        label: `${i.fi_code} - ${i.name}`,
        value: `${formatCurrency(i.actual_spend)} (מתוך ${formatCurrency(i.adjusted_budget)})`,
        secondary: `חריגה של ${formatCurrency(i.actual_spend - i.adjusted_budget)} (${i.utilization_pct.toFixed(0)}%)`,
        badge: { text: `חריגה (${i.utilization_pct.toFixed(0)}%)`, color: 'red' as const },
      })),
      ...warningItems.map((i) => ({
        label: `${i.fi_code} - ${i.name}`,
        value: `${formatCurrency(i.actual_spend)} (מתוך ${formatCurrency(i.adjusted_budget)})`,
        secondary: `נותרו ${formatCurrency(i.remaining_balance)} (${i.utilization_pct.toFixed(0)}%)`,
        badge: { text: `אזהרה (${i.utilization_pct.toFixed(0)}%)`, color: 'yellow' as const },
      })),
    ];

    return {
      sender: 'assistant',
      text: `נמצאו ${overItems.length} סעיפים בחריגה אדומה (מעל 100%) ו-${warningItems.length} סעיפים באזהרה (80%-99%) ${monthName ? `עבור חודש ${monthName}` : 'בתקופה הנוכחית'}:`,
      structuredData: {
        type: 'items_list',
        title: 'סעיפים הדורשים תשומת לב תקציבית',
        items: itemsData,
      },
    };
  }

  // B. Specific Group Spend & Budget (כמה הוצאתי בתפעול ואחזקה / ברכבים / בהסעדה)
  if (targetGroup) {
    const groupItems = calculated.filter((i) => i.group === targetGroup);
    const totalGroupBudget = groupItems.reduce((s, i) => s + i.adjusted_budget, 0);
    const totalGroupSpend = groupItems.reduce((s, i) => s + i.actual_spend, 0);
    const groupBalance = totalGroupBudget - totalGroupSpend;
    const groupPct = totalGroupBudget > 0 ? (totalGroupSpend / totalGroupBudget) * 100 : 0;

    // Filter expenses directly for this group
    const groupItemIds = new Set(groupItems.map((i) => i.id));
    const groupExpenses = filteredExpenses.filter((e) => groupItemIds.has(e.budget_item_id));

    // Find top 3 expenses in this group
    const topGroupExpenses = [...groupExpenses].sort((a, b) => b.amount - a.amount).slice(0, 3);

    return {
      sender: 'assistant',
      text: `בקבוצת **${targetGroup}** ${monthName ? `בחודש ${monthName}` : 'בתקופה שנבחרה'}:\n\n` +
        `• **סך הכל ביצוע בפועל:** ${formatCurrency(totalGroupSpend)}\n` +
        `• **תקציב מוקצה:** ${formatCurrency(totalGroupBudget)}\n` +
        `• **יתרה תקציבית שנותרה:** ${formatCurrency(groupBalance)}\n` +
        `• **אחוז ניצול:** ${groupPct.toFixed(1)}% ` +
        (groupPct > 100 ? '⚠️ (חריגה)' : groupPct >= 80 ? '⚡ (אזהרה)' : '✅ (תקין)') +
        `\n\nבקבוצה זו רשומות ${groupExpenses.length} הוצאות שונות על פני ${groupItems.length} סעיפי FI.`,
      structuredData: {
        type: 'table',
        title: `הוצאות מובילות בקבוצת ${targetGroup}`,
        totalAmount: totalGroupSpend,
        items: topGroupExpenses.map((e) => ({
          label: `${e.vendor} (${e.fi_code})`,
          value: formatCurrency(e.amount),
          secondary: `${e.date} • אסמכתא: ${e.ref_number}`,
          badge: { text: e.fi_code, color: 'blue' as const },
        })),
      },
    };
  }

  // C. Top Vendors / Suppliers intent (מי הספק / ספקים מובילים)
  if (q.includes('ספק') || q.includes('ספקים') || q.includes('ספק מוביל') || q.includes('הכי הרבה')) {
    const vendorMap: Record<string, { total: number; count: number; lastDate: string }> = {};

    filteredExpenses.forEach((e) => {
      const v = e.vendor.trim() || 'לא צוין';
      if (!vendorMap[v]) {
        vendorMap[v] = { total: 0, count: 0, lastDate: e.date };
      }
      vendorMap[v].total += e.amount;
      vendorMap[v].count += 1;
      if (e.date > vendorMap[v].lastDate) vendorMap[v].lastDate = e.date;
    });

    const sortedVendors = Object.entries(vendorMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);

    if (sortedVendors.length === 0) {
      return {
        sender: 'assistant',
        text: `לא נמצאו הוצאות או ספקים ${monthName ? `עבור חודש ${monthName}` : 'בתקופה המבוקשת'}.`,
      };
    }

    const top1 = sortedVendors[0];
    const top5 = sortedVendors.slice(0, 5);

    return {
      sender: 'assistant',
      text: `הספק המוביל ${monthName ? `בחודש ${monthName}` : 'במערכת'} הוא **${top1.name}**, עם סך הוצאות של **${formatCurrency(top1.total)}** (${top1.count} תנועות).\n\nלהלן 5 הספקים עם ההוצאה הגבוהה ביותר:`,
      structuredData: {
        type: 'vendors_list',
        title: 'ספקים מובילים לפי היקף תשלום',
        items: top5.map((v, idx) => ({
          label: `#${idx + 1} ${v.name}`,
          value: formatCurrency(v.total),
          secondary: `${v.count} חשבוניות • תאריך אחרון: ${v.lastDate}`,
          badge: { text: `${v.count} תנועות`, color: 'blue' as const },
        })),
      },
    };
  }

  // D. Largest / Highest Expenses (5 ההוצאות הגבוהות ביותר)
  if (q.includes('גדולות') || q.includes('הכי יקר') || q.includes('גבוהות') || q.includes('הוצאה גדולה')) {
    const sortedExp = [...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const itemsMap = new Map(budgetItems.map((b) => [b.id, b]));

    return {
      sender: 'assistant',
      text: `להלן 5 ההוצאות הגבוהות ביותר שנרשמו ${monthName ? `בחודש ${monthName}` : 'במערכת'}:`,
      structuredData: {
        type: 'table',
        title: 'הוצאות שיא במערכת',
        items: sortedExp.map((e) => {
          const item = itemsMap.get(e.budget_item_id);
          return {
            label: `${e.vendor} - ${item ? item.name : e.fi_code}`,
            value: formatCurrency(e.amount),
            secondary: `${e.date} • אסמכתא: ${e.ref_number}`,
            badge: { text: e.fi_code, color: 'blue' as const },
          };
        }),
      },
    };
  }

  // E. Remaining balance intent (יתרה / כמה נשאר)
  if (q.includes('יתרה') || q.includes('נשאר') || q.includes('נותר')) {
    const totalBudget = calculated.reduce((s, i) => s + i.adjusted_budget, 0);
    const totalSpend = calculated.reduce((s, i) => s + i.actual_spend, 0);
    const totalRemaining = totalBudget - totalSpend;
    const pct = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

    return {
      sender: 'assistant',
      text: `היתרה התקציבית הכוללת שנותרה ${monthName ? `לחודש ${monthName}` : 'לתקופה הנוכחית'} עומדת על **${formatCurrency(totalRemaining)}**.\n\n` +
        `• **סך תקציב מוקצה:** ${formatCurrency(totalBudget)}\n` +
        `• **סך הוצאות בפועל:** ${formatCurrency(totalSpend)}\n` +
        `• **שיעור ניצול כולל:** ${pct.toFixed(1)}%`,
    };
  }

  // F. Specific Month Spend (כמה כסף הוצאתי בחודש X)
  if (targetMonth) {
    const monthExpenses = expenses.filter((e) => {
      const [y, m] = e.date.split('-').map(Number);
      return y === targetYear && m === targetMonth;
    });

    const totalMonthSpend = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalMonthBudget = budgetItems.reduce((s, i) => s + i.monthly_budget, 0);
    const monthBalance = totalMonthBudget - totalMonthSpend;
    const monthPct = totalMonthBudget > 0 ? (totalMonthSpend / totalMonthBudget) * 100 : 0;

    // Group breakdown for this month
    const itemMap = new Map(budgetItems.map((b) => [b.id, b]));
    const groupTotals: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      const item = itemMap.get(e.budget_item_id);
      const grp = item ? item.group : 'אחר';
      groupTotals[grp] = (groupTotals[grp] || 0) + e.amount;
    });

    const sortedGroups = Object.entries(groupTotals).sort((a, b) => b[1] - a[1]);

    return {
      sender: 'assistant',
      text: `בחודש **${monthName} ${targetYear}**:\n\n` +
        `• **סך הכל הוצאות בפועל:** ${formatCurrency(totalMonthSpend)}\n` +
        `• **תקציב חודשי מאושר:** ${formatCurrency(totalMonthBudget)}\n` +
        `• **יתרה שנותרה לחודש זה:** ${formatCurrency(monthBalance)}\n` +
        `• **אחוז ניצול כולל:** ${monthPct.toFixed(1)}% (${monthExpenses.length} תנועות הוצאה נרשמו)\n\n` +
        `להלן חלוקת ההוצאות לפי קבוצות באותו חודש:`,
      structuredData: {
        type: 'table',
        title: `התפלגות הוצאות חודש ${monthName}`,
        totalAmount: totalMonthSpend,
        items: sortedGroups.map(([gName, amt]) => ({
          label: gName,
          value: formatCurrency(amt),
          secondary: `${totalMonthSpend > 0 ? ((amt / totalMonthSpend) * 100).toFixed(1) : 0}% מכלל ההוצאות החודש`,
          badge: { text: `${totalMonthSpend > 0 ? ((amt / totalMonthSpend) * 100).toFixed(0) : 0}%`, color: 'blue' as const },
        })),
      },
    };
  }

  // G. General overview or unrecognized query (Default helpful response)
  const totalBudget = calculated.reduce((s, i) => s + i.adjusted_budget, 0);
  const totalSpend = calculated.reduce((s, i) => s + i.actual_spend, 0);
  const totalRemaining = totalBudget - totalSpend;
  const pct = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;
  const overCount = calculated.filter((i) => i.status === 'over').length;
  const warningCount = calculated.filter((i) => i.status === 'warning').length;

  return {
    sender: 'assistant',
    text: `הנה תמונת המצב התקציבית הנוכחית במערכת:\n\n` +
      `• **סך תקציב מוקצה:** ${formatCurrency(totalBudget)}\n` +
      `• **סך ביצוע בפועל:** ${formatCurrency(totalSpend)}\n` +
      `• **יתרה תקציבית:** ${formatCurrency(totalRemaining)}\n` +
      `• **אחוז ניצול ארגוני:** ${pct.toFixed(1)}%\n` +
      `• **סטטוס בריאות:** ${overCount} סעיפים בחריגה, ${warningCount} באזהרה, ${calculated.length - overCount - warningCount} תקינים.\n\n` +
      `💡 תוכל לשאול אותי שאלות ספציפיות כמו: *"כמה הוצאתי באוקטובר בתפעול ואחזקה?"*, *"מי הספק העיקרי?"*, או לבחור באחת מהשאלות הנפוצות למטה.`,
  };
}

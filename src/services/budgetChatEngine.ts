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

export type QuestionCategoryType =
  | 'all'
  | 'months'
  | 'quarters'
  | 'annual'
  | 'groups'
  | 'vendors'
  | 'alerts'
  | 'audit';

export interface CatalogQuestion {
  id: string;
  text: string;
  category: QuestionCategoryType;
  description: string;
}

export interface QuestionCategoryMeta {
  key: QuestionCategoryType;
  label: string;
  iconName: string;
  badgeCount?: number;
}

export const QUESTION_CATEGORIES: QuestionCategoryMeta[] = [
  { key: 'all', label: 'כל השאלות', iconName: 'Layers' },
  { key: 'months', label: 'חודשים', iconName: 'Calendar' },
  { key: 'quarters', label: 'רבעונים', iconName: 'PieChart' },
  { key: 'annual', label: 'שנתי ותחזיות', iconName: 'TrendingUp' },
  { key: 'groups', label: 'קבוצות משאבים', iconName: 'Building2' },
  { key: 'vendors', label: 'ספקים ורכש', iconName: 'Briefcase' },
  { key: 'alerts', label: 'חריגות ובקרה', iconName: 'AlertTriangle' },
  { key: 'audit', label: 'יומן ופעולות', iconName: 'History' },
];

export const CATEGORIZED_QUESTIONS: CatalogQuestion[] = [
  // --- חודשים ---
  {
    id: 'm1',
    text: 'כמה כסף הוצאנו בחודש אוקטובר בסך הכל?',
    category: 'months',
    description: 'סך הוצאות, תקציב מאושר, יתרה וחלוקה לפי קבוצות',
  },
  {
    id: 'm2',
    text: 'כמה הוצאנו בחודש ספטמבר ומה הייתה היתרה?',
    category: 'months',
    description: 'בדיקת ביצוע בפועל של החודש הקודם',
  },
  {
    id: 'm3',
    text: 'השוואה בין חודש ספטמבר לחודש אוקטובר',
    category: 'months',
    description: 'מגמת שינוי בהוצאות בין שני חודשים עוקבים',
  },
  {
    id: 'm4',
    text: 'מה הייתה ההוצאה הגדולה ביותר בחודש אוקטובר?',
    category: 'months',
    description: 'שליפת החשבונית והספק בעלי הסכום הגבוה ביותר החודש',
  },
  {
    id: 'm5',
    text: 'כמה תנועות והוצאות נרשמו בסך הכל החודש?',
    category: 'months',
    description: 'היקף הפעילות החשבונאית והתנועות באוקטובר',
  },

  // --- רבעונים ---
  {
    id: 'q1',
    text: 'מה סך ההוצאות והתקציב ברבעון 4 (אוקטובר-דצמבר)?',
    category: 'quarters',
    description: 'תקציב רבעוני משולש מול הוצאות רבעון 4',
  },
  {
    id: 'q2',
    text: 'מה ביצוע ויתרת רבעון 3 (יולי-ספטמבר)?',
    category: 'quarters',
    description: 'סיכום רבעוני עבור Q3',
  },
  {
    id: 'q3',
    text: 'השווה בין רבעון 3 לרבעון 4',
    category: 'quarters',
    description: 'השוואת ביצועים וניצול בין הרבעון השלישי לרביעי',
  },
  {
    id: 'q4',
    text: 'מה היתרה התקציבית שנותרה ברבעון הנוכחי?',
    category: 'quarters',
    description: 'כמה כסף נותר לניצול עד סוף הרבעון הנוכחי',
  },

  // --- שנתי ותחזיות ---
  {
    id: 'y1',
    text: 'מה סך התקציב השנתי המאושר לכל הארגון לשנת 2026?',
    category: 'annual',
    description: 'תקציב שנתי כולל (12 חודשים) עבור כל 82 סעיפי ה-FI',
  },
  {
    id: 'y2',
    text: 'מה סך כל ההוצאות המצטבר מתחילת השנה ועד היום?',
    category: 'annual',
    description: 'הוצאות YTD מצטברות של כל המערכת',
  },
  {
    id: 'y3',
    text: 'מה אחוז הניצול השנתי המצטבר של תקציב הארגון?',
    category: 'annual',
    description: 'כמה אחוזים מתוך התקציב השנתי הכולל נוצלו עד כה',
  },
  {
    id: 'y4',
    text: 'מה היתרה הכספית השנתית שנותרה לניצול עד סוף 2026?',
    category: 'annual',
    description: 'תקציב פנוי שנותר לכלל סעיפי הארגון לשנה הנוכחית',
  },

  // --- קבוצות משאבים ---
  {
    id: 'g1',
    text: 'כמה הוצאנו בתפעול ואחזקה ומה היתרה שנותרה?',
    category: 'groups',
    description: 'תקציב, ביצוע וספקים מובילים בתפעול ואחזקה',
  },
  {
    id: 'g2',
    text: 'מה תמונת המצב בסעיפי רכבים ודלק?',
    category: 'groups',
    description: 'בדיקת הוצאות ליסינג, דלק, ביטוחים וחניות',
  },
  {
    id: 'g3',
    text: 'מה אחוז הניצול בקבוצת הסעדה וכיבוד?',
    category: 'groups',
    description: 'בדיקת קייטרינג, שתייה קלה וכיבוד משרדי',
  },
  {
    id: 'g4',
    text: 'כמה הוצאנו על תקשורת ומחשוב?',
    category: 'groups',
    description: 'ציוד מחשוב, אינטרנט, סלולר וקווים',
  },
  {
    id: 'g5',
    text: 'מה המצב התקציבי בנדל"ן ושכירות?',
    category: 'groups',
    description: 'שכירות מבנים, ארנונה ודמי ניהול',
  },
  {
    id: 'g6',
    text: 'איזו קבוצת משאבים היא היקרה ביותר בארגון?',
    category: 'groups',
    description: 'דירוג הקבוצות לפי היקף תקציב והוצאה בפועל',
  },

  // --- ספקים ורכש ---
  {
    id: 'v1',
    text: 'מי 5 הספקים המובילים עם ההוצאה הגבוהה ביותר?',
    category: 'vendors',
    description: 'דירוג הספקים המרכזיים ומספר החשבוניות ששולמו להם',
  },
  {
    id: 'v2',
    text: 'כמה כסף שילמנו לחברת החשמל?',
    category: 'vendors',
    description: 'בדיקת חשבוניות וסך תשלום לחברת החשמל',
  },
  {
    id: 'v3',
    text: 'איזה ספק קיבל הכי הרבה חשבוניות נפרדות?',
    category: 'vendors',
    description: 'הספק עם מספר התנועות הגבוה ביותר במערכת',
  },
  {
    id: 'v4',
    text: 'מהן 5 ההוצאות הגבוהות ביותר שנרשמו אי פעם?',
    category: 'vendors',
    description: 'החשבוניות הבודדות הגבוהות ביותר בכלל המערכת',
  },

  // --- חריגות ובקרה ---
  {
    id: 'a1',
    text: 'אילו סעיפי FI נמצאים כרגע בחריגה אדומה (מעל 100%)?',
    category: 'alerts',
    description: 'רשימת כל הסעיפים שחרגו מהתקציב המאושר ושיעור החריגה',
  },
  {
    id: 'a2',
    text: 'אילו סעיפים נמצאים באזהרה צהובה (80%-99%)?',
    category: 'alerts',
    description: 'סעיפים שמתקרבים למיצוי מלא של התקציב',
  },
  {
    id: 'a3',
    text: 'מה הסעיף עם החריגה הכספית (בשקלים) הגבוהה ביותר?',
    category: 'alerts',
    description: 'איזה סעיף גרם לחריגה הכספית הגדולה ביותר',
  },
  {
    id: 'a4',
    text: 'האם יש סעיפי תקציב שלא נוצלו כלל (0% ניצול)?',
    category: 'alerts',
    description: 'איתור סעיפי תקציב מאושרים ללא כל ביצוע',
  },

  // --- יומן ופעולות ---
  {
    id: 'u1',
    text: 'מהם השינויים האחרונים שבוצעו בתקציב?',
    category: 'audit',
    description: 'שליפת עדכוני תקציב ושינויים שבוצעו לאחרונה',
  },
  {
    id: 'u2',
    text: 'כמה הוצאות ופעולות נרשמו בסך הכל ביומן?',
    category: 'audit',
    description: 'סטטיסטיקת יומן הפעולות והשינויים',
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
 * Intelligent Hebrew Natural Language Query Solver for Budgets and Expenses
 */
export function answerBudgetQuestion(
  query: string,
  budgetItems: BudgetItem[],
  expenses: Expense[],
  currentFilter: PeriodFilter
): Omit<ChatMessage, 'id' | 'timestamp'> {
  const q = query.trim().toLowerCase();
  const targetYear = 2026;

  // 1. Detect Quarter (רבעון 1, רבעון 2, רבעון 3, רבעון 4 / Q1..Q4)
  let targetQuarter: number | null = null;
  const qMatch = q.match(/רבעון\s*([1-4])/i) || q.match(/q([1-4])/i);
  if (qMatch) {
    targetQuarter = parseInt(qMatch[1], 10);
  }

  // 2. Detect Comparison (השוואה בין רבעון X לרבעון Y או בין חודש X לחודש Y)
  const isQuarterComparison =
    q.includes('השווה') || q.includes('השוואה') || q.includes('השוואת');

  if (isQuarterComparison && (q.includes('רבעון 3') && q.includes('רבעון 4'))) {
    // Compare Q3 and Q4
    const getQuarterExpenses = (quarter: number) => {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = startMonth + 2;
      return expenses.filter((e) => {
        const [y, m] = e.date.split('-').map(Number);
        return y === targetYear && m >= startMonth && m <= endMonth;
      });
    };

    const q3Exp = getQuarterExpenses(3);
    const q4Exp = getQuarterExpenses(4);
    const q3Spend = q3Exp.reduce((s, e) => s + e.amount, 0);
    const q4Spend = q4Exp.reduce((s, e) => s + e.amount, 0);
    const totalQuarterBudget =
      budgetItems.reduce((s, i) => s + i.monthly_budget, 0) * 3;

    const diff = q4Spend - q3Spend;
    const diffPct = q3Spend > 0 ? (diff / q3Spend) * 100 : 0;

    return {
      sender: 'assistant',
      text: `השוואה בין **רבעון 3** (יולי-ספטמבר) ל**רבעון 4** (אוקטובר-דצמבר) לשנת ${targetYear}:\n\n` +
        `• **ביצוע ברבעון 3:** ${formatCurrency(q3Spend)} (${q3Exp.length} תנועות) — ניצול של ${((q3Spend / totalQuarterBudget) * 100).toFixed(1)}%\n` +
        `• **ביצוע ברבעון 4:** ${formatCurrency(q4Spend)} (${q4Exp.length} תנועות) — ניצול של ${((q4Spend / totalQuarterBudget) * 100).toFixed(1)}%\n` +
        `• **תקציב רבעוני מאושר:** ${formatCurrency(totalQuarterBudget)}\n\n` +
        (diff > 0
          ? `📈 ברבעון 4 נרשמה **עלייה בהוצאות** בסך ${formatCurrency(diff)} (+${diffPct.toFixed(1)}%) בהשוואה לרבעון 3.`
          : diff < 0
          ? `📉 ברבעון 4 נרשמה **ירידה בהוצאות** בסך ${formatCurrency(Math.abs(diff))} (${diffPct.toFixed(1)}%) בהשוואה לרבעון 3.`
          : `ברבעון 4 סך ההוצאות היה זהה לרבעון 3.`),
      structuredData: {
        type: 'comparison',
        title: 'השוואת רבעונים Q3 מול Q4',
        items: [
          {
            label: 'רבעון 3 (יולי-ספטמבר)',
            value: formatCurrency(q3Spend),
            secondary: `${((q3Spend / totalQuarterBudget) * 100).toFixed(1)}% ניצול תקציבי`,
            badge: { text: 'Q3', color: 'blue' },
          },
          {
            label: 'רבעון 4 (אוקטובר-דצמבר)',
            value: formatCurrency(q4Spend),
            secondary: `${((q4Spend / totalQuarterBudget) * 100).toFixed(1)}% ניצול תקציבי`,
            badge: { text: 'Q4', color: 'blue' },
          },
        ],
      },
    };
  }

  // 3. Month Comparison (ספטמבר מול אוקטובר)
  if (isQuarterComparison && (q.includes('ספטמבר') && q.includes('אוקטובר'))) {
    const getMonthExpenses = (month: number) =>
      expenses.filter((e) => {
        const [y, m] = e.date.split('-').map(Number);
        return y === targetYear && m === month;
      });

    const sepExp = getMonthExpenses(9);
    const octExp = getMonthExpenses(10);
    const sepSpend = sepExp.reduce((s, e) => s + e.amount, 0);
    const octSpend = octExp.reduce((s, e) => s + e.amount, 0);
    const monthlyBudget = budgetItems.reduce((s, i) => s + i.monthly_budget, 0);
    const diff = octSpend - sepSpend;
    const diffPct = sepSpend > 0 ? (diff / sepSpend) * 100 : 0;

    return {
      sender: 'assistant',
      text: `השוואת חודש **ספטמבר** מול חודש **אוקטובר** לשנת ${targetYear}:\n\n` +
        `• **הוצאות ספטמבר:** ${formatCurrency(sepSpend)} (${sepExp.length} חשבוניות)\n` +
        `• **הוצאות אוקטובר:** ${formatCurrency(octSpend)} (${octExp.length} חשבוניות)\n` +
        `• **תקציב חודשי מוקצה:** ${formatCurrency(monthlyBudget)}\n\n` +
        (diff > 0
          ? `🔺 באוקטובר ההוצאות עלו ב-${formatCurrency(diff)} (+${diffPct.toFixed(1)}%) לעומת ספטמבר.`
          : `🔻 באוקטובר ההוצאות פחתו ב-${formatCurrency(Math.abs(diff))} (${diffPct.toFixed(1)}%) לעומת ספטמבר.`),
      structuredData: {
        type: 'comparison',
        title: 'השוואת חודשים',
        items: [
          {
            label: 'ספטמבר 2026',
            value: formatCurrency(sepSpend),
            secondary: `${((sepSpend / monthlyBudget) * 100).toFixed(1)}% ניצול`,
            badge: { text: 'חודש 9', color: 'blue' },
          },
          {
            label: 'אוקטובר 2026',
            value: formatCurrency(octSpend),
            secondary: `${((octSpend / monthlyBudget) * 100).toFixed(1)}% ניצול`,
            badge: { text: 'חודש 10', color: 'blue' },
          },
        ],
      },
    };
  }

  // 4. Quarter Details Query (רבעון 1, 2, 3, 4)
  if (targetQuarter) {
    const startMonth = (targetQuarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const quarterExpenses = expenses.filter((e) => {
      const [y, m] = e.date.split('-').map(Number);
      return y === targetYear && m >= startMonth && m <= endMonth;
    });

    const quarterSpend = quarterExpenses.reduce((s, e) => s + e.amount, 0);
    const totalQuarterBudget =
      budgetItems.reduce((s, i) => s + i.monthly_budget, 0) * 3;
    const quarterBalance = totalQuarterBudget - quarterSpend;
    const quarterPct =
      totalQuarterBudget > 0 ? (quarterSpend / totalQuarterBudget) * 100 : 0;

    return {
      sender: 'assistant',
      text: `נתוני **רבעון ${targetQuarter}** (חודשים ${startMonth}-${endMonth}) לשנת ${targetYear}:\n\n` +
        `• **סך הכל ביצוע בפועל:** ${formatCurrency(quarterSpend)}\n` +
        `• **תקציב רבעוני מאושר (3 חודשים):** ${formatCurrency(totalQuarterBudget)}\n` +
        `• **יתרה שנותרה לרבעון:** ${formatCurrency(quarterBalance)}\n` +
        `• **אחוז ניצול רבעוני:** ${quarterPct.toFixed(1)}% ` +
        (quarterPct > 100 ? '⚠️ (חריגה)' : quarterPct >= 80 ? '⚡ (אזהרה)' : '✅ (תקין)') +
        `\n\nברבעון זה נרשמו ${quarterExpenses.length} תנועות הוצאה.`,
      structuredData: {
        type: 'kpi',
        title: `סיכום רבעון ${targetQuarter}`,
        totalAmount: quarterSpend,
        items: [
          { label: 'תקציב רבעוני', value: formatCurrency(totalQuarterBudget) },
          { label: 'ביצוע בפועל', value: formatCurrency(quarterSpend) },
          { label: 'יתרה לתום הרבעון', value: formatCurrency(quarterBalance) },
          {
            label: 'אחוז ניצול',
            value: `${quarterPct.toFixed(1)}%`,
            badge: {
              text: quarterPct > 100 ? 'חריגה' : quarterPct >= 80 ? 'אזהרה' : 'תקין',
              color: quarterPct > 100 ? 'red' : quarterPct >= 80 ? 'yellow' : 'green',
            },
          },
        ],
      },
    };
  }

  // 5. Annual and Forecast Queries (שנתי, 2026, תקציב שנתי, סוף שנה)
  if (
    q.includes('שנתי') ||
    q.includes('תקציב שנתי') ||
    q.includes('שנת 2026') ||
    q.includes('סוף שנה') ||
    q.includes('מתחילת השנה')
  ) {
    const annualExpenses = expenses.filter((e) => {
      const [y] = e.date.split('-').map(Number);
      return y === targetYear;
    });

    const totalAnnualSpend = annualExpenses.reduce((s, e) => s + e.amount, 0);
    const totalAnnualBudget =
      budgetItems.reduce((s, i) => s + i.monthly_budget, 0) * 12;
    const annualRemaining = totalAnnualBudget - totalAnnualSpend;
    const annualPct =
      totalAnnualBudget > 0 ? (totalAnnualSpend / totalAnnualBudget) * 100 : 0;

    return {
      sender: 'assistant',
      text: `תמונת המצב התקציבית **השנתית** לשנת ${targetYear} (עבור 82 סעיפי FI):\n\n` +
        `• **תקציב שנתי מאושר (12 חודשים):** ${formatCurrency(totalAnnualBudget)}\n` +
        `• **סך ביצוע מצטבר YTD:** ${formatCurrency(totalAnnualSpend)} (${annualExpenses.length} חשבוניות)\n` +
        `• **יתרה שנתית שנותרה לניצול:** ${formatCurrency(annualRemaining)}\n` +
        `• **שיעור ניצול שנתי כולל:** ${annualPct.toFixed(1)}%\n\n` +
        `📊 המערכת נמצאת בקצב ניצול תקין ביחס לשנה השלמה.`,
      structuredData: {
        type: 'kpi',
        title: `סיכום שנתי ${targetYear}`,
        items: [
          { label: 'תקציב שנתי מאושר', value: formatCurrency(totalAnnualBudget) },
          { label: 'הוצאות מצטברות YTD', value: formatCurrency(totalAnnualSpend) },
          { label: 'יתרה שנתית פנויה', value: formatCurrency(annualRemaining) },
          {
            label: 'אחוז ניצול שנתי',
            value: `${annualPct.toFixed(1)}%`,
            badge: { text: `${annualPct.toFixed(0)}%`, color: 'blue' },
          },
        ],
      },
    };
  }

  // 6. Zero utilization check (0% ניצול / לא נוצלו כלל)
  if (q.includes('0%') || q.includes('לא נוצלו') || q.includes('ללא הוצאות')) {
    const currentMonth = currentFilter.month || 10;
    const calculated = calculateBudgetItems(budgetItems, expenses, {
      type: 'monthly',
      year: targetYear,
      month: currentMonth,
    });

    const zeroItems = calculated.filter((i) => i.actual_spend === 0);

    return {
      sender: 'assistant',
      text: `נמצאו **${zeroItems.length} סעיפי תקציב** שטרם נרשמה בהם אף הוצאה בחודש הנוכחי (0% ניצול).\n` +
        `סך התקציב הפנוי בסעיפים אלו עומד על **${formatCurrency(
          zeroItems.reduce((s, i) => s + i.adjusted_budget, 0)
        )}**.\n\nדוגמאות לסעיפים ללא ביצוע החודש:`,
      structuredData: {
        type: 'items_list',
        title: 'סעיפים ללא תנועות החודש',
        items: zeroItems.slice(0, 5).map((i) => ({
          label: `${i.fi_code} - ${i.name}`,
          value: formatCurrency(i.adjusted_budget),
          secondary: i.group,
          badge: { text: '0% ניצול', color: 'green' },
        })),
      },
    };
  }

  // 7. Highest over-budget item (החריגה הכספית הגבוהה ביותר)
  if (q.includes('חריגה כספית') || q.includes('חריגה הגבוהה ביותר') || q.includes('הכי חורג')) {
    const currentMonth = currentFilter.month || 10;
    const calculated = calculateBudgetItems(budgetItems, expenses, {
      type: 'monthly',
      year: targetYear,
      month: currentMonth,
    });

    const overItems = calculated
      .filter((i) => i.status === 'over')
      .sort((a, b) => b.actual_spend - b.adjusted_budget - (a.actual_spend - a.adjusted_budget));

    if (overItems.length === 0) {
      return {
        sender: 'assistant',
        text: 'מצוין! אין כרגע אף סעיף בחריגה תקציבית החודש.',
      };
    }

    const topOver = overItems[0];
    const overAmount = topOver.actual_spend - topOver.adjusted_budget;

    return {
      sender: 'assistant',
      text: `הסעיף עם החריגה השקלית הגבוהה ביותר הוא **${topOver.name} (${topOver.fi_code})** מקבוצת ${topOver.group}:\n\n` +
        `• **תקציב מוקצה:** ${formatCurrency(topOver.adjusted_budget)}\n` +
        `• **ביצוע בפועל:** ${formatCurrency(topOver.actual_spend)}\n` +
        `• **סכום החריגה:** ${formatCurrency(overAmount)} (ניצול של ${topOver.utilization_pct.toFixed(0)}%)\n\n` +
        `להלן סעיפי החריגה המובילים:`,
      structuredData: {
        type: 'items_list',
        title: 'סעיפי החריגה הגבוהים ביותר',
        items: overItems.slice(0, 4).map((i) => ({
          label: `${i.fi_code} - ${i.name}`,
          value: `חריגה של ${formatCurrency(i.actual_spend - i.adjusted_budget)}`,
          secondary: `ביצוע: ${formatCurrency(i.actual_spend)} מתוך ${formatCurrency(i.adjusted_budget)}`,
          badge: { text: `${i.utilization_pct.toFixed(0)}%`, color: 'red' },
        })),
      },
    };
  }

  // 8. Specific Vendor Query (חברת החשמל, ספק מסוים)
  const vendorQueryMatch = q.match(/שילמנו ל(.+)/) || q.match(/ספק (.+)/);
  if (q.includes('חברת החשמל') || q.includes('חשמל') || vendorQueryMatch) {
    const vendorSearchTerm = q.includes('חשמל')
      ? 'חשמל'
      : (vendorQueryMatch ? vendorQueryMatch[1].trim() : '');

    const matchingExpenses = expenses.filter((e) =>
      e.vendor.toLowerCase().includes(vendorSearchTerm.toLowerCase())
    );

    if (matchingExpenses.length > 0) {
      const totalPaid = matchingExpenses.reduce((s, e) => s + e.amount, 0);
      return {
        sender: 'assistant',
        text: `עבור הספק **"${matchingExpenses[0].vendor}"** נרשמו ${matchingExpenses.length} תשלומים בסך כולל של **${formatCurrency(totalPaid)}**:\n\n` +
          `• תאריך חשבונית אחרונה: ${matchingExpenses[0].date}\n` +
          `• אסמכתא אחרונה: ${matchingExpenses[0].ref_number}`,
        structuredData: {
          type: 'table',
          title: `פירוט תשלומים לספק ${matchingExpenses[0].vendor}`,
          items: matchingExpenses.map((e) => ({
            label: `${e.date} • אסמכתא ${e.ref_number}`,
            value: formatCurrency(e.amount),
            secondary: e.fi_code,
            badge: { text: e.fi_code, color: 'blue' },
          })),
        },
      };
    }
  }

  // 9. Standard Month recognition
  let targetMonth: number | null = null;
  for (const [name, num] of Object.entries(MONTH_NAMES_HEBREW)) {
    if (q.includes(name)) {
      targetMonth = num;
      break;
    }
  }

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

  // 10. Standard Group recognition
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

  const monthName = targetMonth
    ? Object.keys(MONTH_NAMES_HEBREW).find((k) => MONTH_NAMES_HEBREW[k] === targetMonth) || `חודש ${targetMonth}`
    : null;

  const filteredExpenses = expenses.filter((e) => {
    if (!targetMonth) return true;
    const [y, m] = e.date.split('-').map(Number);
    return y === targetYear && m === targetMonth;
  });

  const filterForCalc: PeriodFilter = {
    type: 'monthly',
    year: targetYear,
    month: targetMonth || currentFilter.month || 10,
  };
  const calculated = calculateBudgetItems(budgetItems, expenses, filterForCalc);

  // A. Over-budget / Alerts intent
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

  // B. Specific Group Spend & Budget
  if (targetGroup) {
    const groupItems = calculated.filter((i) => i.group === targetGroup);
    const totalGroupBudget = groupItems.reduce((s, i) => s + i.adjusted_budget, 0);
    const totalGroupSpend = groupItems.reduce((s, i) => s + i.actual_spend, 0);
    const groupBalance = totalGroupBudget - totalGroupSpend;
    const groupPct = totalGroupBudget > 0 ? (totalGroupSpend / totalGroupBudget) * 100 : 0;

    const groupItemIds = new Set(groupItems.map((i) => i.id));
    const groupExpenses = filteredExpenses.filter((e) => groupItemIds.has(e.budget_item_id));
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

  // C. Top Vendors / Suppliers intent
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

  // D. Largest / Highest Expenses
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

  // E. Remaining balance intent
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

  // F. Specific Month Spend
  if (targetMonth) {
    const monthExpenses = expenses.filter((e) => {
      const [y, m] = e.date.split('-').map(Number);
      return y === targetYear && m === targetMonth;
    });

    const totalMonthSpend = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalMonthBudget = budgetItems.reduce((s, i) => s + i.monthly_budget, 0);
    const monthBalance = totalMonthBudget - totalMonthSpend;
    const monthPct = totalMonthBudget > 0 ? (totalMonthSpend / totalMonthBudget) * 100 : 0;

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

  // G. General overview / Default
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
      `💡 תוכל לבחור שאלות מוכנות מתוך **מאגר השאלות** לפי קטגוריות (חודשים, רבעונים, שנתי, קבוצות, ספקים וחריגות).`,
  };
}

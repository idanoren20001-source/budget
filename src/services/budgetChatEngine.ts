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
  | 'operations'
  | 'vehicles'
  | 'catering'
  | 'it'
  | 'realestate'
  | 'months'
  | 'quarters'
  | 'annual'
  | 'vendors'
  | 'alerts';

export interface CatalogQuestion {
  id: string;
  text: string;
  category: QuestionCategoryType;
  description: string;
  keywords: string[];
}

export interface QuestionCategoryMeta {
  key: QuestionCategoryType;
  label: string;
  iconName: string;
}

export const QUESTION_CATEGORIES: QuestionCategoryMeta[] = [
  { key: 'all', label: 'הכל', iconName: 'Layers' },
  { key: 'operations', label: 'תפעול ואחזקה', iconName: 'Wrench' },
  { key: 'vehicles', label: 'רכבים ודלק', iconName: 'Car' },
  { key: 'months', label: 'חודשים', iconName: 'Calendar' },
  { key: 'quarters', label: 'רבעונים', iconName: 'PieChart' },
  { key: 'annual', label: 'שנתי', iconName: 'TrendingUp' },
  { key: 'catering', label: 'הסעדה וכיבוד', iconName: 'Utensils' },
  { key: 'it', label: 'תקשורת ומחשוב', iconName: 'Monitor' },
  { key: 'realestate', label: 'נדל"ן ושכירות', iconName: 'Building' },
  { key: 'vendors', label: 'ספקים ורכש', iconName: 'Briefcase' },
  { key: 'alerts', label: 'חריגות ובקרה', iconName: 'AlertTriangle' },
];

export const CATEGORIZED_QUESTIONS: CatalogQuestion[] = [
  // --- תפעול ואחזקה (Operations) ---
  {
    id: 'op1',
    text: 'כמה הוצאנו בתפעול ואחזקה ומה היתרה שנותרה?',
    category: 'operations',
    description: 'בדיקת ביצוע בפועל מול תקציב ויתרה בקבוצת תפעול ואחזקה',
    keywords: ['תפעול', 'אחזקה', 'תפעול ואחזקה', 'תקציב תפעול', 'יתרה', 'ביצוע'],
  },
  {
    id: 'op2',
    text: 'מה הסעיף היקר ביותר בתפעול ואחזקה?',
    category: 'operations',
    description: 'איתור סעיף ה-FI עם ההוצאה הגבוהה ביותר בתפעול',
    keywords: ['תפעול', 'אחזקה', 'סעיף יקר', 'הכי יקר', 'הוצאה גדולה'],
  },
  {
    id: 'op3',
    text: 'כמה שילמנו על חשמל ומים בתפעול ואחזקה?',
    category: 'operations',
    description: 'ריכוז הוצאות חשמל, מים ואנרגיה למבנים',
    keywords: ['תפעול', 'חשמל', 'מים', 'חברת חשמל', 'אנרגיה', 'אחזקה'],
  },
  {
    id: 'op4',
    text: 'האם יש חריגות בסעיפי תפעול ואחזקה?',
    category: 'operations',
    description: 'בדיקת סעיפי תפעול מעל 100% או באזהרה (80-99%)',
    keywords: ['תפעול', 'אחזקה', 'חריגה', 'חריגות', 'אזהרה', 'אדום'],
  },
  {
    id: 'op5',
    text: 'מי הספקים המובילים בתפעול ואחזקה?',
    category: 'operations',
    description: 'דירוג נותני שירות וקבלני אחזקה לפי היקף תשלום',
    keywords: ['תפעול', 'אחזקה', 'ספקים', 'ספק מוביל', 'קבלנים', 'שירות'],
  },

  // --- רכבים ודלק (Vehicles & Fleet) ---
  {
    id: 'vh1',
    text: 'מה תמונת המצב בסעיפי רכבים ודלק?',
    category: 'vehicles',
    description: 'תקציב, הוצאות ליסינג, דלק וביטוחים לצי הרכב',
    keywords: ['רכב', 'רכבים', 'דלק', 'צי רכב', 'ליסינג', 'סונול', 'פז'],
  },
  {
    id: 'vh2',
    text: 'כמה הוצאנו על דלק החודש?',
    category: 'vehicles',
    description: 'סך תשלומי הדלק והתדלוקים שנרשמו החודש',
    keywords: ['רכב', 'דלק', 'תדלוק', 'דלקן', 'הוצאות דלק'],
  },
  {
    id: 'vh3',
    text: 'מה עלות הליסינג החודשית של רכבי החברה?',
    category: 'vehicles',
    description: 'חשבוניות ליסינג ושכירות רכב',
    keywords: ['רכב', 'ליסינג', 'שכירות רכב', 'רכבים'],
  },
  {
    id: 'vh4',
    text: 'האם יש חריגה בתקציב הרכבים?',
    category: 'vehicles',
    description: 'בדיקת ניצול יתר בסעיפי רכב, דלק וביטוחים',
    keywords: ['רכב', 'רכבים', 'דלק', 'חריגה', 'יתרה'],
  },

  // --- חודשים (Months) ---
  {
    id: 'm1',
    text: 'כמה כסף הוצאנו בחודש אוקטובר בסך הכל?',
    category: 'months',
    description: 'סך הוצאות, תקציב מאושר, יתרה וחלוקה לפי קבוצות',
    keywords: ['חודש', 'אוקטובר', 'החודש', 'סך הכל', 'הוצאות החודש'],
  },
  {
    id: 'm2',
    text: 'כמה הוצאנו בחודש ספטמבר ומה הייתה היתרה?',
    category: 'months',
    description: 'בדיקת ביצוע בפועל של החודש הקודם',
    keywords: ['חודש', 'ספטמבר', 'חודש שעבר', 'ביצוע קודם'],
  },
  {
    id: 'm3',
    text: 'השוואה בין חודש ספטמבר לחודש אוקטובר',
    category: 'months',
    description: 'מגמת שינוי בהוצאות בין שני חודשים עוקבים',
    keywords: ['חודש', 'השוואה', 'ספטמבר', 'אוקטובר', 'מגמה'],
  },
  {
    id: 'm4',
    text: 'מה הייתה ההוצאה הגדולה ביותר בחודש אוקטובר?',
    category: 'months',
    description: 'שליפת החשבונית והספק בעלי הסכום הגבוה ביותר החודש',
    keywords: ['חודש', 'אוקטובר', 'הוצאה גדולה', 'שיא', 'חשבונית גדולה'],
  },

  // --- רבעונים (Quarters) ---
  {
    id: 'q1',
    text: 'מה סך ההוצאות והתקציב ברבעון 4 (אוקטובר-דצמבר)?',
    category: 'quarters',
    description: 'תקציב רבעוני משולש מול הוצאות רבעון 4',
    keywords: ['רבעון', 'רבעון 4', 'q4', 'אוקטובר', 'דצמבר'],
  },
  {
    id: 'q2',
    text: 'מה ביצוע ויתרת רבעון 3 (יולי-ספטמבר)?',
    category: 'quarters',
    description: 'סיכום רבעוני עבור Q3',
    keywords: ['רבעון', 'רבעון 3', 'q3', 'יולי', 'ספטמבר'],
  },
  {
    id: 'q3',
    text: 'השווה בין רבעון 3 לרבעון 4',
    category: 'quarters',
    description: 'השוואת ביצועים וניצול בין הרבעון השלישי לרביעי',
    keywords: ['רבעון', 'השוואה', 'רבעון 3', 'רבעון 4', 'q3', 'q4'],
  },
  {
    id: 'q4',
    text: 'מה היתרה התקציבית שנותרה ברבעון הנוכחי?',
    category: 'quarters',
    description: 'כמה כסף נותר לניצול עד סוף הרבעון הנוכחי',
    keywords: ['רבעון', 'יתרה', 'רבעון נוכחי', 'נותר'],
  },

  // --- שנתי (Annual) ---
  {
    id: 'y1',
    text: 'מה סך התקציב השנתי המאושר לכל הארגון לשנת 2026?',
    category: 'annual',
    description: 'תקציב שנתי כולל (12 חודשים) עבור כל 82 סעיפי ה-FI',
    keywords: ['שנתי', 'שנה', '2026', 'תקציב שנתי', 'ארגון'],
  },
  {
    id: 'y2',
    text: 'מה סך כל ההוצאות המצטבר מתחילת השנה ועד היום?',
    category: 'annual',
    description: 'הוצאות YTD מצטברות של כל המערכת',
    keywords: ['שנתי', 'מצטבר', 'ytd', 'מתחילת השנה', 'סך הכל'],
  },
  {
    id: 'y3',
    text: 'מה אחוז הניצול השנתי המצטבר של תקציב הארגון?',
    category: 'annual',
    description: 'כמה אחוזים מתוך התקציב השנתי הכולל נוצלו עד כה',
    keywords: ['שנתי', 'אחוז ניצול', 'ניצול שנתי', 'קצב'],
  },
  {
    id: 'y4',
    text: 'מה היתרה הכספית השנתית שנותרה לניצול עד סוף 2026?',
    category: 'annual',
    description: 'תקציב פנוי שנותר לכלל סעיפי הארגון לשנה הנוכחית',
    keywords: ['שנתי', 'יתרה', 'סוף שנה', '2026', 'נותר'],
  },

  // --- הסעדה וכיבוד (Catering) ---
  {
    id: 'cat1',
    text: 'מה אחוז הניצול בקבוצת הסעדה וכיבוד?',
    category: 'catering',
    description: 'בדיקת קייטרינג, שתייה קלה וכיבוד משרדי',
    keywords: ['הסעדה', 'אוכל', 'כיבוד', 'קייטרינג', 'ארוחות', 'עובדים'],
  },
  {
    id: 'cat2',
    text: 'כמה הוצאנו על קייטרינג וכיבוד החודש?',
    category: 'catering',
    description: 'סך כל חשבוניות ההסעדה החודשיות',
    keywords: ['הסעדה', 'כיבוד', 'קייטרינג', 'החודש', 'ארוחות'],
  },

  // --- תקשורת ומחשוב (IT & Comms) ---
  {
    id: 'it1',
    text: 'כמה הוצאנו על תקשורת ומחשוב?',
    category: 'it',
    description: 'ציוד מחשוב, אינטרנט, סלולר וקווים',
    keywords: ['תקשורת', 'מחשוב', 'אינטרנט', 'סלולר', 'מחשבים', 'חומרה', 'it'],
  },
  {
    id: 'it2',
    text: 'מה עלויות הסלולר והאינטרנט החודש?',
    category: 'it',
    description: 'חשבוניות ספקי סלולר וספקי תקשורת',
    keywords: ['תקשורת', 'סלולר', 'אינטרנט', 'בזק', 'סלקום', 'פרטנר'],
  },

  // --- נדל"ן ושכירות (Real Estate) ---
  {
    id: 're1',
    text: 'מה המצב התקציבי בנדל"ן ושכירות?',
    category: 'realestate',
    description: 'שכירות מבנים, ארנונה ודמי ניהול',
    keywords: ['נדל"ן', 'נדלן', 'שכירות', 'ארנונה', 'דמי ניהול', 'משרדים'],
  },
  {
    id: 're2',
    text: 'כמה שילמנו ארנונה ושכירות החודש?',
    category: 'realestate',
    description: 'תשלומי ארנונה עירונית ושכירות חודשית',
    keywords: ['נדל"ן', 'שכירות', 'ארנונה', 'עירייה'],
  },

  // --- ספקים ורכש (Vendors) ---
  {
    id: 'v1',
    text: 'מי 5 הספקים המובילים עם ההוצאה הגבוהה ביותר?',
    category: 'vendors',
    description: 'דירוג הספקים המרכזיים ומספר החשבוניות ששולמו להם',
    keywords: ['ספק', 'ספקים', 'ספקים מובילים', 'הכי הרבה', 'רכש'],
  },
  {
    id: 'v2',
    text: 'כמה כסף שילמנו לחברת החשמל?',
    category: 'vendors',
    description: 'בדיקת חשבוניות וסך תשלום לחברת החשמל',
    keywords: ['ספק', 'חשמל', 'חברת החשמל', 'תשלום לחשמל'],
  },
  {
    id: 'v3',
    text: 'איזה ספק קיבל הכי הרבה חשבוניות נפרדות?',
    category: 'vendors',
    description: 'הספק עם מספר התנועות הגבוה ביותר במערכת',
    keywords: ['ספק', 'תנועות', 'חשבוניות', 'תשלומים רבים'],
  },
  {
    id: 'v4',
    text: 'מהן 5 ההוצאות הגבוהות ביותר שנרשמו אי פעם?',
    category: 'vendors',
    description: 'החשבוניות הבודדות הגבוהות ביותר בכלל המערכת',
    keywords: ['הוצאות גדולות', 'חשבונית גדולה', 'שיא', 'הכי יקר'],
  },

  // --- חריגות ובקרה (Alerts) ---
  {
    id: 'a1',
    text: 'אילו סעיפי FI נמצאים כרגע בחריגה אדומה (מעל 100%)?',
    category: 'alerts',
    description: 'רשימת כל הסעיפים שחרגו מהתקציב המאושר ושיעור החריגה',
    keywords: ['חריגה', 'חריגות', 'אדום', 'מעל 100%', 'חורג'],
  },
  {
    id: 'a2',
    text: 'אילו סעיפים נמצאים באזהרה צהובה (80%-99%)?',
    category: 'alerts',
    description: 'סעיפים שמתקרבים למיצוי מלא של התקציב',
    keywords: ['אזהרה', 'צהוב', '80%', 'קרוב לחריגה', 'גבולי'],
  },
  {
    id: 'a3',
    text: 'מה הסעיף עם החריגה הכספית (בשקלים) הגבוהה ביותר?',
    category: 'alerts',
    description: 'איזה סעיף גרם לחריגה הכספית הגדולה ביותר',
    keywords: ['חריגה', 'חריגה שקלית', 'הכי חורג', 'הפסד'],
  },
  {
    id: 'a4',
    text: 'האם יש סעיפי תקציב שלא נוצלו כלל (0% ניצול)?',
    category: 'alerts',
    description: 'איתור סעיפי תקציב מאושרים ללא כל ביצוע',
    keywords: ['0%', 'לא נוצל', 'ללא הוצאות', 'פנוי לחלוטין'],
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

  // 1. Detect Quarter Comparison (השוואה בין רבעון X לרבעון Y)
  const isComparison =
    q.includes('השווה') || q.includes('השוואה') || q.includes('השוואת');

  if (isComparison && (q.includes('רבעון 3') && q.includes('רבעון 4'))) {
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

  // 2. Month Comparison (ספטמבר מול אוקטובר)
  if (isComparison && (q.includes('ספטמבר') && q.includes('אוקטובר'))) {
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

  // 3. Quarter Details Query (רבעון 1, 2, 3, 4)
  let targetQuarter: number | null = null;
  const qMatch = q.match(/רבעון\s*([1-4])/i) || q.match(/q([1-4])/i);
  if (qMatch) {
    targetQuarter = parseInt(qMatch[1], 10);
  }

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

  // 4. Annual Queries
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

  // 5. Operations specific questions (הסעיף היקר בתפעול / חשמל ומים)
  if (q.includes('תפעול') || q.includes('אחזקה')) {
    const opItems = budgetItems.filter((i) => i.group === 'תפעול ואחזקה');
    const opItemIds = new Set(opItems.map((i) => i.id));
    const opExpenses = expenses.filter((e) => opItemIds.has(e.budget_item_id));

    if (q.includes('יקר') || q.includes('הכי יקר') || q.includes('גבוה ביותר')) {
      const calcOp = calculateBudgetItems(opItems, expenses, currentFilter);
      const sortedBySpend = [...calcOp].sort((a, b) => b.actual_spend - a.actual_spend);
      const topOpItem = sortedBySpend[0];

      return {
        sender: 'assistant',
        text: `הסעיף היקר ביותר בקבוצת **תפעול ואחזקה** הוא **${topOpItem.name} (${topOpItem.fi_code})**:\n\n` +
          `• **ביצוע בפועל:** ${formatCurrency(topOpItem.actual_spend)}\n` +
          `• **תקציב מותאם:** ${formatCurrency(topOpItem.adjusted_budget)}\n` +
          `• **אחוז ניצול:** ${topOpItem.utilization_pct.toFixed(1)}% ` +
          (topOpItem.status === 'over' ? '⚠️ (בחריגה)' : '✅'),
        structuredData: {
          type: 'items_list',
          title: 'סעיפי תפעול מובילים לפי הוצאה',
          items: sortedBySpend.slice(0, 4).map((i) => ({
            label: `${i.fi_code} - ${i.name}`,
            value: formatCurrency(i.actual_spend),
            secondary: `תקציב: ${formatCurrency(i.adjusted_budget)}`,
            badge: {
              text: `${i.utilization_pct.toFixed(0)}%`,
              color: i.status === 'over' ? 'red' : 'blue',
            },
          })),
        },
      };
    }

    if (q.includes('חשמל') || q.includes('מים')) {
      const utilityExp = opExpenses.filter(
        (e) =>
          e.vendor.includes('חשמל') ||
          e.vendor.includes('מים') ||
          e.fi_code === 'FI-1001' ||
          e.fi_code === 'FI-1002'
      );
      const totalUtility = utilityExp.reduce((s, e) => s + e.amount, 0);

      return {
        sender: 'assistant',
        text: `הוצאות **חשמל ואנרגיה למבנים** בקבוצת תפעול ואחזקה:\n\n` +
          `• סך הכל תשלומים שנרשמו: **${formatCurrency(totalUtility)}** (${utilityExp.length} חשבוניות)\n` +
          `• תשלומים מול חברת החשמל וספקי תשתיות.`,
        structuredData: {
          type: 'table',
          title: 'חשבוניות חשמל ואנרגיה',
          items: utilityExp.map((e) => ({
            label: `${e.vendor} (${e.date})`,
            value: formatCurrency(e.amount),
            secondary: `אסמכתא: ${e.ref_number}`,
            badge: { text: e.fi_code, color: 'blue' },
          })),
        },
      };
    }
  }

  // 6. Vehicles specific questions (דלק / ליסינג)
  if (q.includes('רכב') || q.includes('רכבים') || q.includes('דלק')) {
    const vhItems = budgetItems.filter((i) => i.group === 'רכבים ודלק');
    const vhItemIds = new Set(vhItems.map((i) => i.id));
    const vhExpenses = expenses.filter((e) => vhItemIds.has(e.budget_item_id));

    if (q.includes('דלק')) {
      const fuelExp = vhExpenses.filter(
        (e) =>
          e.vendor.includes('פז') ||
          e.vendor.includes('דלק') ||
          e.vendor.includes('סונול') ||
          e.fi_code === 'FI-2005'
      );
      const totalFuel = fuelExp.reduce((s, e) => s + e.amount, 0);

      return {
        sender: 'assistant',
        text: `הוצאות **דלק ותדלוקים** לצי הרכב:\n\n` +
          `• סך הכל הוצאות דלק שנרשמו: **${formatCurrency(totalFuel)}** (${fuelExp.length} תנועות)\n` +
          `• תדלוקים בחברות הדלק המובילות (פז, סונול, דלק).`,
        structuredData: {
          type: 'table',
          title: 'פירוט הוצאות דלק',
          items: fuelExp.map((e) => ({
            label: `${e.vendor} - ${e.date}`,
            value: formatCurrency(e.amount),
            secondary: `אסמכתא: ${e.ref_number}`,
            badge: { text: 'דלק', color: 'blue' },
          })),
        },
      };
    }
  }

  // 7. General Group Spend (תפעול, רכבים, הסעדה, תקשורת, נדל"ן, מחשוב, הנהלה)
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

  const calculated = calculateBudgetItems(budgetItems, expenses, currentFilter);

  if (targetGroup) {
    const groupItems = calculated.filter((i) => i.group === targetGroup);
    const totalGroupBudget = groupItems.reduce((s, i) => s + i.adjusted_budget, 0);
    const totalGroupSpend = groupItems.reduce((s, i) => s + i.actual_spend, 0);
    const groupBalance = totalGroupBudget - totalGroupSpend;
    const groupPct = totalGroupBudget > 0 ? (totalGroupSpend / totalGroupBudget) * 100 : 0;

    const groupItemIds = new Set(groupItems.map((i) => i.id));
    const groupExpenses = expenses.filter((e) => groupItemIds.has(e.budget_item_id));
    const topGroupExpenses = [...groupExpenses].sort((a, b) => b.amount - a.amount).slice(0, 3);

    return {
      sender: 'assistant',
      text: `בקבוצת **${targetGroup}**:\n\n` +
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

  // 8. Alerts & Over Budget
  if (q.includes('חריג') || q.includes('חריגה') || q.includes('חריגות') || q.includes('אדום') || q.includes('מעל התקציב')) {
    const overItems = calculated.filter((i) => i.status === 'over');
    const warningItems = calculated.filter((i) => i.status === 'warning');

    if (overItems.length === 0 && warningItems.length === 0) {
      return {
        sender: 'assistant',
        text: 'חדשות מעולות! אין אף סעיף בחריגה או באזהרה. כל הסעיפים עומדים במסגרת התקציב המאושרת (מתחת ל-80% ניצול).',
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
      text: `נמצאו ${overItems.length} סעיפים בחריגה אדומה (מעל 100%) ו-${warningItems.length} סעיפים באזהרה (80%-99%):`,
      structuredData: {
        type: 'items_list',
        title: 'סעיפים הדורשים תשומת לב תקציבית',
        items: itemsData,
      },
    };
  }

  // 9. Top Vendors
  if (q.includes('ספק') || q.includes('ספקים') || q.includes('ספק מוביל') || q.includes('הכי הרבה')) {
    const vendorMap: Record<string, { total: number; count: number; lastDate: string }> = {};

    expenses.forEach((e) => {
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
        text: 'לא נמצאו הוצאות או ספקים במערכת.',
      };
    }

    const top1 = sortedVendors[0];
    const top5 = sortedVendors.slice(0, 5);

    return {
      sender: 'assistant',
      text: `הספק המוביל במערכת הוא **${top1.name}**, עם סך הוצאות של **${formatCurrency(top1.total)}** (${top1.count} תנועות).\n\nלהלן 5 הספקים המובילים:`,
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

  // 10. Month Spend
  let targetMonth: number | null = null;
  for (const [name, num] of Object.entries(MONTH_NAMES_HEBREW)) {
    if (q.includes(name)) {
      targetMonth = num;
      break;
    }
  }

  if (targetMonth) {
    const monthExpenses = expenses.filter((e) => {
      const [y, m] = e.date.split('-').map(Number);
      return y === targetYear && m === targetMonth;
    });

    const totalMonthSpend = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalMonthBudget = budgetItems.reduce((s, i) => s + i.monthly_budget, 0);
    const monthBalance = totalMonthBudget - totalMonthSpend;
    const monthPct = totalMonthBudget > 0 ? (totalMonthSpend / totalMonthBudget) * 100 : 0;
    const monthHebrew = Object.keys(MONTH_NAMES_HEBREW).find(
      (k) => MONTH_NAMES_HEBREW[k] === targetMonth
    );

    return {
      sender: 'assistant',
      text: `בחודש **${monthHebrew} ${targetYear}**:\n\n` +
        `• **סך הכל הוצאות בפועל:** ${formatCurrency(totalMonthSpend)}\n` +
        `• **תקציב חודשי מאושר:** ${formatCurrency(totalMonthBudget)}\n` +
        `• **יתרה שנותרה לחודש זה:** ${formatCurrency(monthBalance)}\n` +
        `• **אחוז ניצול כולל:** ${monthPct.toFixed(1)}% (${monthExpenses.length} תנועות הוצאה)`,
    };
  }

  // 11. General Default
  const totalBudget = calculated.reduce((s, i) => s + i.adjusted_budget, 0);
  const totalSpend = calculated.reduce((s, i) => s + i.actual_spend, 0);
  const totalRemaining = totalBudget - totalSpend;
  const pct = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

  return {
    sender: 'assistant',
    text: `הנה תמונת המצב התקציבית הנוכחית:\n\n` +
      `• **סך תקציב מוקצה:** ${formatCurrency(totalBudget)}\n` +
      `• **סך ביצוע בפועל:** ${formatCurrency(totalSpend)}\n` +
      `• **יתרה תקציבית:** ${formatCurrency(totalRemaining)}\n` +
      `• **אחוז ניצול:** ${pct.toFixed(1)}%\n\n` +
      `💡 תוכל לסנן שאלות מוכנות בסרגל השאלות בצד ימין (למשל לחפש "תפעול" או "רכבים") או להקליד כל שאלה בשפה חופשית.`,
  };
}

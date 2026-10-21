import { BudgetItem, Expense } from '../types';

export const INITIAL_GROUPS = [
  { name: 'הסעדה וכיבוד', code: 'FI-100', color: '#3b82f6' },
  { name: 'תפעול, אחזקה ובינוי קדימה', code: 'FI-200', color: '#10b981' },
  { name: 'ציוד משרדי ודפוס', code: 'FI-300', color: '#8b5cf6' },
  { name: 'תקשורת ומחשוב', code: 'FI-400', color: '#06b6d4' },
  { name: 'נדל"ן ומיסוי מוניציפלי', code: 'FI-500', color: '#f59e0b' },
  { name: 'נסיעות והסעות', code: 'FI-600', color: '#ec4899' },
  { name: 'רכבים ודלק', code: 'FI-700', color: '#f97316' },
];

export const INITIAL_BUDGET_ITEMS: BudgetItem[] = [
  // 1. הסעדה וכיבוד (FI-100)
  { id: 'bi-101', fi_code: 'FI-101', name: 'ארוחות צהרים- טכנולוגיות', group: 'הסעדה וכיבוד', monthly_budget: 35000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-102', fi_code: 'FI-102', name: 'ארוחות צהרים גליל', group: 'הסעדה וכיבוד', monthly_budget: 18000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-103', fi_code: 'FI-103', name: 'ארוחות עובדים נכסים', group: 'הסעדה וכיבוד', monthly_budget: 12000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-104', fi_code: 'FI-104', name: 'ארוחות צהרים שורק כולל ספקי שורק', group: 'הסעדה וכיבוד', monthly_budget: 22000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-105', fi_code: 'FI-105', name: 'ארוחות עובדי נכסים במרלוג', group: 'הסעדה וכיבוד', monthly_budget: 8500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-106', fi_code: 'FI-106', name: 'ארוחות עובדי טכנולוגיות במרלוג', group: 'הסעדה וכיבוד', monthly_budget: 9500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-107', fi_code: 'FI-107', name: 'ארוחות עובדי נכסים באומיס', group: 'הסעדה וכיבוד', monthly_budget: 6000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-108', fi_code: 'FI-108', name: 'ארוחות בצ"מ (ארוחות בוקר מעדנים וכריכים)', group: 'הסעדה וכיבוד', monthly_budget: 7000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-109', fi_code: 'FI-109', name: 'ארוחות ערב', group: 'הסעדה וכיבוד', monthly_budget: 4500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-110', fi_code: 'FI-110', name: 'כיבודים', group: 'הסעדה וכיבוד', monthly_budget: 5000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-111', fi_code: 'FI-111', name: 'חלב', group: 'הסעדה וכיבוד', monthly_budget: 3500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-112', fi_code: 'FI-112', name: 'תפוזים / נענע', group: 'הסעדה וכיבוד', monthly_budget: 1800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-113', fi_code: 'FI-113', name: 'מכונת קפה + פולי קפה', group: 'הסעדה וכיבוד', monthly_budget: 6500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-114', fi_code: 'FI-114', name: 'השכרת מסחטת תפוזים', group: 'הסעדה וכיבוד', monthly_budget: 1200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-115', fi_code: 'FI-115', name: 'תמי 4- תחזוקה שנתית (חידוש מסלול שירות)', group: 'הסעדה וכיבוד', monthly_budget: 4200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-116', fi_code: 'FI-116', name: 'פרודוקטים / כיבודים שונים', group: 'הסעדה וכיבוד', monthly_budget: 8000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-117', fi_code: 'FI-117', name: 'פרודוקטים כולל מרלוג (כולל שינוי מספר עובדים)', group: 'הסעדה וכיבוד', monthly_budget: 11000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-118', fi_code: 'FI-118', name: 'ניקיון חדר אוכל', group: 'הסעדה וכיבוד', monthly_budget: 5500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-119', fi_code: 'FI-119', name: 'מבדקי הסעדה', group: 'הסעדה וכיבוד', monthly_budget: 2500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-120', fi_code: 'FI-120', name: 'משגיח כשרות', group: 'הסעדה וכיבוד', monthly_budget: 3000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-121', fi_code: 'FI-121', name: 'אגרת כשרות', group: 'הסעדה וכיבוד', monthly_budget: 1500, updated_at: '2026-01-01T00:00:00Z' },

  // 2. תפעול, אחזקה ובינוי קדימה (FI-200)
  { id: 'bi-201', fi_code: 'FI-201', name: 'שירותי ניקיון קדימה כולל ניקיון חלונות', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 28000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-202', fi_code: 'FI-202', name: 'שירותי ביוב', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-203', fi_code: 'FI-203', name: 'פינוי פסולת', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 5200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-204', fi_code: 'FI-204', name: 'פינוי פחים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 4000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-205', fi_code: 'FI-205', name: 'שירות למגרסה ואיסוף קרטונים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 2200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-206', fi_code: 'FI-206', name: 'גינון קדימה+ תוספות', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 6500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-207', fi_code: 'FI-207', name: 'שירותי הדברה חיפה וקדימה', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 2800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-208', fi_code: 'FI-208', name: 'ניקוי ארובות ומנדפים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-209', fi_code: 'FI-209', name: 'שירותי אבטחה קדימה- כולל תגבור', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 45000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-210', fi_code: 'FI-210', name: 'קצין בטיחות בתעבורה', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 7500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-211', fi_code: 'FI-211', name: 'הסכם שירות+מצלמות', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 4800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-212', fi_code: 'FI-212', name: 'ייעוץ ושירותי קב"ט', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 6000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-213', fi_code: 'FI-213', name: 'ממונה בטיחות', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 8000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-214', fi_code: 'FI-214', name: 'מגאסון - בקרת כניסה', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-215', fi_code: 'FI-215', name: 'הסכם שנתי - אישורי תקינות חשמל', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-216', fi_code: 'FI-216', name: 'חשמל', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 55000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-217', fi_code: 'FI-217', name: 'מים קדימה', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 9000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-218', fi_code: 'FI-218', name: 'איש אחזקה', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 14000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-219', fi_code: 'FI-219', name: 'בדיקת תחזוקה מערכת אש ותיקון גלאי חדר חשמל', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 2500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-220', fi_code: 'FI-220', name: 'כיבוי אש ספרינקלרים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-221', fi_code: 'FI-221', name: 'ביקורת שנתית לכיבויים במדפים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 2000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-222', fi_code: 'FI-222', name: 'הסכם שירות, קריאות ותיקונים+עבודות מד"א', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 4500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-223', fi_code: 'FI-223', name: 'אחסון שנתי לארכיב', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 5000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-224', fi_code: 'FI-224', name: 'תיקון שערים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-225', fi_code: 'FI-225', name: 'תחזוקת מעליות', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 4200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-226', fi_code: 'FI-226', name: 'איל ריפס -בדיקת בטיחות למעלית', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 1500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-227', fi_code: 'FI-227', name: 'טואלטיקה', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 6500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-228', fi_code: 'FI-228', name: 'כוסות ממותגות', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 2500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-229', fi_code: 'FI-229', name: 'ציוד לחדרי שירותים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-230', fi_code: 'FI-230', name: 'ביקורת שנתית מע מתזים', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 1800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-231', fi_code: 'FI-231', name: 'ציוד אחזקה + תחזוקה כללית', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 8500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-232', fi_code: 'FI-232', name: 'חוזה גנרטור', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 3500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-233', fi_code: 'FI-233', name: 'הדרכת נהיגה מעשית', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 2000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-234', fi_code: 'FI-234', name: 'בדיקת תקינות דפיברילטור', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-235', fi_code: 'FI-235', name: 'אחסון שנתי ציוד משרדי', group: 'תפעול, אחזקה ובינוי קדימה', monthly_budget: 4500, updated_at: '2026-01-01T00:00:00Z' },

  // 3. ציוד משרדי ודפוס (FI-300)
  { id: 'bi-301', fi_code: 'FI-301', name: 'סרט צילום למדפסת תגים וכרטיסים', group: 'ציוד משרדי ודפוס', monthly_budget: 2000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-302', fi_code: 'FI-302', name: 'ציוד משרדי', group: 'ציוד משרדי ודפוס', monthly_budget: 7500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-303', fi_code: 'FI-303', name: 'ציוד משרדי וגרפיקה- כרטיסי ביקור', group: 'ציוד משרדי ודפוס', monthly_budget: 2500, updated_at: '2026-01-01T00:00:00Z' },

  // 4. תקשורת ומחשוב (FI-400)
  { id: 'bi-401', fi_code: 'FI-401', name: 'שיחות ניידים כולל שיחות חו"ל', group: 'תקשורת ומחשוב', monthly_budget: 16000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-402', fi_code: 'FI-402', name: 'קו טלפון - לבג אמיר', group: 'תקשורת ומחשוב', monthly_budget: 1500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-403', fi_code: 'FI-403', name: 'ניידים שדרוגים', group: 'תקשורת ומחשוב', monthly_budget: 8000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-404', fi_code: 'FI-404', name: 'מרכזיה ניידים', group: 'תקשורת ומחשוב', monthly_budget: 6500, updated_at: '2026-01-01T00:00:00Z' },

  // 5. נדל"ן ומיסוי מוניציפלי (FI-500)
  { id: 'bi-501', fi_code: 'FI-501', name: 'שכירות קדימה', group: 'נדל"ן ומיסוי מוניציפלי', monthly_budget: 125000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-502', fi_code: 'FI-502', name: 'ארנונה קדימה', group: 'נדל"ן ומיסוי מוניציפלי', monthly_budget: 38000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-503', fi_code: 'FI-503', name: 'אגרת שילוט', group: 'נדל"ן ומיסוי מוניציפלי', monthly_budget: 2500, updated_at: '2026-01-01T00:00:00Z' },

  // 6. נסיעות והסעות (FI-600)
  { id: 'bi-601', fi_code: 'FI-601', name: 'נתב"ג נסיעות עובדים', group: 'נסיעות והסעות', monthly_budget: 14000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-602', fi_code: 'FI-602', name: 'ערכות אבל', group: 'נסיעות והסעות', monthly_budget: 1500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-603', fi_code: 'FI-603', name: 'הסעות עובדים ושליחויות', group: 'נסיעות והסעות', monthly_budget: 18000, updated_at: '2026-01-01T00:00:00Z' },

  // 7. רכבים ודלק (FI-700)
  { id: 'bi-701', fi_code: 'FI-701', name: 'דלק וסונול', group: 'רכבים ודלק', monthly_budget: 42000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-702', fi_code: 'FI-702', name: 'דור אנרגיה', group: 'רכבים ודלק', monthly_budget: 15000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-703', fi_code: 'FI-703', name: 'תן', group: 'רכבים ודלק', monthly_budget: 8000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-704', fi_code: 'FI-704', name: 'שטיפת רכבים', group: 'רכבים ודלק', monthly_budget: 4500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-705', fi_code: 'FI-705', name: 'כביש 6', group: 'רכבים ודלק', monthly_budget: 9500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-706', fi_code: 'FI-706', name: 'מנהרות הכרמל', group: 'רכבים ודלק', monthly_budget: 3500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-707', fi_code: 'FI-707', name: 'נוהל 6 דיווחי נהיגה + מדבקות איך אני נוהג', group: 'רכבים ודלק', monthly_budget: 2200, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-708', fi_code: 'FI-708', name: 'בדיקת רישום תעבורתי- עובדי החברה', group: 'רכבים ודלק', monthly_budget: 1800, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-709', fi_code: 'FI-709', name: 'סלופארק לב השרון', group: 'רכבים ודלק', monthly_budget: 16000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-710', fi_code: 'FI-710', name: 'חניות עובדים + מדבקות', group: 'רכבים ודלק', monthly_budget: 5000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-711', fi_code: 'FI-711', name: 'ליסינג והשכרת רכב', group: 'רכבים ודלק', monthly_budget: 85000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-712', fi_code: 'FI-712', name: 'קנסות ודוחות', group: 'רכבים ודלק', monthly_budget: 3000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'bi-713', fi_code: 'FI-713', name: 'אחזקת רכב אחרת', group: 'רכבים ודלק', monthly_budget: 6000, updated_at: '2026-01-01T00:00:00Z' },
];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_BUDGET_ITEMS_KADIMA: BudgetItem[] = INITIAL_BUDGET_ITEMS;

export const INITIAL_GROUPS_MARLOG = [
  { name: 'תפעול, אחזקה ובינוי מרלוג', code: 'FI-200M', color: '#10b981' },
  { name: 'אחסנה, אריזה ושינוע', code: 'FI-300M', color: '#8b5cf6' },
  { name: 'מלגזות, ציוד כבד ורכבים', code: 'FI-700M', color: '#f97316' },
  { name: 'ארוחות והסעדת עובדי מרלוג', code: 'FI-100M', color: '#3b82f6' },
  { name: 'תקשורת ומחשוב מרלוג', code: 'FI-400M', color: '#06b6d4' },
  { name: 'שכירות, ארנונה ואגרות מרלוג', code: 'FI-500M', color: '#f59e0b' },
  { name: 'בטיחות, אבטחה וכיבוי אש', code: 'FI-600M', color: '#ec4899' },
];

export const INITIAL_BUDGET_ITEMS_MARLOG: BudgetItem[] = [
  { id: 'm-201', fi_code: 'FI-201M', name: 'תחזוקת מבנה מרלוג ושערים', group: 'תפעול, אחזקה ובינוי מרלוג', monthly_budget: 15000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-202', fi_code: 'FI-202M', name: 'חשמל מרלוג', group: 'תפעול, אחזקה ובינוי מרלוג', monthly_budget: 45000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-203', fi_code: 'FI-203M', name: 'מים וארנונה מרלוג', group: 'תפעול, אחזקה ובינוי מרלוג', monthly_budget: 12000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-204', fi_code: 'FI-204M', name: 'שירותי ניקיון מרלוג', group: 'תפעול, אחזקה ובינוי מרלוג', monthly_budget: 18000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-301', fi_code: 'FI-301M', name: 'משטחים וציוד אריזה', group: 'אחסנה, אריזה ושינוע', monthly_budget: 25000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-302', fi_code: 'FI-302M', name: 'שירותי שילוח והפצה לוגיסטית', group: 'אחסנה, אריזה ושינוע', monthly_budget: 35000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-701', fi_code: 'FI-701M', name: 'אחזקה וליסינג מלגזות', group: 'מלגזות, ציוד כבד ורכבים', monthly_budget: 28000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-702', fi_code: 'FI-702M', name: 'דלק וסולר תפעולי', group: 'מלגזות, ציוד כבד ורכבים', monthly_budget: 18000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-101', fi_code: 'FI-101M', name: 'ארוחות צהרים עובדי מרלוג', group: 'ארוחות והסעדת עובדי מרלוג', monthly_budget: 22000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-102', fi_code: 'FI-102M', name: 'קפה, חלב וכיבודים מרלוג', group: 'ארוחות והסעדת עובדי מרלוג', monthly_budget: 4500, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-401', fi_code: 'FI-401M', name: 'מסופונים ותקשורת מחסנים', group: 'תקשורת ומחשוב מרלוג', monthly_budget: 12000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-501', fi_code: 'FI-501M', name: 'שכירות מתחם מרלוג', group: 'שכירות, ארנונה ואגרות מרלוג', monthly_budget: 95000, updated_at: '2026-01-01T00:00:00Z' },
  { id: 'm-601', fi_code: 'FI-601M', name: 'בטיחות אש ואבטחת מרלוג', group: 'בטיחות, אבטחה וכיבוי אש', monthly_budget: 20000, updated_at: '2026-01-01T00:00:00Z' },
];

export const SITES_METADATA = {
  kadima: {
    id: 'kadima' as const,
    name: 'מתחם קדימה',
    shortName: 'קדימה',
    subtitle: 'מטה מרכזי, הנהלה ופיתוח',
    tag: 'מתחם ראשי',
    color: 'from-blue-600 to-indigo-700',
    description: 'ניהול ובקרת תקציב למטה המרכזי בקדימה — תפעול, אחזקה, הנהלה, פיתוח, רכבים ורכש',
  },
  marlog: {
    id: 'marlog' as const,
    name: 'מרלוג',
    shortName: 'מרלוג',
    subtitle: 'מרכז לוגיסטי, אחסנה והפצה',
    tag: 'מרכז לוגיסטי',
    color: 'from-emerald-600 to-teal-700',
    description: 'ניהול ובקרת תקציב למרכז הלוגיסטי (מרלוג) — אחסנה, שינוע, הפצה, מלגזות ותפעול מחסנים',
  },
};

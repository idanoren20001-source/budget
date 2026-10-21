import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Building2,
  Boxes,
  DollarSign,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import { BudgetItem, SiteId } from '../types';
import { formatCurrency } from '../utils/budgetUtils';
import { SITES_METADATA } from '../data/initialData';

interface BudgetExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSite: SiteId;
  onImportBudget: (
    items: BudgetItem[],
    targetSite: SiteId,
    mode: 'replace' | 'merge'
  ) => void;
}

interface ParsedBudgetItemRow {
  id: string;
  selected: boolean;
  fi_code: string;
  name: string;
  group: string;
  annual_budget: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  monthly_budget: number;
  monthly_breakdown?: Record<number, number>;
  sourceFile: string;
  sourceSheet: string;
  rowIndex: number;
}

interface ColumnMapping {
  fi_code: string;
  name: string;
  group: string;
  annual_budget: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  monthly_budget: string;
}

function parseAmount(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Math.abs(val);
  const clean = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

// Hebrew and English dictionary for column header detection
const COLUMN_PATTERNS = {
  fi_code: [
    /^fi[-_\s]?code$/i,
    /^fi$/i,
    /קוד\s*סעיף/,
    /מספר\s*סעיף/,
    /סעיף\s*תקציבי/,
    /^קוד$/,
    /^code$/i,
    /^סעיף$/,
    /מס['\s]*סעיף/,
    /מספר\s*חשבון/,
    /^gl[-_\s]?account$/i,
    /^account$/i,
  ],
  name: [
    /שם\s*סעיף/,
    /תיאור\s*סעיף/,
    /^שם$/,
    /^תיאור$/,
    /^נושא$/,
    /^פירוט$/,
    /^item\s*name$/i,
    /^item$/i,
    /^description$/i,
    /^name$/i,
    /^title$/i,
  ],
  group: [
    /^קטגוריה$/,
    /^קבוצה$/,
    /^תחום$/,
    /^מחלקה$/,
    /^סוג$/,
    /^group$/i,
    /^category$/i,
    /^department$/i,
    /^section$/i,
  ],
  annual_budget: [
    /תקציב\s*שנתי/,
    /^שנתי$/,
    /סה["״]?כ\s*שנתי/,
    /סה["״]?כ\s*תקציב/,
    /סך\s*הכל/,
    /סכום\s*שנתי/,
    /תקציב\s*202\d/,
    /^תקציב$/,
    /^annual$/i,
    /^annual\s*budget$/i,
    /^total\s*budget$/i,
    /^yearly$/i,
    /^total$/i,
  ],
  q1: [
    /^q1$/i,
    /רבעון\s*1/,
    /רבעון\s*א['״]?/,
    /^quarter\s*1$/i,
    /רבעון\s*ראשון/,
  ],
  q2: [
    /^q2$/i,
    /רבעון\s*2/,
    /רבעון\s*ב['״]?/,
    /^quarter\s*2$/i,
    /רבעון\s*שני/,
  ],
  q3: [
    /^q3$/i,
    /רבעון\s*3/,
    /רבעון\s*ג['״]?/,
    /^quarter\s*3$/i,
    /רבעון\s*שלישי/,
  ],
  q4: [
    /^q4$/i,
    /רבעון\s*4/,
    /רבעון\s*ד['״]?/,
    /^quarter\s*4$/i,
    /רבעון\s*רביעי/,
  ],
  monthly_budget: [
    /^חודשי$/,
    /תקציב\s*חודשי/,
    /חודש\s*ממוצע/,
    /^monthly$/i,
    /^monthly\s*budget$/i,
  ],
};

const MONTH_PATTERNS: Array<{ month: number; regex: RegExp }> = [
  { month: 1, regex: /(ינואר|^jan)/i },
  { month: 2, regex: /(פברואר|^feb)/i },
  { month: 3, regex: /(מרץ|^mar)/i },
  { month: 4, regex: /(אפריל|^apr)/i },
  { month: 5, regex: /(מאי|^may)/i },
  { month: 6, regex: /(יוני|^jun)/i },
  { month: 7, regex: /(יולי|^jul)/i },
  { month: 8, regex: /(אוגוסט|^aug)/i },
  { month: 9, regex: /(ספטמבר|^sep)/i },
  { month: 10, regex: /(אוקטובר|^oct)/i },
  { month: 11, regex: /(נובמבר|^nov)/i },
  { month: 12, regex: /(דצמבר|^dec)/i },
];

export const BudgetExcelImportModal: React.FC<BudgetExcelImportModalProps> = ({
  isOpen,
  onClose,
  activeSite,
  onImportBudget,
}) => {
  const [targetSite, setTargetSite] = useState<SiteId>(activeSite);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [parsedRows, setParsedRows] = useState<ParsedBudgetItemRow[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    fi_code: '',
    name: '',
    group: '',
    annual_budget: '',
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    monthly_budget: '',
  });
  const [showMappingSettings, setShowMappingSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync target site with prop when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTargetSite(activeSite);
    }
  }, [isOpen, activeSite]);

  if (!isOpen) return null;

  // Auto detect columns from header row
  const detectColumnMapping = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      fi_code: '',
      name: '',
      group: '',
      annual_budget: '',
      q1: '',
      q2: '',
      q3: '',
      q4: '',
      monthly_budget: '',
    };

    headers.forEach((h) => {
      const trimmed = h.trim();
      if (!trimmed) return;

      Object.entries(COLUMN_PATTERNS).forEach(([key, patterns]) => {
        const fieldKey = key as keyof ColumnMapping;
        if (!mapping[fieldKey]) {
          const match = patterns.some((p) => p.test(trimmed));
          if (match) {
            mapping[fieldKey] = trimmed;
          }
        }
      });
    });

    return mapping;
  };

  // Process raw workbook sheets into ParsedBudgetItemRow
  const processWorkbook = (
    workbook: XLSX.WorkBook,
    fileName: string,
    existingRows: ParsedBudgetItemRow[] = []
  ) => {
    const newRows: ParsedBudgetItemRow[] = [];
    let allDetectedCols: string[] = [];
    let initialMapping: ColumnMapping | null = null;

    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;

      const rawJson = XLSX.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        defval: '',
        blankrows: false,
      });

      if (!rawJson || rawJson.length === 0) return;

      // Find header row (scan first 15 rows)
      let headerRowIndex = 0;
      let maxMatches = -1;
      let headers: string[] = [];

      for (let r = 0; r < Math.min(15, rawJson.length); r++) {
        const row = rawJson[r];
        if (!Array.isArray(row)) continue;
        const rowStrings = row.map((c) => String(c || '').trim());
        let matches = 0;

        rowStrings.forEach((cellText) => {
          Object.values(COLUMN_PATTERNS).forEach((patterns) => {
            if (patterns.some((p) => p.test(cellText))) {
              matches++;
            }
          });
        });

        if (matches > maxMatches && matches >= 2) {
          maxMatches = matches;
          headerRowIndex = r;
          headers = rowStrings;
        }
      }

      // If no strong header found, fallback to row 0
      if (headers.length === 0 && rawJson.length > 0) {
        headers = (rawJson[0] as any[]).map((c) => String(c || '').trim());
        headerRowIndex = 0;
      }

      allDetectedCols = Array.from(new Set([...allDetectedCols, ...headers.filter(Boolean)]));

      const mapping = initialMapping || detectColumnMapping(headers);
      if (!initialMapping) initialMapping = mapping;

      // Check for individual month columns
      const monthCols: Array<{ month: number; colIndex: number }> = [];
      headers.forEach((h, colIdx) => {
        MONTH_PATTERNS.forEach(({ month, regex }) => {
          if (regex.test(h) && !monthCols.some((m) => m.month === month)) {
            monthCols.push({ month, colIndex: colIdx });
          }
        });
      });

      // Map header strings to column indices
      const colIndices = {
        fi_code: headers.findIndex((h) => h === mapping.fi_code),
        name: headers.findIndex((h) => h === mapping.name),
        group: headers.findIndex((h) => h === mapping.group),
        annual_budget: headers.findIndex((h) => h === mapping.annual_budget),
        q1: headers.findIndex((h) => h === mapping.q1),
        q2: headers.findIndex((h) => h === mapping.q2),
        q3: headers.findIndex((h) => h === mapping.q3),
        q4: headers.findIndex((h) => h === mapping.q4),
        monthly_budget: headers.findIndex((h) => h === mapping.monthly_budget),
      };

      let currentSectionCategory = '';

      for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
        const row = rawJson[r] as any[];
        if (!row || row.length === 0) continue;

        // Check if row is a section header (e.g. only text in col 0/1, no numeric amounts)
        const rowAmounts = row
          .map((c) => parseAmount(c))
          .filter((v) => v > 0);

        const firstColText = String(row[0] || row[1] || '').trim();
        const isHeaderLike =
          rowAmounts.length === 0 &&
          firstColText.length > 2 &&
          !/סה["״]?כ|total/i.test(firstColText);

        if (isHeaderLike) {
          currentSectionCategory = firstColText;
          continue;
        }

        // Check if total/summary row -> skip
        const isSummaryRow = row.some((c) =>
          /סה["״]?כ\s*כללי|סה["״]?כ\s*סופי|grand\s*total|total/i.test(String(c || ''))
        );
        if (isSummaryRow && rowAmounts.length > 0 && !row[colIndices.name]) {
          continue;
        }

        // Extract raw values
        const rawFiCode = colIndices.fi_code >= 0 ? String(row[colIndices.fi_code] || '').trim() : '';
        const rawName = colIndices.name >= 0 ? String(row[colIndices.name] || '').trim() : '';
        const rawGroup = colIndices.group >= 0 ? String(row[colIndices.group] || '').trim() : '';

        // If no name and no FI and no amounts, skip empty row
        if (!rawName && !rawFiCode && rowAmounts.length === 0) continue;

        // Extract numbers
        let annualVal = colIndices.annual_budget >= 0 ? parseAmount(row[colIndices.annual_budget]) : 0;
        let q1Val = colIndices.q1 >= 0 ? parseAmount(row[colIndices.q1]) : 0;
        let q2Val = colIndices.q2 >= 0 ? parseAmount(row[colIndices.q2]) : 0;
        let q3Val = colIndices.q3 >= 0 ? parseAmount(row[colIndices.q3]) : 0;
        let q4Val = colIndices.q4 >= 0 ? parseAmount(row[colIndices.q4]) : 0;
        let monthlyVal = colIndices.monthly_budget >= 0 ? parseAmount(row[colIndices.monthly_budget]) : 0;

        // Parse individual months if present
        const monthlyBreakdown: Record<number, number> = {};
        if (monthCols.length > 0) {
          monthCols.forEach(({ month, colIndex }) => {
            const mVal = parseAmount(row[colIndex]);
            if (mVal > 0) {
              monthlyBreakdown[month] = mVal;
            }
          });

          // Calculate quarters and annual from months if quarters were missing
          if (q1Val === 0 && (monthlyBreakdown[1] || monthlyBreakdown[2] || monthlyBreakdown[3])) {
            q1Val = (monthlyBreakdown[1] || 0) + (monthlyBreakdown[2] || 0) + (monthlyBreakdown[3] || 0);
          }
          if (q2Val === 0 && (monthlyBreakdown[4] || monthlyBreakdown[5] || monthlyBreakdown[6])) {
            q2Val = (monthlyBreakdown[4] || 0) + (monthlyBreakdown[5] || 0) + (monthlyBreakdown[6] || 0);
          }
          if (q3Val === 0 && (monthlyBreakdown[7] || monthlyBreakdown[8] || monthlyBreakdown[9])) {
            q3Val = (monthlyBreakdown[7] || 0) + (monthlyBreakdown[8] || 0) + (monthlyBreakdown[9] || 0);
          }
          if (q4Val === 0 && (monthlyBreakdown[10] || monthlyBreakdown[11] || monthlyBreakdown[12])) {
            q4Val = (monthlyBreakdown[10] || 0) + (monthlyBreakdown[11] || 0) + (monthlyBreakdown[12] || 0);
          }
        }

        // Reconcile amounts
        const quartersSum = q1Val + q2Val + q3Val + q4Val;
        if (annualVal === 0 && quartersSum > 0) {
          annualVal = quartersSum;
        } else if (annualVal > 0 && quartersSum === 0) {
          q1Val = Math.round(annualVal / 4);
          q2Val = Math.round(annualVal / 4);
          q3Val = Math.round(annualVal / 4);
          q4Val = Math.round(annualVal / 4);
        } else if (annualVal === 0 && quartersSum === 0 && monthlyVal > 0) {
          annualVal = monthlyVal * 12;
          q1Val = monthlyVal * 3;
          q2Val = monthlyVal * 3;
          q3Val = monthlyVal * 3;
          q4Val = monthlyVal * 3;
        }

        if (monthlyVal === 0 && annualVal > 0) {
          monthlyVal = Math.round(annualVal / 12);
        }

        // Group determination
        const finalGroup =
          rawGroup ||
          currentSectionCategory ||
          (targetSite === 'marlog' ? 'כללי מרלוג' : 'כללי');

        // FI Code determination
        const finalFiCode =
          rawFiCode ||
          `FI-${targetSite === 'marlog' ? 'M' : ''}${100 + existingRows.length + newRows.length + 1}`;

        // Item Name
        const finalName = rawName || `סעיף תקציב ${finalFiCode}`;

        newRows.push({
          id: `imp-bi-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
          selected: true,
          fi_code: finalFiCode,
          name: finalName,
          group: finalGroup,
          annual_budget: annualVal,
          q1: q1Val,
          q2: q2Val,
          q3: q3Val,
          q4: q4Val,
          monthly_budget: monthlyVal,
          monthly_breakdown: Object.keys(monthlyBreakdown).length > 0 ? monthlyBreakdown : undefined,
          sourceFile: fileName,
          sourceSheet: sheetName,
          rowIndex: r + 1,
        });
      }
    });

    setDetectedColumns(allDetectedCols);
    if (initialMapping) setColumnMapping(initialMapping);
    setParsedRows([...existingRows, ...newRows]);
  };

  // Handle file upload (supports single or multiple files)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFilesList: Array<{ name: string; size: number }> = [];

    Array.from(files).forEach((file) => {
      newFilesList.push({ name: file.name, size: file.size });
      const reader = new FileReader();

      reader.onload = (evt) => {
        try {
          const binary = evt.target?.result;
          const workbook = XLSX.read(binary, { type: 'binary' });
          processWorkbook(workbook, file.name, parsedRows);
        } catch (err: any) {
          console.error('Error parsing file:', err);
          setErrorMsg(`שגיאה בפענוח הקובץ ${file.name}: ${err.message || 'פורמט לא תקין'}`);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setErrorMsg(`שגיאה בקריאת הקובץ ${file.name}`);
        setIsProcessing(false);
      };

      reader.readAsBinaryString(file);
    });

    setUploadedFiles((prev) => [...prev, ...newFilesList]);
  };

  // Selection handlers
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const handleToggleRow = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  // Filtered rows for preview table
  const filteredRows = useMemo(() => {
    return parsedRows.filter((row) => {
      if (filterGroup !== 'all' && row.group !== filterGroup) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = row.name.toLowerCase().includes(q);
        const matchCode = row.fi_code.toLowerCase().includes(q);
        const matchGroup = row.group.toLowerCase().includes(q);
        return matchName || matchCode || matchGroup;
      }
      return true;
    });
  }, [parsedRows, filterGroup, searchTerm]);

  // Derived categories from parsed rows
  const extractedCategories = useMemo(() => {
    const set = new Set<string>();
    parsedRows.forEach((r) => {
      if (r.group) set.add(r.group);
    });
    return Array.from(set).sort();
  }, [parsedRows]);

  // Aggregated KPIs for selected rows
  const selectedRows = parsedRows.filter((r) => r.selected);
  const totalAnnualBudget = selectedRows.reduce((sum, r) => sum + r.annual_budget, 0);
  const totalQ1 = selectedRows.reduce((sum, r) => sum + r.q1, 0);
  const totalQ2 = selectedRows.reduce((sum, r) => sum + r.q2, 0);
  const totalQ3 = selectedRows.reduce((sum, r) => sum + r.q3, 0);
  const totalQ4 = selectedRows.reduce((sum, r) => sum + r.q4, 0);
  const totalMonthlyAvg = selectedRows.reduce((sum, r) => sum + r.monthly_budget, 0);

  // Final submit handler
  const handleConfirmImport = () => {
    if (selectedRows.length === 0) {
      alert('נא לבחור לפחות סעיף תקציב אחד לייבוא');
      return;
    }

    const itemsToSave: BudgetItem[] = selectedRows.map((r) => ({
      id: `bi-${r.fi_code.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}-${Date.now()}`,
      fi_code: r.fi_code,
      name: r.name,
      group: r.group,
      monthly_budget: r.monthly_budget,
      annual_budget: r.annual_budget,
      quarterly_budget: {
        q1: r.q1,
        q2: r.q2,
        q3: r.q3,
        q4: r.q4,
      },
      monthly_breakdown: r.monthly_breakdown,
      updated_at: new Date().toISOString(),
    }));

    onImportBudget(itemsToSave, targetSite, importMode);
    onClose();
  };

  const handleReset = () => {
    setParsedRows([]);
    setUploadedFiles([]);
    setErrorMsg(null);
    setSearchTerm('');
    setFilterGroup('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  ייבוא וסנכרון תקציב מאקסל
                </h2>
                <span className="bg-indigo-500/30 text-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  רבעונים + שנתי + קטגוריות
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                העלאת קובצי תקציב, חילוץ סעיפים, קטגוריות וחלוקה תקציבית מלאה באופן אוטומטי
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Site & Mode Selection Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Target Facility Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">ייבוא למתחם יעד:</span>
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => setTargetSite('kadima')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetSite === 'kadima'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>מתחם קדימה</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetSite('marlog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  targetSite === 'marlog'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>מרלוג</span>
              </button>
            </div>
          </div>

          {/* Import Mode Selection */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">אופן הטעינה:</span>
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-300 shadow-2xs">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  importMode === 'replace'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="מוחק סעיפים ישנים במתחם ומגדיר את הסעיפים מהאקסל החדש"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>החלפת תקציב קיים (נקי)</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  importMode === 'merge'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="מעדכן סעיפים קיימים לפי קוד FI ומוסיף חדשים"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>מיזוג ועדכון</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Dropzone (if no rows yet or to add more) */}
          {parsedRows.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-16 h-16 bg-white shadow-md rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-indigo-100">
                <UploadCloud className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                גרור לכאן את קובצי האקסל של התקציב או לחץ לבחירה
              </h3>
              <p className="text-xs text-slate-500 max-w-lg mb-4">
                תמיכה במספר קבצים ובמספר גיליונות (Tabs). המערכת שואבת אוטומטית עמודות של קוד סעיף, שם,
                קטגוריה, תקציב שנתי, רבעונים (Q1, Q2, Q3, Q4) ותקציב חודשי.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  📊 .xlsx / .xls
                </span>
                <span className="bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                  📑 .csv
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                  ✨ חילוץ רבעונים וקטגוריות אוטומטי
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Top KPI Cards for Parsed Data */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-medium text-slate-500">סעיפים שזוהו</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {selectedRows.length} <span className="text-xs font-normal text-slate-400">/ {parsedRows.length}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-medium text-slate-500">קטגוריות</div>
                  <div className="text-lg font-bold text-indigo-700 mt-0.5">
                    {extractedCategories.length}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-bold text-indigo-800">סה״כ שנתי</div>
                  <div className="text-base font-extrabold text-indigo-900 mt-0.5">
                    {formatCurrency(totalAnnualBudget)}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-bold text-blue-800">Q1 + Q2</div>
                  <div className="text-xs font-bold text-blue-900 mt-0.5">
                    {formatCurrency(totalQ1 + totalQ2)}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-bold text-blue-800">Q3 + Q4</div>
                  <div className="text-xs font-bold text-blue-900 mt-0.5">
                    {formatCurrency(totalQ3 + totalQ4)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className="text-[11px] font-medium text-slate-500">ממוצע חודשי</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {formatCurrency(totalMonthlyAvg)}
                  </div>
                </div>
              </div>

              {/* Extracted Categories Tags */}
              {extractedCategories.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 ml-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    קטגוריות שחולצו ({extractedCategories.length}):
                  </span>
                  {extractedCategories.map((cat) => (
                    <span
                      key={cat}
                      className="bg-white border border-indigo-200/80 text-indigo-800 text-[11px] font-semibold px-2 py-0.5 rounded-lg shadow-2xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Advanced Mapping Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowMappingSettings(!showMappingSettings)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>התאמת מיפוי עמודות ידנית (אופציונלי)</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      זוהו {detectedColumns.length} עמודות בקובץ
                    </span>
                  </div>
                  {showMappingSettings ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showMappingSettings && (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-white text-xs border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        קוד סעיף (FI)
                      </label>
                      <select
                        value={columnMapping.fi_code}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, fi_code: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- יצירה אוטומטית --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        שם סעיף / תיאור
                      </label>
                      <select
                        value={columnMapping.name}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, name: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- בחר עמודה --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        קטגוריה / קבוצה
                      </label>
                      <select
                        value={columnMapping.group}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, group: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- זיהוי אוטומטי / ברירת מחדל --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        תקציב שנתי (סה״כ)
                      </label>
                      <select
                        value={columnMapping.annual_budget}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, annual_budget: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- סכום 4 רבעונים --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        רבעון 1 (Q1)
                      </label>
                      <select
                        value={columnMapping.q1}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, q1: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- חישוב משנתי (שנתי/4) --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        רבעון 2 (Q2)
                      </label>
                      <select
                        value={columnMapping.q2}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, q2: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- חישוב משנתי (שנתי/4) --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        רבעון 3 (Q3)
                      </label>
                      <select
                        value={columnMapping.q3}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, q3: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- חישוב משנתי (שנתי/4) --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        רבעון 4 (Q4)
                      </label>
                      <select
                        value={columnMapping.q4}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, q4: e.target.value })
                        }
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white cursor-pointer"
                      >
                        <option value="">-- חישוב משנתי (שנתי/4) --</option>
                        {detectedColumns.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Table Controls (Search, Category Filter, Reset) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative w-full sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="חיפוש סעיף, קוד או קטגוריה..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="all">כל הקטגוריות ({extractedCategories.length})</option>
                    {extractedCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                    <span>הוסף קובץ נוסף</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>איפוס וטעינה מחדש</span>
                  </button>
                </div>
              </div>

              {/* Parsed Items Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 font-bold z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === parsedRows.length && parsedRows.length > 0}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3">קוד סעיף</th>
                      <th className="py-2.5 px-3">שם סעיף תקציבי</th>
                      <th className="py-2.5 px-3">קטגוריה</th>
                      <th className="py-2.5 px-3 font-extrabold text-indigo-900">שנתי (סה״כ)</th>
                      <th className="py-2.5 px-3">רבעון 1</th>
                      <th className="py-2.5 px-3">רבעון 2</th>
                      <th className="py-2.5 px-3">רבעון 3</th>
                      <th className="py-2.5 px-3">רבעון 4</th>
                      <th className="py-2.5 px-3">חודשי</th>
                      <th className="py-2.5 px-3 text-slate-400">קובץ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handleToggleRow(row.id)}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                          row.selected ? 'bg-indigo-50/20' : 'opacity-60 bg-slate-50/50'
                        }`}
                      >
                        <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => handleToggleRow(row.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          {row.fi_code}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-900">
                          {row.name}
                        </td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-md">
                            {row.group}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-extrabold text-indigo-900 font-mono">
                          {formatCurrency(row.annual_budget)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {formatCurrency(row.q1)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {formatCurrency(row.q2)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {formatCurrency(row.q3)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {formatCurrency(row.q4)}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {formatCurrency(row.monthly_budget)}
                        </td>
                        <td className="py-2 px-3 text-slate-400 text-[10px] truncate max-w-28" title={`${row.sourceFile} > ${row.sourceSheet}`}>
                          {row.sourceFile}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>
              מתחם יעד:{' '}
              <strong className="text-slate-900">
                {targetSite === 'marlog' ? '📦 מרלוג' : '🏢 מתחם קדימה'}
              </strong>{' '}
              | אופן טעינה:{' '}
              <strong className="text-slate-900">
                {importMode === 'replace' ? 'החלפת תקציב קיים' : 'מיזוג ועדכון'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="button"
              disabled={selectedRows.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer ${
                selectedRows.length > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/25'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                אישור וטעינת {selectedRows.length} סעיפי תקציב למערכת
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  HardDrive,
  Network,
  Copy,
  Check,
} from 'lucide-react';
import { createFullBackupSnapshot, restoreFromSnapshot } from '../services/storageService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRestored,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const jsonStr = createFullBackupSnapshot();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `גיבוי_בקרת_תקציב_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = restoreFromSnapshot(content);
        if (success) {
          onRestored();
          onClose();
        }
      }
    };
    reader.readAsText(file);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const copyUrl = () => {
    navigator.clipboard.writeText(currentHost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                גיבוי, שחזור וסנכרון בין מחשבים
              </h3>
              <p className="text-xs text-slate-400">
                ייצוא נתונים מלא וחיבור מכל מחשב אחר ברשת
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          
          {/* Multi-PC Access Info Banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1">
              <Network className="w-4 h-4 text-blue-600" />
              <span>גישה ממחשבים וטלפונים אחרים ברשת:</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed mb-2.5">
              השרת שומר קובץ נתונים מרכזי על המחשב המארח. פתח כתובת זו בכל מחשב אחר במשרד ותראה את כל השינויים בזמן אמת:
            </p>
            <div className="flex items-center justify-between bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800">
              <span className="truncate">{currentHost}</span>
              <button
                onClick={copyUrl}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] font-sans font-bold cursor-pointer ml-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'הועתק!' : 'העתק קישור'}</span>
              </button>
            </div>
          </div>

          {/* Backup & Restore Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            {/* Download Snapshot */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 mb-1">
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>הורדת גיבוי מלא</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  מייצא את כל 80+ הסעיפים, ההוצאות ויומן הפעולות לקובץ JSON מאובטח.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>הורד קובץ JSON</span>
              </button>
            </div>

            {/* Restore from Snapshot */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 mb-1">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>שחזור מקובץ גיבוי</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  טעינת קובץ גיבוי ושחזור מיידי של כלל המערכת על המחשב הנוכחי.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>בחר קובץ לשחזור</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            סגור
          </button>
        </div>

      </div>
    </div>
  );
};

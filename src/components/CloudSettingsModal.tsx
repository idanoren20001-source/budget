import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Database,
  Radio,
  RotateCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { CloudConfig } from '../types';
import { getStoredCloudConfig, saveCloudConfig, resetToDefaults } from '../services/storageService';

interface CloudSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const CloudSettingsModal: React.FC<CloudSettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
}) => {
  const [config, setConfig] = useState<CloudConfig>(getStoredCloudConfig());
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setConfig(getStoredCloudConfig());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudConfig({
      ...config,
      lastSyncedAt: new Date().toISOString(),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    if (
      confirm(
        'האם לאפס את כל הנתונים לברירת המחדל המקורית? (כל ההוצאות והסעיפים יוחזרו למצב ההתחלתי)'
      )
    ) {
      resetToDefaults();
      onResetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                סנכרון Real-Time ומסד נתונים בענן
              </h3>
              <p className="text-xs text-slate-400">
                סנכרון מיידי בין מחשבים, טאבים ומשתמשים ללא רענון עמוד
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

        {/* Real-time Status Card */}
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
          <Zap className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-emerald-900">
              סנכרון תוך-מערכתי מיידי (Cross-Tab Active)
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
              מנגנון ה-BroadcastChannel של המערכת פעיל כעת! כל שינוי, הזנת הוצאה או עדכון תקציב מסתנכרן אוטומטית בין כל הטאבים והחלונות הפתוחים.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          
          {/* Provider Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              בחר ספק מסד נתונים בענן:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  config.provider === 'local'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-800 ring-1 ring-blue-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="local"
                  checked={config.provider === 'local'}
                  onChange={() => setConfig({ ...config, provider: 'local' })}
                  className="sr-only"
                />
                <Database className="w-4 h-4 mb-1" />
                <span>מקומי + Offline</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  config.provider === 'supabase'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="supabase"
                  checked={config.provider === 'supabase'}
                  onChange={() => setConfig({ ...config, provider: 'supabase' })}
                  className="sr-only"
                />
                <Radio className="w-4 h-4 mb-1" />
                <span>Supabase</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  config.provider === 'firebase'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-800 ring-1 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value="firebase"
                  checked={config.provider === 'firebase'}
                  onChange={() => setConfig({ ...config, provider: 'firebase' })}
                  className="sr-only"
                />
                <Cloud className="w-4 h-4 mb-1" />
                <span>Firebase</span>
              </label>
            </div>
          </div>

          {/* Supabase inputs */}
          {config.provider === 'supabase' && (
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={config.supabaseUrl || ''}
                  onChange={(e) =>
                    setConfig({ ...config, supabaseUrl: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={config.supabaseAnonKey || ''}
                  onChange={(e) =>
                    setConfig({ ...config, supabaseAnonKey: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Firebase inputs */}
          {config.provider === 'firebase' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-100">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Firebase Web Config (JSON)
              </label>
              <textarea
                rows={3}
                placeholder='{"apiKey": "...", "projectId": "...", "firestore": "..."}'
                value={config.firebaseConfig || ''}
                onChange={(e) =>
                  setConfig({ ...config, firebaseConfig: e.target.value })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
            </div>
          )}

          {/* Offline Cache Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              נתונים נשמרים תמיד גם ב-Offline Cache מקומי לצורך עבודה רציפה במקרה של ניתוק רשת.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>איפוס נתוני הדגמה</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                סגור
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                {isSaved ? <CheckCircle2 className="w-4 h-4" /> : null}
                <span>{isSaved ? 'נשמר בהצלחה!' : 'שמור הגדרות'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

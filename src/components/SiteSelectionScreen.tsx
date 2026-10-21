import React from 'react';
import { Building2, Boxes, ArrowLeft, LogOut, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { SiteId } from '../types';
import { SITES_METADATA } from '../data/initialData';

interface SiteSelectionScreenProps {
  onSelectSite: (site: SiteId) => void;
  onLogout: () => void;
}

export const SiteSelectionScreen: React.FC<SiteSelectionScreenProps> = ({
  onSelectSite,
  onLogout,
}) => {
  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col items-center justify-center p-4 sm:p-6 font-['Assistant',sans-serif] relative overflow-hidden"
    >
      {/* Decorative Lights */}
      <div className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl w-full flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-3">
          <div className="h-12 px-3 py-1.5 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
            <img src="/logo.png" alt="IDE Technologies" className="h-8 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              בקרת תקציב ומשאבים ארגוניים
            </h1>
            <p className="text-xs text-slate-400">
              IDE Technologies — בחר מתחם עבודה להמשך פעילות
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/10"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>יציאה</span>
        </button>
      </div>

      {/* Main Choice Cards Grid */}
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 z-10">
        
        {/* Option 1: Kadima Site */}
        <div
          onClick={() => onSelectSite('kadima')}
          className="group bg-white/95 hover:bg-white rounded-3xl p-8 border border-white/20 hover:border-blue-400 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                {SITES_METADATA.kadima.tag}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
              {SITES_METADATA.kadima.name}
            </h2>
            <p className="text-xs font-bold text-slate-500 mb-3">
              {SITES_METADATA.kadima.subtitle}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {SITES_METADATA.kadima.description}
            </p>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>82 סעיפי FI מוגדרים ומבוקרים</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>יומן הוצאות וקליטת חשבוניות ייעודי למטה</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>דוחות מנהלים ותחזית Burn-Rate לקדימה</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
            <span>כניסה לתקציב מתחם קדימה</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>

        {/* Option 2: Marlog Site */}
        <div
          onClick={() => onSelectSite('marlog')}
          className="group bg-white/95 hover:bg-white rounded-3xl p-8 border border-white/20 hover:border-emerald-400 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-emerald-600 to-teal-600" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Boxes className="w-7 h-7" />
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                {SITES_METADATA.marlog.tag}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
              {SITES_METADATA.marlog.name}
            </h2>
            <p className="text-xs font-bold text-slate-500 mb-3">
              {SITES_METADATA.marlog.subtitle}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {SITES_METADATA.marlog.description}
            </p>

            <div className="space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>סעיפי תקציב נפרדים ומותאמים למרכז לוגיסטי</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>יומן חשבוניות והוצאות נפרד למרלוג</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>מעקב עצמאי והגדרת תקציבי שינוע ואחסנה</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-emerald-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
            <span>כניסה לתקציב מרלוג</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-400 z-10">
        <span>IDE Technologies Ltd. • מעבר בין המתחמים ניתן לביצוע בכל עת מראש המסך</span>
      </div>
    </div>
  );
};

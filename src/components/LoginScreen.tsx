import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      if (password.trim() === 'ide2026') {
        sessionStorage.setItem('ide_auth_token', 'true');
        onLoginSuccess();
      } else {
        setErrorMsg('סיסמת הכניסה אינה נכונה. אנא נסה שנית.');
        setIsSubmitting(false);
      }
    }, 200);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 font-['Assistant',sans-serif] relative overflow-hidden"
    >
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-200 relative z-10">
        
        {/* Top Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-16 px-4 py-2 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="IDE Technologies"
              className="h-11 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            בקרת תקציב ומשאבים ארגוניים
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            IDE Technologies — גישה מאובטחת לניהול ובקרת תקציב לפי קודי FI
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3 flex items-center gap-2.5 mb-6 text-xs text-blue-900">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold">כניסה מאובטחת</span>
            <p className="text-[11px] text-blue-700">הזן את סיסמת המערכת כדי להמשיך</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              סיסמת גישה למערכת
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="הזן סיסמה..."
                autoFocus
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-10 py-2.5 text-xs text-slate-900 font-mono tracking-wider focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !password.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98"
          >
            <span>כניסה למערכת</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>IDE Technologies Ltd. © 2026</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            שרת מאושר ומסונכרן
          </span>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Sun,
  Moon,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { PixelGoatIcon } from './PixelGoatIcon';
import { ThemeMode, UserProfile } from '../types';
import { verifyUserCredentials, setSessionAuthenticated } from '../utils/auth';

interface LoginScreenProps {
  userProfile?: UserProfile;
  onLoginSuccess: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  userProfile,
  onLoginSuccess,
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  
  // Default to stored username or 'admin'
  const defaultUser = userProfile?.username || 'admin';
  const isDefaultAdminAccount = Boolean((userProfile?.isInitialAdmin ?? true) || defaultUser === 'admin');

  // States
  const [username, setUsername] = useState(defaultUser);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim()) {
      setErrorMsg('Bitte gib deinen Benutzernamen oder deine E-Mail-Adresse ein.');
      return;
    }

    if (!password) {
      setErrorMsg('Bitte gib dein Passwort ein.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyUserCredentials(username, password, userProfile);
      if (result.valid) {
        setIsSuccess(true);
        setSessionAuthenticated(rememberMe);
        setTimeout(() => {
          onLoginSuccess();
        }, 300);
      } else {
        setErrorMsg(result.reason || 'Ungültiger Benutzername oder falsches Passwort.');
      }
    } catch (err) {
      console.error('Auth verification error', err);
      setErrorMsg('Fehler bei der Anmeldung. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin');
    setErrorMsg(null);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 transition-colors selection:bg-indigo-500 selection:text-white ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-white'
    }`}>
      
      {/* Top Bar: Theme Toggle */}
      <div className="w-full max-w-md flex justify-end pt-2">
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label="Theme wechseln"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isLight 
              ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm' 
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          {isLight ? <Moon className="w-4 h-4 text-indigo-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto">
        <div className={`rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 transition-all ${
          isLight 
            ? 'bg-white border-slate-200 shadow-slate-200/60' 
            : 'bg-slate-900/90 border-slate-800/80 shadow-black/60 backdrop-blur-xl'
        }`}>

          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-amber-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10 overflow-hidden">
                  <img 
                    src="/apple-touch-icon.png" 
                    alt="rwrfolio goat" 
                    className="w-14 h-14 object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback to PixelGoatIcon if image not loaded
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <PixelGoatIcon size={36} className="hidden" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white">
                  <Lock className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>

            <div>
              <h1 className={`font-extrabold text-2xl tracking-tight font-sans ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                rwr<span className="text-indigo-500">/folio</span>
              </h1>
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Sichere Benutzeranmeldung &amp; Portfolio-Zugang
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center space-x-2.5 text-xs text-rose-400 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username / Email Field */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Benutzername oder E-Mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white' 
                      : 'bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500/60'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Passwort
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white' 
                      : 'bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-900 cursor-pointer"
                />
                <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                  Angemeldet bleiben
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>Erfolgreich angemeldet...</span>
                </>
              ) : isSubmitting ? (
                <span>Wird überprüft...</span>
              ) : (
                <>
                  <span>Anmelden</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Standard Admin Account Helper Pill */}
          {isDefaultAdminAccount && (
            <div className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
              isLight 
                ? 'bg-amber-50 border-amber-200 text-amber-900' 
                : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Standard-Zugang aktiv</span>
                </div>
                <button
                  type="button"
                  onClick={handleFillAdminCredentials}
                  className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  Daten einfüllen
                </button>
              </div>
              <div className="text-[11px] opacity-85 font-mono">
                Benutzername: <strong className="font-bold">admin</strong> &bull; Passwort: <strong className="font-bold">admin</strong>
              </div>
              <p className="text-[10px] text-amber-400/80">
                Du kannst diesen Benutzer nach dem Login in den Einstellungen mit deinem eigenen Namen, E-Mail und Passwort anpassen.
              </p>
            </div>
          )}

          {/* Security footnote */}
          <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lokale Passworthash-Authentifizierung &bull; SQLite geschützt</span>
          </div>

        </div>
      </div>

      {/* Footer copyright / info */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-slate-500">
          rwrfolio &bull; Private Cryptocurrency Asset Tracker
        </p>
      </div>

    </div>
  );
};

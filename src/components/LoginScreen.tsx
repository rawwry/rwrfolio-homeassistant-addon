import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { PixelGoatIcon } from './PixelGoatIcon';
import { ThemeMode, UserProfile } from '../types';
import { hashPassword, verifyPassword, setSessionAuthenticated } from '../utils/auth';

interface LoginScreenProps {
  userProfile?: UserProfile;
  onLoginSuccess: () => void;
  onSetNewPassword: (newHash: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  userProfile,
  onLoginSuccess,
  onSetNewPassword,
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const hasExistingPassword = Boolean(userProfile?.hasPassword && userProfile?.passwordHash);

  // States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mode: if no password exists, allow setup or bypass
  const [isInitialSetupMode, setIsInitialSetupMode] = useState(!hasExistingPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password) {
      setErrorMsg('Bitte gib ein Passwort ein.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (hasExistingPassword && !isInitialSetupMode) {
        // Verify against existing password hash
        const isValid = await verifyPassword(password, userProfile?.passwordHash || '');
        if (isValid) {
          setIsSuccess(true);
          setSessionAuthenticated(rememberMe);
          setTimeout(() => {
            onLoginSuccess();
          }, 350);
        } else {
          setErrorMsg('Falsches Passwort. Bitte überprüfe deine Eingabe.');
        }
      } else {
        // Setting up a new Master Password
        if (password.length < 4) {
          setErrorMsg('Das Passwort sollte mindestens 4 Zeichen lang sein.');
          setIsSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Die Passwörter stimmen nicht überein.');
          setIsSubmitting(false);
          return;
        }

        const newHash = await hashPassword(password);
        onSetNewPassword(newHash);
        setIsSuccess(true);
        setSessionAuthenticated(rememberMe);
        setTimeout(() => {
          onLoginSuccess();
        }, 350);
      }
    } catch (err) {
      console.error('Auth verification error', err);
      setErrorMsg('Fehler bei der Anmeldung. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipPasswordSetup = () => {
    setSessionAuthenticated(true);
    onLoginSuccess();
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
        <div className={`rounded-2xl border shadow-xl p-6 sm:p-8 space-y-6 transition-all ${
          isLight 
            ? 'bg-white border-slate-200 shadow-slate-200/60' 
            : 'bg-slate-900 border-slate-800 shadow-black/40'
        }`}>

          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform ${
                isLight 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                  : 'bg-slate-800 border-slate-700/80 text-white'
              }`}>
                <PixelGoatIcon size={32} />
              </div>
            </div>

            <div>
              <h1 className={`font-extrabold text-2xl tracking-tight font-sans ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                rwr<span className="text-indigo-500">/folio</span>
              </h1>
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {hasExistingPassword && !isInitialSetupMode 
                  ? 'Portfolio geschützt &bull; Bitte anmelden'
                  : 'Master-Passwort zum Schutz deiner Daten festlegen'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Password input */}
            <div className="space-y-1.5">
              <label 
                htmlFor="login-password" 
                className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
              >
                {hasExistingPassword && !isInitialSetupMode ? 'Master-Passwort' : 'Neues Passwort'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasExistingPassword && !isInitialSetupMode ? '••••••••••••' : 'Mindestens 4 Zeichen'}
                  autoFocus
                  required
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm transition-colors font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                      : 'bg-slate-950 border-slate-700 text-white focus:bg-slate-950'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (if initial setup) */}
            {(!hasExistingPassword || isInitialSetupMode) && (
              <div className="space-y-1.5">
                <label 
                  htmlFor="login-confirm-password" 
                  className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                >
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Passwort wiederholen"
                    required
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm transition-colors font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white' 
                        : 'bg-slate-950 border-slate-700 text-white focus:bg-slate-950'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Angemeldet bleiben
                </span>
              </label>

              {hasExistingPassword && (
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Lokal verschlüsselt</span>
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Entsperrt...</span>
                </>
              ) : isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Überprüfe...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>
                    {hasExistingPassword && !isInitialSetupMode ? 'Portfolio entsperren' : 'Passwort speichern & starten'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Initial Setup Skip Option */}
            {(!hasExistingPassword || isInitialSetupMode) && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSkipPasswordSetup}
                  className={`text-xs hover:underline cursor-pointer ${
                    isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ohne Passwort fortfahren (kann später in den Einstellungen aktiviert werden)
                </button>
              </div>
            )}
          </form>

          {/* Security Note Footer */}
          <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
          }`}>
            <div className="flex items-center space-x-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Privatsphäre &amp; Datensicherheit</span>
            </div>
            <p>
              Deine Daten, CSV-Importe und Kurse verbleiben ausschließlich lokal bzw. in deiner privaten SQLite-Datenbank.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="w-full max-w-md text-center py-2">
        <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          rwr/folio &bull; Private Self-Hosted Crypto Suite
        </p>
      </div>

    </div>
  );
};

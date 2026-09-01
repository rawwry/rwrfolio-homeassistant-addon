import React, { useState } from 'react';
import { 
  X, 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Sun, 
  Moon, 
  Shield, 
  Lock, 
  Check, 
  Save, 
  Bell, 
  Eye, 
  EyeOff, 
  Database, 
  Server,
  Send,
  AlertTriangle,
  FolderLock
} from 'lucide-react';
import { AppSettings, ThemeMode } from '../types';
import { sendTestEmailApi } from '../utils/apiClient';
import { hashPassword } from '../utils/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'email' | 'privacy'>('profile');
  
  // Form states
  const [username, setUsername] = useState(settings.user?.username || '');
  const [email, setEmail] = useState(settings.user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || 'dark');
  const [privacyMode, setPrivacyMode] = useState(settings.privacyMode || false);

  // Email notifications
  const [emailEnabled, setEmailEnabled] = useState(settings.email?.enabled ?? false);
  const [smtpHost, setSmtpHost] = useState(settings.email?.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(settings.email?.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(settings.email?.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(settings.email?.smtpPass || '');
  const [senderEmail, setSenderEmail] = useState(settings.email?.senderEmail || '');
  const [recipientEmail, setRecipientEmail] = useState(settings.email?.recipientEmail || settings.user?.email || '');
  const [dailyDigest, setDailyDigest] = useState(settings.email?.dailyDigest ?? false);
  const [priceAlertThresholdPct, setPriceAlertThresholdPct] = useState(settings.email?.priceAlertThresholdPct || 10);
  const [alertOnLargeDip, setAlertOnLargeDip] = useState(settings.email?.alertOnLargeDip ?? true);

  // Testing feedback
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      alert('Die Passwörter stimmen nicht überein.');
      return;
    }

    let finalPasswordHash = settings.user?.passwordHash;
    let hasPassword = settings.user?.hasPassword ?? false;

    if (password) {
      finalPasswordHash = await hashPassword(password);
      hasPassword = true;
    }

    const updatedSettings: AppSettings = {
      theme,
      privacyMode,
      user: {
        username: username.trim() || 'Krypto-Investor',
        email: email.trim(),
        hasPassword,
        passwordHash: finalPasswordHash,
        updatedAt: new Date().toISOString(),
      },
      email: {
        enabled: emailEnabled,
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort) || 587,
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass,
        senderEmail: senderEmail.trim(),
        recipientEmail: recipientEmail.trim() || email.trim(),
        dailyDigest,
        priceAlertThresholdPct: Number(priceAlertThresholdPct) || 10,
        alertOnLargeDip,
        alertOnTargetReached: true,
      },
    };

    onSaveSettings(updatedSettings);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  const handleRemovePassword = () => {
    if (window.confirm('Möchtest du den Passwortschutz wirklich deaktivieren? Die App wird beim Starten nicht mehr nach einem Passwort fragen.')) {
      const updatedSettings: AppSettings = {
        ...settings,
        user: {
          ...settings.user,
          hasPassword: false,
          passwordHash: '',
          updatedAt: new Date().toISOString(),
        }
      };
      onSaveSettings(updatedSettings);
      setPassword('');
      setConfirmPassword('');
      alert('Passwortschutz wurde deaktiviert.');
    }
  };

  const handleSendTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailStatusMsg(null);
    try {
      const res = await sendTestEmailApi({
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        senderEmail,
        recipientEmail: recipientEmail || email,
      });
      if (res.success) {
        setEmailStatusMsg({ type: 'success', text: res.message || 'Test-E-Mail erfolgreich versendet!' });
      } else {
        setEmailStatusMsg({ type: 'error', text: res.message || 'Fehler beim Senden der E-Mail.' });
      }
    } catch (err: any) {
      setEmailStatusMsg({ type: 'error', text: err.message || 'Netzwerkfehler' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl ${theme === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-slate-900 text-white border-slate-800'} border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/90'} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Einstellungen &amp; Benutzerprofil</h2>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Lokale Konfiguration &amp; Benachrichtigungen auf deinem Raspberry Pi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme === 'light' ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Layout: Sidebar Tabs & Form Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Tabs Navigation */}
          <div className={`w-full md:w-56 p-4 border-b md:border-b-0 md:border-r ${theme === 'light' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-950/40'} flex md:flex-col gap-1.5 overflow-x-auto`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : theme === 'light' ? 'text-slate-600 hover:bg-slate-200/60' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Benutzer &amp; Login</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left whitespace-nowrap ${
                activeTab === 'appearance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : theme === 'light' ? 'text-slate-600 hover:bg-slate-200/60' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Erscheinungsbild</span>
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left whitespace-nowrap ${
                activeTab === 'email'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : theme === 'light' ? 'text-slate-600 hover:bg-slate-200/60' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>E-Mail &amp; Alarme</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer w-full text-left whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : theme === 'light' ? 'text-slate-600 hover:bg-slate-200/60' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              <span>Privatsphäre &amp; GitHub</span>
            </button>
          </div>

          {/* Tab Content Form */}
          <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* TAB 1: USER PROFILE & LOCAL AUTH */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    Benutzerprofil
                  </h3>
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Wird sicher in deiner lokalen SQLite-Datenbank auf dem Raspberry Pi gespeichert.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      Benutzername
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="z. B. Timo oder Investor1"
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        theme === 'light'
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      E-Mail-Adresse
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="deine.email@beispiel.de"
                      className={`w-full px-3.5 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        theme === 'light'
                          ? 'bg-white border-slate-300 text-slate-900'
                          : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>

                  <div className={`pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'} space-y-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Passwortschutz (Optional)</span>
                        </div>
                        <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                          Schützt die Benutzeroberfläche vor unbefugtem Zugriff im Heimnetzwerk.
                        </p>
                      </div>
                      {settings.user?.hasPassword && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Aktiv
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                          Neues Passwort
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full px-3 py-2 pr-9 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              theme === 'light'
                                ? 'bg-white border-slate-300 text-slate-900'
                                : 'bg-slate-950 border-slate-800 text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                          Passwort wiederholen
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            theme === 'light'
                              ? 'bg-white border-slate-300 text-slate-900'
                              : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Remove password option if currently enabled */}
                    {settings.user?.hasPassword && (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={handleRemovePassword}
                          className="text-xs text-rose-500 hover:text-rose-400 font-medium hover:underline cursor-pointer"
                        >
                          Passwortschutz entfernen
                        </button>

                        {onLogout && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onLogout();
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            Jetzt abmelden
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: APPEARANCE (DARK / LIGHT / SYSTEM) */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    Erscheinungsbild &amp; Farbschema
                  </h3>
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Wähle dein bevorzugtes Farbschema für den Tracker.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dark Mode Option */}
                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      theme === 'dark'
                        ? 'border-indigo-500 bg-slate-950 shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
                          <Moon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-white">Dunkel (Dark Mode)</span>
                      </div>
                      {theme === 'dark' && <Check className="w-4 h-4 text-indigo-400 font-bold" />}
                    </div>
                    <div className="h-12 rounded-lg bg-slate-900 border border-slate-800 p-2 flex items-center space-x-2">
                      <div className="w-5 h-5 rounded bg-indigo-500/20 border border-indigo-500/30" />
                      <div className="h-2 w-20 bg-slate-700 rounded" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Augenschonendes OLED/Dark Layout (Standard)</p>
                  </div>

                  {/* Light Mode Option */}
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      theme === 'light'
                        ? 'border-indigo-500 bg-white shadow-md ring-1 ring-indigo-500'
                        : 'border-slate-300 bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                          <Sun className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">Hell (Light Mode)</span>
                      </div>
                      {theme === 'light' && <Check className="w-4 h-4 text-indigo-600 font-bold" />}
                    </div>
                    <div className="h-12 rounded-lg bg-slate-50 border border-slate-200 p-2 flex items-center space-x-2">
                      <div className="w-5 h-5 rounded bg-indigo-100 border border-indigo-300" />
                      <div className="h-2 w-20 bg-slate-300 rounded" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Klares, kontrastreiches helles Farbschema</p>
                  </div>
                </div>

                {/* Privacy balance toggle */}
                <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} flex items-center justify-between`}>
                  <div>
                    <div className="text-xs font-bold">Diskretions-Modus (Guthaben ausblenden)</div>
                    <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Ersetzt Summen auf dem Dashboard mit &bull;&bull;&bull;&bull; für mehr Privatsphäre bei Bildschirmfreigaben.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyMode}
                    onChange={(e) => setPrivacyMode(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: EMAIL NOTIFICATIONS & ALERTS */}
            {activeTab === 'email' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    E-Mail &amp; Preis-Alarme
                  </h3>
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Erhalte Benachrichtigungen bei starken Kursschwankungen oder tägliche Portfolio-Zusammenfassungen.
                  </p>
                </div>

                {/* Enabled Switch */}
                <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} flex items-center justify-between`}>
                  <div>
                    <span className="text-xs font-bold">E-Mail-Benachrichtigungen aktivieren</span>
                    <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      Sendet Preisalarme und Benachrichtigungen direkt über deinen konfigurierten SMTP-Server.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                </div>

                {emailEnabled && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                          SMTP-Server (Host)
                        </label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com oder mail.gmx.net"
                          className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                          Port
                        </label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          placeholder="587 oder 465"
                          className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                          SMTP Benutzer
                        </label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="dein.account@gmail.com"
                          className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                          SMTP Passwort / App-Passwort
                        </label>
                        <input
                          type="password"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="••••••••••••"
                          className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[11px] font-medium mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                        Ziel-E-Mail (Empfänger für Alarme)
                      </label>
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="empfaenger@beispiel.de"
                        className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                        }`}
                      />
                    </div>

                    {/* Alert Triggers */}
                    <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'} space-y-3`}>
                      <span className="text-xs font-bold block">Alarm-Auslöser</span>
                      <div className="flex items-center justify-between text-xs">
                        <span>Schwankungsschwelle für Preisalarme</span>
                        <div className="flex items-center space-x-1 font-mono">
                          <input
                            type="number"
                            value={priceAlertThresholdPct}
                            onChange={(e) => setPriceAlertThresholdPct(Number(e.target.value))}
                            className={`w-16 px-2 py-1 rounded text-center border ${
                              theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                            }`}
                          />
                          <span>%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span>Täglicher Portfolio-Zusammenfassungsbericht</span>
                        <input
                          type="checkbox"
                          checked={dailyDigest}
                          onChange={(e) => setDailyDigest(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Test Email Button */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={isTestingEmail || !recipientEmail}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                          isTestingEmail || !recipientEmail
                            ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isTestingEmail ? 'Sendet Test-E-Mail...' : 'Test-Alarm senden'}</span>
                      </button>

                      {emailStatusMsg && (
                        <span className={`text-xs font-medium ${emailStatusMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {emailStatusMsg.text}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PRIVACY & GITHUB SAFETY AUDIT */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    GitHub &amp; Datenschutz-Garantie
                  </h3>
                  <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Warum dein öffentliches GitHub-Repository 100% sicher ist.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' : 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'} space-y-3 text-xs`}>
                  <div className="flex items-center space-x-2 font-bold text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Keine privaten Bestände oder Passwörter im Code</span>
                  </div>
                  <ul className="space-y-2 pl-6 list-disc text-slate-300">
                    <li>
                      <strong>Datenbank:</strong> Liegt ausschließlich auf deinem Raspberry Pi unter <code>/share/rwrfolio/db/rwrfolio.db</code> und ist per <code>.gitignore</code> blockiert.
                    </li>
                    <li>
                      <strong>Importierte CSVs:</strong> Werden nur lokal in <code>/share/rwrfolio/imported/</code> gesichert.
                    </li>
                    <li>
                      <strong>Passwörter &amp; E-Mail-Zugangsdaten:</strong> Werden verschlüsselt in deiner privaten SQLite-Tabelle auf der Hardware gespeichert.
                    </li>
                    <li>
                      <strong>GitHub-Inhalt:</strong> Enthält nur den reinen Open-Source Programmcode (React, Tailwind, Dockerfile, Add-on Manifest) ohne jegliche persönliche Finanzdaten.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Form Actions (Save Button) */}
            <div className={`pt-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} flex items-center justify-between`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Abbrechen
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Gespeichert!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Einstellungen speichern</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

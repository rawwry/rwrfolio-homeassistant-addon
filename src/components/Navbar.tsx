import React from 'react';
import { 
  RefreshCw, 
  Download, 
  RotateCcw, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  User, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { PortfolioTotals, ThemeMode, UserProfile, PortfolioCurrency } from '../types';
import { PixelGoatIcon } from './PixelGoatIcon';

interface NavbarProps {
  totals: PortfolioTotals;
  onRefreshPrices: () => void;
  isRefreshingPrices: boolean;
  onExportData: () => void;
  onResetData: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  lastUpdatedText?: string | null;
  dbConnected?: boolean;
  activeTab: 'dashboard' | 'transactions' | 'assets' | 'analytics' | 'taxes';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'assets' | 'analytics' | 'taxes') => void;
  theme: ThemeMode;
  userProfile?: UserProfile;
  currency?: PortfolioCurrency;
  onToggleCurrency?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totals,
  onRefreshPrices,
  isRefreshingPrices,
  onExportData,
  onResetData,
  onOpenSettings,
  onLogout,
  lastUpdatedText,
  dbConnected = true,
  activeTab,
  setActiveTab,
  theme,
  userProfile,
  currency = 'EUR',
  onToggleCurrency
}) => {
  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm' 
        : 'bg-slate-900/95 border-slate-800/80 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-13 sm:h-14 gap-4">
          
          {/* Logo & Brand: rwr/folio with Pixel Goat Icon */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group select-none"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner transition-colors ${
              isLight ? 'bg-slate-100 border border-slate-300' : 'bg-slate-800 border border-slate-700/80 group-hover:border-indigo-500/50'
            }`}>
              <PixelGoatIcon size={20} className="transform group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className={`font-extrabold text-base sm:text-lg tracking-tight font-sans ${isLight ? 'text-slate-900' : 'text-white'}`}>
                rwr<span className="text-indigo-500">/folio</span>
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className={`hidden md:flex items-center space-x-1 p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/60 border-slate-800/60'
          }`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'transactions'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Transaktionen</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'transactions' 
                  ? 'bg-indigo-800 text-indigo-200' 
                  : isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-slate-800 text-slate-400'
              }`}>
                {totals.transactionCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'assets'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Assets</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'assets' 
                  ? 'bg-indigo-800 text-indigo-200' 
                  : isLight ? 'bg-slate-200 text-slate-700 font-semibold' : 'bg-slate-800 text-slate-400'
              }`}>
                {totals.assetCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Analysen
            </button>
            <button
              onClick={() => setActiveTab('taxes')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1 ${
                activeTab === 'taxes'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Steuern (FIFO)</span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">

            {/* Currency Quick Switcher (EUR / USD) */}
            {onToggleCurrency && (
              <button
                onClick={onToggleCurrency}
                title={`Währung umschalten: Aktuell ${currency === 'USD' ? 'US-Dollar ($)' : 'Euro (€)'}`}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25'
                }`}
              >
                <span>{currency === 'USD' ? '$ USD' : '€ EUR'}</span>
              </button>
            )}

            {/* Quick Live Price Refresh */}
            <button
              onClick={onRefreshPrices}
              disabled={isRefreshingPrices}
              title="Live-Marktpreise jetzt aktualisieren"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-50 cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60 hover:text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isRefreshingPrices ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">
                {isRefreshingPrices ? 'Lade Kurse...' : 'Live-Kurse'}
              </span>
            </button>

            {/* Settings & Profile Trigger */}
            <button
              onClick={onOpenSettings}
              title="Einstellungen &amp; Benutzerprofil öffnen"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  : 'bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800/60 hover:text-white'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">
                {userProfile?.username || 'Einstellungen'}
              </span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="App sperren / Abmelden"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-200 hover:border-rose-200'
                  : 'bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border-slate-700/60 hover:border-rose-800/60'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Abmelden</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className={`flex md:hidden items-center justify-around py-1.5 border-t text-xs ${
          isLight ? 'border-slate-200' : 'border-slate-800/60'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'dashboard' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'transactions' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Transaktionen
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'assets' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'analytics' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Analysen
          </button>
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              activeTab === 'taxes' ? 'text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/40' : 'text-slate-500'
            }`}
          >
            Steuern
          </button>
          <button
            onClick={onLogout}
            title="Abmelden"
            className="px-2 py-1 rounded-lg font-medium text-rose-500 hover:bg-rose-500/10 flex items-center"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};

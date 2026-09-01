import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Transaction, AppSettings, ThemeMode } from './types';
import { parseCryptoComCSV, parseCSVLines, USER_SAMPLE_CRYPTO_COM_CSV, exportTransactionsToCSV } from './utils/csvParser';
import { calculateAssetSummaries } from './utils/portfolioCalculations';
import { fetchLivePrices, getStoredCustomPrices, getCoinDetails, getLastPriceUpdateTime } from './utils/priceService';
import { 
  fetchTransactionsFromApi, 
  saveTransactionToApi, 
  bulkImportTransactionsToApi, 
  deleteTransactionFromApi, 
  bulkDeleteTransactionsFromApi, 
  resetDatabaseToSampleOnApi, 
  fetchPricesFromApi, 
  savePricesToApi,
  fetchSettingsFromApi,
  saveSettingsToApi
} from './utils/apiClient';
import { Navbar } from './components/Navbar';
import { PortfolioStats } from './components/PortfolioStats';
import { AssetList } from './components/AssetList';
import { TransactionTable } from './components/TransactionTable';
import { PortfolioCharts } from './components/PortfolioCharts';
import { CSVImportModal } from './components/CSVImportModal';
import { AddTransactionModal } from './components/AddTransactionModal';
import { PriceEditModal } from './components/PriceEditModal';
import { ChangelogModal } from './components/ChangelogModal';
import { SettingsModal } from './components/SettingsModal';
import { AnalyticsView } from './components/AnalyticsView';
import { TaxView } from './components/TaxView';
import { APP_VERSION } from './changelog';
import { PixelGoatIcon } from './components/PixelGoatIcon';
import { 
  Download, 
  RotateCcw, 
  Plus, 
  Upload, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  Database,
  History,
  Settings as SettingsIcon,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

const STORAGE_KEY = 'rwrfolio_transactions_v2';
const SETTINGS_STORAGE_KEY = 'rwrfolio_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  privacyMode: false,
  user: {
    username: 'Investor',
    email: '',
    hasPassword: false,
  },
  email: {
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    senderEmail: '',
    recipientEmail: '',
    dailyDigest: false,
    priceAlertThresholdPct: 10,
    alertOnLargeDip: true,
    alertOnTargetReached: true,
  }
};

export default function App() {
  // App Settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error reading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Load initial transactions from localStorage or default to clean empty array []
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return [];
  });

  const [customPrices, setCustomPrices] = useState<Record<string, number>>(() => getStoredCustomPrices());
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(() => getLastPriceUpdateTime());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'assets' | 'analytics' | 'taxes'>('dashboard');
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [priceEditTarget, setPriceEditTarget] = useState<{ symbol: string; price: number } | null>(null);
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('ALL');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Synchronize with backend SQLite database and settings on mount
  useEffect(() => {
    async function syncWithSQLite() {
      try {
        // Fetch transactions from SQLite database
        const serverTxs = await fetchTransactionsFromApi();
        if (serverTxs && Array.isArray(serverTxs)) {
          setTransactions(serverTxs);
          setDbConnected(true);
        } else {
          setDbConnected(false);
        }

        // Fetch stored prices from SQLite
        const serverPrices = await fetchPricesFromApi();
        if (serverPrices && Object.keys(serverPrices).length > 0) {
          setCustomPrices(prev => ({ ...prev, ...serverPrices }));
        }

        // Fetch settings from SQLite
        const serverSettings = await fetchSettingsFromApi();
        if (serverSettings) {
          setSettings(prev => ({ ...prev, ...serverSettings }));
        }
      } catch (err) {
        console.warn('SQLite Sync warning:', err);
        setDbConnected(false);
      }
    }
    syncWithSQLite();
  }, []);

  // Save to localStorage as secondary backup whenever transactions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }, [transactions]);

  // Save settings handler
  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to write settings to localStorage', e);
    }
    await saveSettingsToApi(newSettings);
    showToast('Einstellungen erfolgreich in SQLite auf Raspberry Pi gespeichert', 'success');
  };

  // Calculate portfolio totals and summaries
  const { assets, totals } = useMemo(() => {
    return calculateAssetSummaries(transactions, customPrices);
  }, [transactions, customPrices]);

  // Fetch live prices callback
  const handleRefreshPrices = useCallback(async (isSilent = false) => {
    if (isRefreshingPrices) return;
    setIsRefreshingPrices(true);
    
    // Gather all symbols from assets & transactions
    const symbolSet = new Set<string>();
    assets.forEach(a => symbolSet.add(a.symbol));
    transactions.forEach(t => {
      if (t.receivedCurrency && t.receivedCurrency !== 'EUR') symbolSet.add(t.receivedCurrency);
      if (t.spentCurrency && t.spentCurrency !== 'EUR') symbolSet.add(t.spentCurrency);
    });
    
    const symbols = Array.from(symbolSet);
    if (symbols.length > 0) {
      const updated = await fetchLivePrices(symbols);
      if (Object.keys(updated).length > 0) {
        setCustomPrices(prev => ({ ...prev, ...updated }));
        setLastUpdatedTime(new Date().toISOString());
        // Also persist prices in SQLite
        savePricesToApi(updated);
        if (!isSilent) {
          showToast('Aktuelle Live-Kurse geladen & in SQLite gespeichert!', 'success');
        }
      } else if (!isSilent) {
        showToast('Online-Kurse nicht erreichbar. Gespeicherte Kurse aktiv.', 'info');
      }
    }
    setIsRefreshingPrices(false);
  }, [assets, transactions, isRefreshingPrices]);

  // Automatic live price fetch on application mount
  useEffect(() => {
    handleRefreshPrices(true);
  }, []);

  // Periodic price refresh every 90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshPrices(true);
    }, 90000);
    return () => clearInterval(interval);
  }, [handleRefreshPrices]);

  // Handlers for transactions
  const handleSaveTransaction = async (tx: Transaction) => {
    setTransactions(prev => {
      const existsIndex = prev.findIndex(t => t.id === tx.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = tx;
        return copy;
      }
      return [tx, ...prev];
    });

    const saved = await saveTransactionToApi(tx);
    if (saved) setDbConnected(true);

    showToast(editingTransaction ? 'Transaktion in SQLite aktualisiert' : 'Neue Transaktion in SQLite gespeichert', 'success');
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await deleteTransactionFromApi(id);
    showToast('Transaktion aus SQLite gelöscht', 'info');
  };

  const handleBulkDelete = async (ids: string[]) => {
    const idSet = new Set(ids);
    setTransactions(prev => prev.filter(t => !idSet.has(t.id)));
    await bulkDeleteTransactionsFromApi(ids);
    showToast(`${ids.length} Transaktionen gelöscht`, 'info');
  };

  const handleImportTransactions = async (newTxs: Transaction[], csvRawText?: string, fileName?: string) => {
    const existingIds = new Set(transactions.map(t => t.id));
    const filtered = newTxs.filter(t => !existingIds.has(t.id));
    
    setTransactions(prev => [...filtered, ...prev]);
    
    const importRes = await bulkImportTransactionsToApi(filtered, csvRawText, fileName);
    setDbConnected(true);

    if (importRes.archivedPath) {
      showToast(`${filtered.length} Transaktionen importiert & CSV in Samba /share archiviert`, 'success');
    } else {
      showToast(`${filtered.length} Transaktionen dauerhaft in SQLite gespeichert`, 'success');
    }
  };

  const handleExportCSV = () => {
    const csvData = exportTransactionsToCSV(transactions);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rwrfolio_export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV-Export erfolgreich heruntergeladen', 'success');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rwrfolio_backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('JSON-Backup erfolgreich heruntergeladen', 'success');
  };

  const handleResetData = async () => {
    if (confirm('Möchtest du wirklich alle Transaktionen auf die Standard-Beispieldaten zurücksetzen?')) {
      const resetResult = await resetDatabaseToSampleOnApi();
      if (resetResult && resetResult.length > 0) {
        setTransactions(resetResult);
      } else {
        const sampleRows = parseCSVLines(USER_SAMPLE_CRYPTO_COM_CSV);
        const defaults = parseCryptoComCSV(sampleRows);
        setTransactions(defaults);
      }
      showToast('SQLite-Datenbank auf Beispieldaten zurückgesetzt', 'info');
    }
  };

  const handleSelectAssetForFilter = (symbol: string) => {
    setSelectedAssetFilter(symbol);
    setActiveTab('transactions');
  };

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdatedTime) return null;
    try {
      const date = new Date(lastUpdatedTime);
      return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  }, [lastUpdatedTime]);

  const isLight = settings.theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-medium border ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        totals={totals}
        onRefreshPrices={() => handleRefreshPrices(false)}
        isRefreshingPrices={isRefreshingPrices}
        onExportData={handleExportCSV}
        onResetData={handleResetData}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lastUpdatedText={formattedLastUpdated}
        dbConnected={dbConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={settings.theme}
        userProfile={settings.user}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Top KPIs Summary Cards */}
        <PortfolioStats totals={totals} assets={assets} />

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Primary Action Toolbar on Dashboard */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border shadow-lg transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700/80 text-slate-300'
                }`}>
                  <PixelGoatIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {settings.user?.username ? `Willkommen, ${settings.user.username}` : 'Portfolio Aktionen'}
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Live-Kurse aktiv</span>
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Kurs-Update: {formattedLastUpdated || 'gerade eben'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shadow-sm cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CSV / Excel Import</span>
                </button>

                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kauf erfassen</span>
                </button>
              </div>
            </div>

            {/* Visual Charts */}
            <PortfolioCharts assets={assets} transactions={transactions} />

            {/* Asset DCA & Holdings Table with Profit/Loss calculation */}
            <AssetList
              assets={assets}
              onSelectAssetForFilter={handleSelectAssetForFilter}
              onEditPrice={(symbol, currentPrice) => setPriceEditTarget({ symbol, price: currentPrice })}
            />

            {/* Recent Transactions Snippet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>Letzte Transaktionen</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-400'}`}>
                    {transactions.length}
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  Alle {transactions.length} Transaktionen ansehen &rarr;
                </button>
              </div>

              <TransactionTable
                transactions={transactions}
                onEditTransaction={(tx) => {
                  setEditingTransaction(tx);
                  setIsAddModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onBulkDelete={handleBulkDelete}
                selectedAssetFilter={selectedAssetFilter}
                onClearAssetFilter={() => setSelectedAssetFilter('ALL')}
              />
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
            }`}>
              <div>
                <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Transaktionsverwaltung</h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Verwalte deine Crypto.com Käufe, manuellen Einträge oder Börsen-Exporte in der SQLite-Datenbank
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CSV Import</span>
                </button>
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Transaktion erfassen</span>
                </button>
              </div>
            </div>

            <TransactionTable
              transactions={transactions}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onBulkDelete={handleBulkDelete}
              selectedAssetFilter={selectedAssetFilter}
              onClearAssetFilter={() => setSelectedAssetFilter('ALL')}
            />
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <AssetList
              assets={assets}
              onSelectAssetForFilter={handleSelectAssetForFilter}
              onEditPrice={(symbol, currentPrice) => setPriceEditTarget({ symbol, price: currentPrice })}
            />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            assets={assets}
            transactions={transactions}
            theme={settings.theme}
          />
        )}

        {/* Taxes & FIFO Tab */}
        {activeTab === 'taxes' && (
          <TaxView
            transactions={transactions}
            customPrices={customPrices}
            theme={settings.theme}
          />
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t py-5 mt-12 text-xs ${
        isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-800/80 bg-slate-950 text-slate-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2">
              <PixelGoatIcon size={18} />
              <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>rwr/folio</span>
            </div>
            <span className="text-slate-400">&bull;</span>
            <button
              onClick={() => setIsChangelogOpen(true)}
              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border font-mono text-[11px] transition-all cursor-pointer group ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
              title="Versionsverlauf & Changelog öffnen"
            >
              <History className="w-3 h-3 text-indigo-500 group-hover:rotate-45 transition-transform" />
              <span>v{APP_VERSION}</span>
              <span className="text-[10px] text-indigo-500 font-sans ml-0.5 underline decoration-indigo-500/50">Changelog</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-indigo-500 flex items-center space-x-1 transition-colors cursor-pointer"
              title="Einstellungen öffnen"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Einstellungen</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="hover:text-emerald-500 flex items-center space-x-1 transition-colors cursor-pointer"
              title="CSV-Export herunterladen"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>CSV Export</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="hover:text-indigo-500 flex items-center space-x-1 transition-colors cursor-pointer"
              title="JSON-Backup herunterladen"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
              <span>JSON Backup</span>
            </button>
            <button
              onClick={handleResetData}
              className="hover:text-rose-500 flex items-center space-x-1 transition-colors cursor-pointer"
              title="Daten zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Zurücksetzen</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
      
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportTransactions={handleImportTransactions}
        existingTransactions={transactions}
      />

      {priceEditTarget && (
        <PriceEditModal
          isOpen={true}
          symbol={priceEditTarget.symbol}
          currentPrice={priceEditTarget.price}
          onClose={() => setPriceEditTarget(null)}
          onPriceUpdated={async (symbol, newPrice) => {
            setCustomPrices(prev => ({ ...prev, [symbol.toUpperCase()]: newPrice }));
            await savePricesToApi({ [symbol.toUpperCase()]: newPrice });
            showToast(`Preis für ${symbol} auf ${newPrice} € gesetzt & in SQLite gespeichert`, 'success');
          }}
        />
      )}

    </div>
  );
}

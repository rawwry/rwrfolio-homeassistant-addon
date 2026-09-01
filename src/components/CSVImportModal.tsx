import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  HelpCircle, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';
import { Transaction, CSVParseResult, ExchangeSource } from '../types';
import { parseCSVFile, USER_SAMPLE_CRYPTO_COM_CSV, parseGenericCSV, parseCSVLines } from '../utils/csvParser';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (transactions: Transaction[], csvRawText?: string, fileName?: string) => void;
  existingTransactions: Transaction[];
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportTransactions,
  existingTransactions,
}) => {
  const [activeTab, setActiveTab] = useState<'crypto_com' | 'generic'>('crypto_com');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generic mapping state
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [customSource, setCustomSource] = useState<string>('binance');
  const [colTime, setColTime] = useState<number>(0);
  const [colCoin, setColCoin] = useState<number>(1);
  const [colAmount, setColAmount] = useState<number>(2);
  const [colSpent, setColSpent] = useState<number>(3);

  if (!isOpen) return null;

  const handleProcessText = (text: string, name: string = 'crypto_com_export.csv') => {
    setCsvRawText(text);
    setFileName(name);
    
    // Parse
    const result = parseCSVFile(text);
    
    // Check duplicates against existing transactions
    const existingIds = new Set(existingTransactions.map(t => t.id));
    let dupCount = 0;
    const cleanList = result.transactions.map(t => {
      if (existingIds.has(t.id)) {
        dupCount++;
      }
      return t;
    });

    setParseResult({
      ...result,
      skippedDuplicates: dupCount,
    });

    const parsedLines = parseCSVLines(text);
    setRawRows(parsedLines);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleData = () => {
    handleProcessText(USER_SAMPLE_CRYPTO_COM_CSV, 'crypto_com_beispiel_export.csv');
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.transactions.length === 0) return;

    onImportTransactions(parseResult.transactions, csvRawText, fileName);
    onClose();
  };

  const handleApplyGenericMapping = () => {
    if (rawRows.length < 2) return;
    const txs = parseGenericCSV(rawRows, {
      timestampCol: colTime,
      coinCol: colCoin,
      amountCol: colAmount,
      spentAmountCol: colSpent,
      exchangeSource: customSource,
    });

    setParseResult({
      success: txs.length > 0,
      transactions: txs,
      totalRows: rawRows.length - 1,
      importedCount: txs.length,
      skippedDuplicates: 0,
      detectedExchange: customSource as ExchangeSource,
      errors: txs.length === 0 ? ['Konnte keine Transaktionen mit diesen Spaltenzuordnungen generieren.'] : [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">CSV-Datei importieren</h3>
              <p className="text-xs text-slate-400">
                Lade deinen Export von Crypto.com oder anderen Krypto-Börsen hoch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('crypto_com')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'crypto_com'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Crypto.com App Export (Automatisch)
          </button>
          <button
            onClick={() => setActiveTab('generic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'generic'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Andere Börsen / Spaltenzuordnung
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* Tab 1: Crypto.com Flow */}
          {activeTab === 'crypto_com' && (
            <div className="space-y-4">
              
              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="font-semibold text-white text-sm mb-1">
                  {fileName ? (
                    <span className="text-emerald-400">{fileName}</span>
                  ) : (
                    'CSV-Datei hier ablegen oder klicken zum Auswählen'
                  )}
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Unterstützt die Export-Dateien aus der <strong>Crypto.com App</strong> (Transaktionsverlauf &gt; Exportieren als CSV)
                </p>
                <div className="mt-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                  <span>Wird automatisch in Samba <strong>/share/rwrfolio/imported/</strong> archiviert</span>
                </div>
              </div>

              {/* Sample Data Quick Button */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    Möchtest du die bereitgestellte <strong>Crypto.com Beispieldatei</strong> (HBAR, AKT, DOT, BTC Käufe) testen?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleData}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold flex-shrink-0 transition-colors"
                >
                  Beispieldaten laden
                </button>
              </div>

            </div>
          )}

          {/* Tab 2: Generic / Custom Mapper */}
          {activeTab === 'generic' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <div className="font-semibold text-white text-sm">
                  Benutzerdefinierte Spaltenzuordnung für beliebige Börsen
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Börse / Quelle:</label>
                    <select
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="binance">Binance</option>
                      <option value="kraken">Kraken</option>
                      <option value="bitpanda">Bitpanda</option>
                      <option value="coinbase">Coinbase</option>
                      <option value="other">Andere Börse</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">CSV hochladen:</label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="w-full text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                    />
                  </div>
                </div>

                {rawRows.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="text-slate-300 font-medium">Spalten den Feldern zuordnen (Erste Zeile = Header):</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-slate-400 block mb-0.5">Zeitstempel:</label>
                        <select
                          value={colTime}
                          onChange={(e) => setColTime(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        >
                          {rawRows[0]?.map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">Coin / Ticker:</label>
                        <select
                          value={colCoin}
                          onChange={(e) => setColCoin(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        >
                          {rawRows[0]?.map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">Menge erhalten:</label>
                        <select
                          value={colAmount}
                          onChange={(e) => setColAmount(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        >
                          {rawRows[0]?.map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-0.5">Betrag (EUR):</label>
                        <select
                          value={colSpent}
                          onChange={(e) => setColSpent(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                        >
                          {rawRows[0]?.map((h, i) => (
                            <option key={i} value={i}>Spalte {i + 1}: {h}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyGenericMapping}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                    >
                      Zuordnung anwenden
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parse Result Preview */}
          {parseResult && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">
                    {parseResult.transactions.length} Transaktionen erkannt
                  </span>
                  {parseResult.skippedDuplicates > 0 && (
                    <span className="text-amber-400">
                      ({parseResult.skippedDuplicates} bereits im System)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Quelle: {parseResult.detectedExchange.toUpperCase()}
                </span>
              </div>

              {/* Preview List Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2">Datum</th>
                      <th className="p-2">Typ</th>
                      <th className="p-2">Erhalten</th>
                      <th className="p-2 text-right">Bezahlt</th>
                      <th className="p-2 text-right">Kurs Ø</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {parseResult.transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-2 text-slate-300">{tx.timestamp.substring(0, 16).replace('T', ' ')}</td>
                        <td className="p-2 text-emerald-400">{tx.type}</td>
                        <td className="p-2 font-bold text-white">{tx.receivedAmount} {tx.receivedCurrency}</td>
                        <td className="p-2 text-right text-slate-200">{tx.spentAmount} {tx.spentCurrency}</td>
                        <td className="p-2 text-right text-indigo-300">
                          {tx.pricePerUnitEUR ? `${tx.pricePerUnitEUR.toFixed(4)} €` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Abbrechen
          </button>
          
          <button
            type="button"
            disabled={!parseResult || parseResult.transactions.length === 0}
            onClick={handleConfirmImport}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {parseResult && parseResult.transactions.length > 0
                ? `${parseResult.transactions.length} Transaktionen importieren`
                : 'Importieren'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

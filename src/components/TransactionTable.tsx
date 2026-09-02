import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, PortfolioCurrency } from '../types';
import { 
  Search, 
  Trash2, 
  Edit, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Info 
} from 'lucide-react';
import { getCoinDetails } from '../utils/priceService';

interface TransactionTableProps {
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  selectedAssetFilter?: string;
  onClearAssetFilter?: () => void;
  currency?: PortfolioCurrency;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onBulkDelete,
  selectedAssetFilter,
  onClearAssetFilter,
  currency = 'EUR',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState(selectedAssetFilter || 'ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest_spent' | 'lowest_spent'>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const pageSize = 15;

  // Sync selectedAssetFilter prop when changed from parent
  React.useEffect(() => {
    if (selectedAssetFilter) {
      setAssetFilter(selectedAssetFilter);
    }
  }, [selectedAssetFilter]);

  // Extract unique coins for dropdown
  const uniqueCoins = useMemo(() => {
    const coins = new Set<string>();
    for (const t of transactions) {
      if (t.receivedCurrency) coins.add(t.receivedCurrency.toUpperCase());
      if (t.spentCurrency && t.spentCurrency !== 'EUR' && t.spentCurrency !== 'USD') {
        coins.add(t.spentCurrency.toUpperCase());
      }
    }
    return Array.from(coins).sort();
  }, [transactions]);

  // Filtered and sorted transactions
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCoin = t.receivedCurrency.toLowerCase().includes(q) || t.spentCurrency.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesNotes = (t.notes || '').toLowerCase().includes(q);
        const matchesKind = (t.transactionKind || '').toLowerCase().includes(q);
        const matchesHash = (t.transactionHash || '').toLowerCase().includes(q);
        if (!matchesCoin && !matchesDesc && !matchesNotes && !matchesKind && !matchesHash) {
          return false;
        }
      }

      // Asset filter
      if (assetFilter !== 'ALL') {
        const coinUpper = assetFilter.toUpperCase();
        if (t.receivedCurrency.toUpperCase() !== coinUpper && t.spentCurrency.toUpperCase() !== coinUpper) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL' && t.source !== sourceFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortOrder === 'highest_spent') {
        return b.spentAmount - a.spentAmount;
      }
      if (sortOrder === 'lowest_spent') {
        return a.spentAmount - b.spentAmount;
      }
      return 0;
    });
  }, [transactions, searchQuery, assetFilter, typeFilter, sourceFilter, sortOrder]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedTransactions = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatEUR = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'crypto_com':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
            Crypto.com
          </span>
        );
      case 'binance':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
            Binance
          </span>
        );
      case 'kraken':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/20">
            Kraken
          </span>
        );
      case 'bitpanda':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/20">
            Bitpanda
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            Manuell
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {source}
          </span>
        );
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'BUY':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <ArrowDownLeft className="w-3 h-3" />
            <span>Kauf</span>
          </span>
        );
      case 'SELL':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <ArrowUpRight className="w-3 h-3" />
            <span>Verkauf</span>
          </span>
        );
      case 'REWARD':
      case 'STAKE':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Gift className="w-3 h-3" />
            <span>Reward</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <RefreshCw className="w-3 h-3" />
            <span>{type}</span>
          </span>
        );
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    }
  };

  const toggleSelectId = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`${selectedIds.size} ausgewählte Transaktionen wirklich löschen?`)) {
      if (onBulkDelete) {
        onBulkDelete(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDeleteTransaction(id));
      }
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
      
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Transaktions-Historie</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} von {transactions.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Alle Käufe, Rewards und Buchungen im Detail mit Einzelkursen
            </p>
          </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-300 font-medium">
                {selectedIds.size} ausgewählt
              </span>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Löschen</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Suchen nach Coin, Hash, Beschreibung..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Asset Filter */}
          <div>
            <select
              value={assetFilter}
              onChange={(e) => {
                setAssetFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Alle Coins ({uniqueCoins.length})</option>
              {uniqueCoins.map((coin) => (
                <option key={coin} value={coin}>{coin}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Alle Typen</option>
              <option value="BUY">Nur Käufe (Buy)</option>
              <option value="SELL">Nur Verkäufe (Sell)</option>
              <option value="REWARD">Nur Rewards / Staking</option>
              <option value="TRANSFER">Nur Transfers</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
            >
              <option value="newest">Datum (Neueste zuerst)</option>
              <option value="oldest">Datum (Älteste zuerst)</option>
              <option value="highest_spent">Betrag (Höchster)</option>
              <option value="lowest_spent">Betrag (Niedrigster)</option>
            </select>
          </div>
        </div>

        {/* Active filter pills */}
        {(assetFilter !== 'ALL' || typeFilter !== 'ALL' || sourceFilter !== 'ALL' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium">Aktive Filter:</span>
            {assetFilter !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Coin: {assetFilter}
                <button onClick={() => { setAssetFilter('ALL'); if (onClearAssetFilter) onClearAssetFilter(); }} className="ml-1.5 hover:text-white">&times;</button>
              </span>
            )}
            {typeFilter !== 'ALL' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Typ: {typeFilter}
                <button onClick={() => setTypeFilter('ALL')} className="ml-1.5 hover:text-white">&times;</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Suche: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1.5 hover:text-white">&times;</button>
              </span>
            )}
            <button
              onClick={() => {
                setAssetFilter('ALL');
                setTypeFilter('ALL');
                setSourceFilter('ALL');
                setSearchQuery('');
                if (onClearAssetFilter) onClearAssetFilter();
              }}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 ml-1"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedTransactions.length > 0 && selectedIds.size === paginatedTransactions.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="py-3.5 px-4">Datum &amp; Uhrzeit</th>
              <th className="py-3.5 px-4">Typ &amp; Börse</th>
              <th className="py-3.5 px-4">Erhalten / Asset</th>
              <th className="py-3.5 px-4 text-right">Eingezahlt / Ausgegeben</th>
              <th className="py-3.5 px-4 text-right">Einzelkurs</th>
              <th className="py-3.5 px-4 text-center">Details</th>
              <th className="py-3.5 px-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Keine Transaktionen für die aktuellen Filterkriterien gefunden.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const coinMeta = getCoinDetails(tx.receivedCurrency);
                const unitPrice = tx.pricePerUnitEUR || (tx.spentAmount > 0 && tx.receivedAmount > 0 ? (tx.spentAmount / tx.receivedAmount) : 0);
                const unitPriceDecimals = unitPrice < 1 ? 4 : (unitPrice < 10 ? 3 : 2);

                return (
                  <tr 
                    key={tx.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      selectedIds.has(tx.id) ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tx.id)}
                        onChange={() => toggleSelectId(tx.id)}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                      {formatDate(tx.timestamp)}
                    </td>

                    {/* Type and Exchange Source */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        {getTypeBadge(tx.type)}
                        {getSourceBadge(tx.source)}
                      </div>
                    </td>

                    {/* Received Asset & Amount */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-white flex-shrink-0"
                          style={{ backgroundColor: coinMeta.color || '#6366f1' }}
                        >
                          {tx.receivedCurrency.substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold font-mono text-white">
                            {tx.receivedAmount.toLocaleString('de-DE', { maximumFractionDigits: 8 })} {tx.receivedCurrency}
                          </div>
                          {tx.description && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {tx.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Spent / Invested */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                      {tx.spentAmount > 0 ? (
                        <div>
                          <span>
                            {currency === 'USD'
                              ? (tx.nativeAmountUSD ? `$${tx.nativeAmountUSD.toFixed(2)}` : (tx.spentCurrency === 'USD' ? `$${tx.spentAmount.toFixed(2)}` : formatEUR(tx.spentAmount)))
                              : (tx.spentCurrency === 'USD' ? `$${tx.spentAmount.toFixed(2)}` : formatEUR(tx.spentAmount))}
                          </span>
                          {tx.nativeAmountUSD && tx.spentCurrency !== 'USD' && currency !== 'USD' && (
                            <span className="text-[11px] text-slate-400 block font-sans">
                              (≈ ${tx.nativeAmountUSD.toFixed(2)})
                            </span>
                          )}
                          {tx.spentCurrency !== 'EUR' && tx.spentCurrency !== 'USD' && (
                            <span className="text-xs text-slate-400 block font-sans">
                              ({tx.spentAmount} {tx.spentCurrency})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Calculated Unit Price */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {unitPrice > 0 ? (
                        <div>
                          <span className="text-indigo-300 font-medium">
                            {currency === 'USD' && tx.pricePerUnitUSD
                              ? `$${tx.pricePerUnitUSD.toFixed(unitPriceDecimals)}`
                              : formatEUR(unitPrice, unitPriceDecimals)}
                          </span>
                          {currency === 'USD' && !tx.pricePerUnitUSD && (
                            <span className="text-[10px] text-slate-400 block">
                              {formatEUR(unitPrice, unitPriceDecimals)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>

                    {/* Details popup button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDetailTx(tx)}
                        title="Transaktionsdetails einsehen"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          title="Bearbeiten"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Transaktion ${tx.description || tx.receivedCurrency} wirklich löschen?`)) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Löschen"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Seite {currentPage} von {totalPages} ({filtered.length} Transaktionen)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-200">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-base">Transaktionsdetails</h4>
              <button 
                onClick={() => setDetailTx(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-white">{detailTx.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Beschreibung:</span>
                <span className="text-white font-medium">{detailTx.description}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Börsen-Quelle:</span>
                <span>{getSourceBadge(detailTx.source)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Erhaltene Menge:</span>
                <span className="font-mono text-emerald-400 font-bold">{detailTx.receivedAmount} {detailTx.receivedCurrency}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Ausgegebener Betrag:</span>
                <span className="font-mono text-white">{detailTx.spentAmount} {detailTx.spentCurrency}</span>
              </div>
              {detailTx.nativeAmountUSD && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Crypto.com USD Gegenwert:</span>
                  <span className="font-mono text-slate-200">${detailTx.nativeAmountUSD.toFixed(2)} USD</span>
                </div>
              )}
              {detailTx.transactionKind && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Transaction Kind:</span>
                  <span className="font-mono text-slate-300">{detailTx.transactionKind}</span>
                </div>
              )}
              {detailTx.transactionHash && (
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Tx Hash:</span>
                  <span className="font-mono text-indigo-400 truncate max-w-[200px]" title={detailTx.transactionHash}>
                    {detailTx.transactionHash}
                  </span>
                </div>
              )}
              {detailTx.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Notizen:</span>
                  <p className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs">
                    {detailTx.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

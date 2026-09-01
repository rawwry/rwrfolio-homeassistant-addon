import React from 'react';
import { AssetSummary } from '../types';
import { 
  Edit3, 
  Filter, 
  ArrowRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { getCoinDetails } from '../utils/priceService';

interface AssetListProps {
  assets: AssetSummary[];
  onSelectAssetForFilter?: (symbol: string) => void;
  onEditPrice?: (symbol: string, currentPrice: number) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  onSelectAssetForFilter,
  onEditPrice,
}) => {
  const formatEUR = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatCoinAmount = (val: number) => {
    if (val === 0) return '0';
    if (val >= 1000) return val.toLocaleString('de-DE', { maximumFractionDigits: 2 });
    if (val >= 1) return val.toLocaleString('de-DE', { maximumFractionDigits: 4 });
    return val.toLocaleString('de-DE', { maximumFractionDigits: 8 });
  };

  if (assets.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl p-12 border border-slate-800 text-center">
        <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Sparkles className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Noch keine Krypto-Assets vorhanden</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Importiere deine Crypto.com CSV-Datei oder erfasse deine ersten Käufe manuell, um deine Bestände und Durchschnitte hier zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden">
      <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Asset-Übersicht & Durchschnittskurse (DCA)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {assets.length} Coins
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatisch berechneter Einkaufswert, aktueller Marktwert und Gewinn/Verlust
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Asset / Coin</th>
              <th className="py-3.5 px-4 text-right">Bestand</th>
              <th className="py-3.5 px-4 text-right">Ø Kaufkurs (DCA)</th>
              <th className="py-3.5 px-4 text-right">Aktueller Kurs</th>
              <th className="py-3.5 px-4 text-right">Investiert</th>
              <th className="py-3.5 px-4 text-right">Aktueller Wert</th>
              <th className="py-3.5 px-4 text-right">Gewinn / Verlust</th>
              <th className="py-3.5 px-4 text-center">Portfolio</th>
              <th className="py-3.5 px-4 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {assets.map((asset) => {
              const details = getCoinDetails(asset.symbol);
              const isProfit = asset.pnlEUR >= 0;
              const priceDecimals = asset.currentPriceEUR < 1 ? 4 : (asset.currentPriceEUR < 10 ? 3 : 2);
              const avgBuyDecimals = asset.averageBuyPriceEUR < 1 ? 4 : (asset.averageBuyPriceEUR < 10 ? 3 : 2);

              return (
                <tr 
                  key={asset.symbol} 
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Asset Symbol & Name */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0"
                        style={{ backgroundColor: details.color || '#6366f1' }}
                      >
                        {asset.symbol.substring(0, 4)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="font-bold text-white shrink-0">{asset.symbol}</span>
                          <span 
                            className="text-xs font-normal text-slate-400 truncate max-w-[140px] sm:max-w-[200px]" 
                            title={asset.name}
                          >
                            {asset.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 whitespace-nowrap">
                          {asset.transactionCount} Transaktion{asset.transactionCount !== 1 ? 'en' : ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Balance */}
                  <td className="py-4 px-4 text-right font-mono font-medium text-slate-100">
                    <div>{formatCoinAmount(asset.currentBalance)}</div>
                    <div className="text-xs text-slate-400 font-sans">{asset.symbol}</div>
                  </td>

                  {/* Avg Buy Price (DCA) */}
                  <td className="py-4 px-4 text-right font-mono text-slate-200">
                    <div className="font-medium text-indigo-300">
                      {formatEUR(asset.averageBuyPriceEUR, avgBuyDecimals)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-sans">je {asset.symbol}</div>
                  </td>

                  {/* Current Price with quick edit */}
                  <td className="py-4 px-4 text-right font-mono text-slate-200">
                    <div className="flex items-center justify-end space-x-1.5 group/price">
                      <span className="font-medium">{formatEUR(asset.currentPriceEUR, priceDecimals)}</span>
                      {onEditPrice && (
                        <button
                          onClick={() => onEditPrice(asset.symbol, asset.currentPriceEUR)}
                          title="Kurs manuell anpassen"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400 transition-all"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Total Invested */}
                  <td className="py-4 px-4 text-right font-mono text-slate-300">
                    {formatEUR(asset.totalInvestedEUR)}
                  </td>

                  {/* Current Value */}
                  <td className="py-4 px-4 text-right font-mono font-bold text-white">
                    {formatEUR(asset.currentValueEUR)}
                  </td>

                  {/* Profit / Loss */}
                  <td className="py-4 px-4 text-right">
                    <div className={`font-mono font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)}%
                    </div>
                    <div className={`text-xs font-mono font-medium ${isProfit ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
                      {isProfit ? '+' : ''}{formatEUR(asset.pnlEUR)}
                    </div>
                  </td>

                  {/* Allocation % and progress bar */}
                  <td className="py-4 px-4 text-center min-w-[100px]">
                    <div className="text-xs font-semibold text-slate-200 mb-1">
                      {asset.allocationPercentage.toFixed(1)}%
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.max(2, asset.allocationPercentage))}%`,
                          backgroundColor: details.color || '#6366f1' 
                        }}
                      />
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right">
                    {onSelectAssetForFilter && (
                      <button
                        onClick={() => onSelectAssetForFilter(asset.symbol)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-indigo-600 hover:text-white border border-slate-700/60 transition-all shadow-sm"
                        title={`Transaktionen für ${asset.symbol} filtern`}
                      >
                        <Filter className="w-3 h-3" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

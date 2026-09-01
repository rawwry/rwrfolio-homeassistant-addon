import React from 'react';
import { AssetSummary, Transaction } from '../types';
import { PortfolioCharts } from './PortfolioCharts';
import { getCoinDetails } from '../utils/priceService';

interface AnalyticsViewProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  theme: 'light' | 'dark' | 'system';
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assets,
  transactions,
  theme,
}) => {
  const isLight = theme === 'light';

  return (
    <div className="space-y-6">
      {/* Visual Charts Component */}
      <PortfolioCharts assets={assets} transactions={transactions} />

      {/* Asset Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(asset => {
          const details = getCoinDetails(asset.symbol);
          const isProfit = asset.pnlEUR >= 0;
          return (
            <div 
              key={asset.symbol} 
              className={`p-5 rounded-2xl border space-y-3 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: details.color }}
                  >
                    {asset.symbol.substring(0, 3)}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.symbol}</div>
                    <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{asset.name}</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.currentPriceEUR.toFixed(2)} €</div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Live-Kurs</div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-xs pt-1 border-t font-mono ${
                isLight ? 'border-slate-100' : 'border-slate-800/60'
              }`}>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{asset.totalInvestedEUR.toFixed(2)} €</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Wert</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.currentValueEUR.toFixed(2)} €</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ø Kaufpreis (DCA)</span>
                  <span className="text-indigo-500 font-semibold">{asset.averageBuyPriceEUR.toFixed(4)} €</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <div className={`font-semibold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)}%
                  </div>
                  <div className={`text-[10px] font-medium ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                    {isProfit ? '+' : ''}{asset.pnlEUR.toFixed(2)} €
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


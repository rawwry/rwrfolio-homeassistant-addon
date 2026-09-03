import React from 'react';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { PortfolioCharts } from './PortfolioCharts';
import { getCoinDetails } from '../utils/priceService';

interface AnalyticsViewProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  theme: 'light' | 'dark' | 'system';
  currency?: PortfolioCurrency;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assets,
  transactions,
  theme,
  currency = 'EUR',
}) => {
  const isLight = theme === 'light';
  const isUSD = currency === 'USD';

  const formatCurr = (val: number, decimals: number = 2) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Visual Charts Component */}
      <PortfolioCharts assets={assets} transactions={transactions} currency={currency} />

      {/* Asset Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(asset => {
          const details = getCoinDetails(asset.symbol);

          const activePrice = isUSD ? (asset.currentPriceUSD || asset.currentPrice) : (asset.currentPriceEUR || asset.currentPrice);
          const activeInvested = isUSD ? (asset.totalInvestedUSD ?? asset.totalInvested) : (asset.totalInvestedEUR ?? asset.totalInvested);
          const activeValue = isUSD ? (asset.currentValueUSD ?? asset.currentValue) : (asset.currentValueEUR ?? asset.currentValue);
          const activeAvgBuy = isUSD ? (asset.averageBuyPriceUSD || asset.averageBuyPrice) : (asset.averageBuyPriceEUR || asset.averageBuyPrice);
          const activePnl = isUSD ? (asset.pnlUSD ?? asset.pnl) : (asset.pnlEUR ?? asset.pnl);

          const isProfit = activePnl >= 0;
          const priceDecimals = activePrice < 1 ? 4 : 2;
          const avgBuyDecimals = activeAvgBuy < 1 ? 4 : 2;

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
                  <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurr(activePrice, priceDecimals)}
                  </div>
                  <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Live-Kurs</div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-xs pt-1 border-t font-mono ${
                isLight ? 'border-slate-100' : 'border-slate-800/60'
              }`}>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Investiert</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {formatCurr(activeInvested)}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Aktueller Wert</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {formatCurr(activeValue)}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Ø Kaufpreis (DCA)</span>
                  <span className="text-indigo-500 font-semibold">
                    {formatCurr(activeAvgBuy, avgBuyDecimals)}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] block font-sans ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Gewinn / Verlust</span>
                  <div className={`font-semibold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isProfit ? '+' : ''}{asset.pnlPercentage.toFixed(2)}%
                  </div>
                  <div className={`text-[10px] font-medium ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                    {isProfit ? '+' : ''}{formatCurr(activePnl)}
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


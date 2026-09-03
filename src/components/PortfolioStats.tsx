import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  CircleDollarSign,
  PieChart as PieIcon
} from 'lucide-react';
import { PortfolioTotals, AssetSummary, PortfolioCurrency } from '../types';

interface PortfolioStatsProps {
  totals: PortfolioTotals;
  assets: AssetSummary[];
  currency?: PortfolioCurrency;
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({ totals, assets, currency = 'EUR' }) => {
  const activeCurrency = totals.currency || currency;
  const isUSD = activeCurrency === 'USD';
  
  const totalPnl = totals.totalPnl !== undefined ? totals.totalPnl : totals.totalPnlEUR;
  const isPositive = totalPnl >= 0;

  const formatActive = (val: number) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: isUSD ? 'USD' : 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatAlt = (val: number) => {
    return new Intl.NumberFormat(isUSD ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: isUSD ? 'EUR' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const activeValue = totals.currentValue !== undefined ? totals.currentValue : totals.currentValueEUR;
  const altValue = isUSD ? totals.currentValueEUR : (totals.currentValueEUR * (totals.eurUsdRate || 1.1591));

  const activeInvested = totals.totalInvested !== undefined ? totals.totalInvested : totals.totalInvestedEUR;
  const altInvested = isUSD ? totals.totalInvestedEUR : (totals.totalInvestedEUR * (totals.eurUsdRate || 1.1591));

  const altPnl = isUSD ? totals.totalPnlEUR : (totals.totalPnlEUR * (totals.eurUsdRate || 1.1591));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Portfolio Value Card */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Portfolio Gesamtwert
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {formatActive(activeValue)}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1.5">
          <span className="text-slate-300 font-medium">≈ {formatAlt(altValue)}</span>
          <span className="text-slate-500">•</span>
          <span>Live-Kurse</span>
        </div>
      </div>

      {/* Total Invested */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gesamt Eingezahlt / Investiert
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {formatActive(activeInvested)}
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1.5">
          <span className="text-slate-300 font-medium">≈ {formatAlt(altInvested)}</span>
          <span className="text-slate-500">•</span>
          <span>{totals.transactionCount} Transaktionen</span>
        </div>
      </div>

      {/* Profit & Loss */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all">
        <div className={`absolute top-0 right-0 w-32 h-32 ${isPositive ? 'bg-emerald-500/5 group-hover:bg-emerald-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'} rounded-full blur-2xl transition-all`} />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Nicht realisierter Gewinn (P&L)
          </span>
          <div className={`w-8 h-8 rounded-lg ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'} border flex items-center justify-center`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{formatActive(totalPnl)}
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2">
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
          }`}>
            {isPositive ? '+' : ''}{totals.totalPnlPercentage.toFixed(2)}%
          </span>
          <span className="text-xs text-slate-400">
            ≈ {isPositive ? '+' : ''}{formatAlt(altPnl)}
          </span>
        </div>
      </div>

      {/* Asset Diversity / Top Asset */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Assets & Diversifikation
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {totals.assetCount} <span className="text-sm font-normal text-slate-400">Coins</span>
        </div>
        <div className="mt-2 flex items-center text-xs text-slate-400 space-x-1">
          {totals.topAssetSymbol !== '-' ? (
            <span>
              Top: <strong className="text-slate-200">{totals.topAssetSymbol}</strong> ({totals.topAssetPercentage.toFixed(1)}% des Portfolios)
            </span>
          ) : (
            <span>Noch keine Bestände</span>
          )}
        </div>
      </div>
    </div>
  );
};

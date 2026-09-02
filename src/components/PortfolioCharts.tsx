import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { AssetSummary, Transaction, PortfolioCurrency } from '../types';
import { generateInvestmentTimeline } from '../utils/portfolioCalculations';
import { getCoinDetails } from '../utils/priceService';
import { PieChart as PieIcon, TrendingUp, Calendar } from 'lucide-react';

interface PortfolioChartsProps {
  assets: AssetSummary[];
  transactions: Transaction[];
  currency?: PortfolioCurrency;
}

export const PortfolioCharts: React.FC<PortfolioChartsProps> = ({
  assets,
  transactions,
  currency = 'EUR' as PortfolioCurrency,
}) => {
  const isUSD = currency === 'USD';
  const currencySymbol = isUSD ? '$' : '€';
  const timelineData = generateInvestmentTimeline(transactions, currency as PortfolioCurrency);

  const pieData = assets
    .filter(a => a.currentValue > 0)
    .map(a => {
      const details = getCoinDetails(a.symbol);
      return {
        name: a.symbol,
        fullName: a.name,
        value: a.currentValue,
        percentage: a.allocationPercentage,
        color: details.color || '#6366f1',
      };
    });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(isUSD ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name} ({data.fullName})</span>
          </div>
          <div className="text-slate-300">
            Wert: <strong className="text-white">{formatCurrency(data.value)}</strong>
          </div>
          <div className="text-indigo-400 font-semibold">
            Anteil: {data.percentage.toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTimelineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{data.formattedDate}</span>
          </div>
          <div className="text-slate-300">
            Kauf: <strong className="text-emerald-400">+{formatCurrency(data.added)}</strong> ({data.asset})
          </div>
          <div className="text-indigo-300">
            Kumuliert investiert: <strong className="text-white">{formatCurrency(data.investedCum)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Allocation Donut Chart */}
      <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-400" />
              <span>Asset-Allokation</span>
            </h3>
            <span className="text-xs text-slate-400">nach aktuellem Wert in {currency}</span>
          </div>

          {pieData.length > 0 ? (
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    content={<CustomPieTooltip />} 
                    isAnimationActive={false} 
                    animationDuration={0}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              Keine Bestände vorhanden
            </div>
          )}
        </div>

        {/* Legend List */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60 max-h-36 overflow-y-auto">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/40 text-xs">
              <div className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-200 truncate">{item.name}</span>
              </div>
              <span className="font-mono text-slate-400 ml-1">{item.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cumulative Investment Timeline */}
      <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl p-5 border border-slate-800/90 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Investitions-Entwicklung über Zeit</span>
            </h3>
            <span className="text-xs text-slate-400">Kumulierter Kapitaleinsatz ({currency})</span>
          </div>

          {timelineData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#64748b" 
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickFormatter={(v) => `${v}${currencySymbol}`}
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    content={<CustomTimelineTooltip />} 
                    isAnimationActive={false} 
                    animationDuration={0}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="investedCum" 
                    stroke="#6366f1" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorInvested)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Noch keine Käufe für Zeitachsen-Darstellung
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between mt-2">
          <span>Gesamter Zukauf: <strong>{timelineData.length} Transaktionszeitpunkte</strong></span>
          <span className="text-emerald-400 font-semibold font-mono">DCA Strategie ({currency})</span>
        </div>
      </div>

    </div>
  );
};

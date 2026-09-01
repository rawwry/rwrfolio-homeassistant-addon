import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  FileText,
  ChevronRight,
  Info,
  DollarSign,
  PieChart
} from 'lucide-react';
import { Transaction } from '../types';
import { calculateFIFOTaxReport, exportTaxReportToCSV, PortfolioTaxReport } from '../utils/taxCalculator';
import { getCoinDetails } from '../utils/priceService';

interface TaxViewProps {
  transactions: Transaction[];
  customPrices: Record<string, number>;
  theme: 'light' | 'dark' | 'system';
}

export const TaxView: React.FC<TaxViewProps> = ({
  transactions,
  customPrices,
  theme,
}) => {
  const isLight = theme === 'light';
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const taxReport = useMemo<PortfolioTaxReport>(() => {
    return calculateFIFOTaxReport(transactions, customPrices, selectedYear);
  }, [transactions, customPrices, selectedYear]);

  const handleExportTaxCSV = () => {
    const csv = exportTaxReportToCSV(taxReport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rwrfolio_steuerbericht_fifo_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exemptionProgress = Math.min(
    100,
    Math.max(0, (taxReport.realizedTaxableNetEUR / taxReport.germanExemptionLimitEUR) * 100)
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Year Selector */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-sm transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                FIFO Haltedauer &amp; Steuer-Report (§ 23 EStG)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                1-Jahres-Frist (FIFO)
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Automatische Zuordnung nach First-In-First-Out: Kryptowährungen sind nach 365 Tagen Haltedauer zu 100% steuerfrei.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <label className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Steuerjahr:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Steuerjahr auswählen"
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900' 
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value={currentYear}>{currentYear} (Aktuell)</option>
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear - 2}>{currentYear - 2}</option>
            </select>
          </div>

          <button
            onClick={handleExportTaxCSV}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
            title="Steuerbericht als CSV für Steuerberater/Finanzamt exportieren"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Steuer-Export (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tax-Free Assets */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Steuerfreier Bestand</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-500 font-mono">
            {taxReport.totalTaxFreeValueEUR.toFixed(2)} €
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Anteil am Portfolio</span>
            <span className="font-bold text-emerald-500">{taxReport.taxFreePercentage.toFixed(1)}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-700/20 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${taxReport.taxFreePercentage}%` }}
            />
          </div>
        </div>

        {/* Card 2: Tax-Free Unrealized Gains */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Steuerfreier Gewinn</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-indigo-500 font-mono">
            {taxReport.totalTaxFreeUnrealizedPnlEUR >= 0 ? '+' : ''}{taxReport.totalTaxFreeUnrealizedPnlEUR.toFixed(2)} €
          </div>
          <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Bereits abgeltungs- und einkommensteuerfrei realisierbar.
          </p>
        </div>

        {/* Card 3: Taxable Holding with Countdown */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Noch steuerpflichtig</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-extrabold text-amber-500 font-mono">
            {taxReport.totalTaxableValueEUR.toFixed(2)} €
          </div>
          <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {taxReport.upcomingTaxFreeLots.length} Tranche(n) in der 1-Jahres-Haltefrist.
          </p>
        </div>

        {/* Card 4: German Exemption Limit */}
        <div className={`p-4 rounded-2xl border transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Realisierte Gewinne {selectedYear}</span>
            <span className={`p-1.5 rounded-lg ${taxReport.exemptionExceeded ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-xl font-extrabold font-mono ${taxReport.realizedTaxableNetEUR > 0 ? (taxReport.exemptionExceeded ? 'text-rose-500' : 'text-emerald-500') : (isLight ? 'text-slate-800' : 'text-slate-200')}`}>
            {taxReport.realizedTaxableNetEUR.toFixed(2)} €
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Freigrenze: {taxReport.germanExemptionLimitEUR} €</span>
            <span className={taxReport.exemptionExceeded ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold'}>
              {taxReport.exemptionExceeded ? 'Überschritten' : 'Steuerfrei'}
            </span>
          </div>
          {/* Bar */}
          <div className="w-full bg-slate-700/20 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${taxReport.exemptionExceeded ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, exemptionProgress)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Asset-by-Asset Holding Status */}
      <div className={`rounded-2xl border overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/80 bg-slate-950/40'
        }`}>
          <div>
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Asset Haltedauern &amp; FIFO-Bestände
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Detaillierte Aufteilung aller Positionen nach steuerfreiem (&gt; 365 Tage) und steuerpflichtigem Anteil.
            </p>
          </div>
        </div>

        {taxReport.assets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Keine aktiven Bestände vorhanden. Importiere eine CSV oder erfasse Transaktionen, um die Haltedauer-Analyse zu sehen.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {taxReport.assets.map((asset) => {
              const details = getCoinDetails(asset.symbol);
              const isExpanded = expandedAsset === asset.symbol;

              return (
                <div key={asset.symbol} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm"
                        style={{ backgroundColor: details.color }}
                      >
                        {asset.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{asset.symbol}</span>
                          <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{asset.name}</span>
                        </div>
                        <div className="text-xs font-mono text-slate-500">
                          Gesamt: {asset.totalBalance.toFixed(6)} {asset.symbol} &bull; Wert: {asset.totalCurrentValueEUR.toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    {/* Progress visual */}
                    <div className="flex-1 max-w-xs sm:px-4">
                      <div className="flex items-center justify-between text-xs mb-1 font-mono">
                        <span className="text-emerald-500 font-semibold">{asset.taxFreePercentage.toFixed(1)}% Steuerfrei</span>
                        <span className="text-amber-500 font-semibold">{(100 - asset.taxFreePercentage).toFixed(1)}% &lt; 1 Jahr</span>
                      </div>
                      <div className="w-full bg-slate-700/20 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-2 transition-all duration-300"
                          style={{ width: `${asset.taxFreePercentage}%` }}
                          title={`Steuerfrei: ${asset.taxFreeBalance.toFixed(6)} ${asset.symbol}`}
                        />
                        <div 
                          className="bg-amber-500 h-2 transition-all duration-300"
                          style={{ width: `${100 - asset.taxFreePercentage}%` }}
                          title={`Steuerpflichtig: ${asset.taxableBalance.toFixed(6)} ${asset.symbol}`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right font-mono text-xs">
                        <div className="text-emerald-500 font-bold">{asset.taxFreeValueEUR.toFixed(2)} € frei</div>
                        <div className="text-amber-500">{asset.taxableValueEUR.toFixed(2)} € Frist</div>
                      </div>

                      <button
                        onClick={() => setExpandedAsset(isExpanded ? null : asset.symbol)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                        }`}
                        title="Einzelne Kauf-Tranchen anzeigen"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Purchase Lots */}
                  {isExpanded && (
                    <div className={`mt-3 p-3 rounded-xl border text-xs font-mono space-y-2 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}>
                      <div className="font-sans font-bold text-xs text-slate-500 mb-1">
                        Kauf-Tranchen (FIFO) für {asset.symbol}:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-slate-400 text-[10px] uppercase font-sans border-b border-slate-200 dark:border-slate-800">
                              <th className="pb-1">Kaufdatum</th>
                              <th className="pb-1">Menge</th>
                              <th className="pb-1">Kaufkurs</th>
                              <th className="pb-1">Investiert</th>
                              <th className="pb-1">Haltedauer</th>
                              <th className="pb-1">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/40">
                            {asset.lots.map((lot, idx) => (
                              <tr key={idx} className="py-1">
                                <td className="py-1.5">{lot.buyDate.substring(0, 10)}</td>
                                <td className="py-1.5 font-bold">{lot.amount.toFixed(6)} {lot.symbol}</td>
                                <td className="py-1.5">{lot.costPerUnitEUR.toFixed(2)} €</td>
                                <td className="py-1.5">{lot.totalCostEUR.toFixed(2)} €</td>
                                <td className="py-1.5">{lot.daysHeld} Tage</td>
                                <td className="py-1.5">
                                  {lot.isTaxFree ? (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      <span>Steuerfrei</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-500 font-semibold">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>Frei am {lot.taxFreeDate} ({lot.daysRemainingToTaxFree} Tage)</span>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming Tax-Free Unlocks & Realized Sales Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Next Unlocks */}
        <div className={`p-5 rounded-2xl border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Nächste Steuerfreigaben (Countdown)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {taxReport.upcomingTaxFreeLots.length} ausstehend
            </span>
          </div>

          {taxReport.upcomingTaxFreeLots.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-500 font-semibold bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              🎉 100% deiner aktuellen Bestände haben bereits die 1-Jahres-Frist überschritten und sind steuerfrei!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {taxReport.upcomingTaxFreeLots.slice(0, 8).map((lot, i) => (
                <div 
                  key={i}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-indigo-500">{lot.symbol}</span>
                    <span className="text-slate-400">({lot.amount.toFixed(4)})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-500 font-bold">in {lot.daysRemainingToTaxFree} Tagen</div>
                    <div className="text-[10px] text-slate-500">am {lot.taxFreeDate}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Realized Sales in Year */}
        <div className={`p-5 rounded-2xl border transition-colors space-y-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-bold flex items-center space-x-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Realisierte Verkäufe {selectedYear} (FIFO)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {taxReport.realizedSales.length} Transaktionen
            </span>
          </div>

          {taxReport.realizedSales.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-500/5 rounded-xl border border-slate-500/10">
              Im Steuerjahr {selectedYear} wurden keine Verkäufe getätigt.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {taxReport.realizedSales.map((sale, i) => {
                const isGain = sale.realizedPnlEUR >= 0;
                return (
                  <div 
                    key={i}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>{sale.symbol}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${sale.isTaxFree ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {sale.isTaxFree ? 'Steuerfrei' : 'Steuerpflichtig'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Verkauf: {sale.sellDate.substring(0, 10)} &bull; {sale.daysHeld} Tage gehalten
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${isGain ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isGain ? '+' : ''}{sale.realizedPnlEUR.toFixed(2)} €
                      </div>
                      <div className="text-[10px] text-slate-500">Erlös: {sale.proceedsEUR.toFixed(2)} €</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

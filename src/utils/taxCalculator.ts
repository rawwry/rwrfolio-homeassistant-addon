import { Transaction } from '../types';
import { getCoinPriceEUR, getCoinDetails } from './priceService';

export interface HoldingLot {
  id: string;
  symbol: string;
  buyDate: string;
  buyTimestamp: number;
  amount: number;
  costPerUnitEUR: number;
  totalCostEUR: number;
  daysHeld: number;
  isTaxFree: boolean;
  taxFreeDate: string;
  daysRemainingToTaxFree: number;
  currentPriceEUR: number;
  currentValueEUR: number;
  unrealizedPnlEUR: number;
}

export interface RealizedSaleLot {
  id: string;
  symbol: string;
  sellDate: string;
  buyDate: string;
  amount: number;
  costBasisEUR: number;
  proceedsEUR: number;
  realizedPnlEUR: number;
  daysHeld: number;
  isTaxFree: boolean;
  taxYear: number;
}

export interface AssetTaxSummary {
  symbol: string;
  name: string;
  totalBalance: number;
  taxFreeBalance: number;
  taxableBalance: number;
  taxFreePercentage: number;
  taxFreeValueEUR: number;
  taxableValueEUR: number;
  taxFreeUnrealizedPnlEUR: number;
  taxableUnrealizedPnlEUR: number;
  totalCurrentValueEUR: number;
  lots: HoldingLot[];
}

export interface PortfolioTaxReport {
  taxYear: number;
  totalPortfolioValueEUR: number;
  totalTaxFreeValueEUR: number;
  totalTaxableValueEUR: number;
  taxFreePercentage: number;
  totalTaxFreeUnrealizedPnlEUR: number;
  totalTaxableUnrealizedPnlEUR: number;
  
  // Realized in selected tax year
  realizedTaxableGainEUR: number;
  realizedTaxableLossEUR: number;
  realizedTaxableNetEUR: number;
  realizedTaxFreeProfitEUR: number;
  realizedSalesCount: number;
  germanExemptionLimitEUR: number; // 1000 EUR
  exemptionExceeded: boolean;
  
  // Staking & Rewards in tax year
  totalStakingRewardsEUR: number;
  
  assets: AssetTaxSummary[];
  upcomingTaxFreeLots: HoldingLot[];
  realizedSales: RealizedSaleLot[];
}

export function calculateFIFOTaxReport(
  transactions: Transaction[],
  customPrices: Record<string, number> = {},
  taxYear: number = new Date().getFullYear()
): PortfolioTaxReport {
  // 1. Sort all transactions chronologically (oldest to newest)
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const now = Date.now();
  const ONE_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

  // Track inventory of lots per asset for FIFO
  // Each lot: { id, buyDate, timestamp, amount, costPerUnitEUR }
  const assetInventory: Record<string, {
    id: string;
    buyDate: string;
    timestamp: number;
    amount: number;
    costPerUnitEUR: number;
  }[]> = {};

  const realizedSales: RealizedSaleLot[] = [];
  let totalStakingRewardsEUR = 0;

  for (const tx of sorted) {
    const txDate = new Date(tx.timestamp);
    const txYear = isNaN(txDate.getTime()) ? taxYear : txDate.getFullYear();

    if (tx.type === 'BUY' || tx.type === 'TRANSFER' || tx.type === 'REWARD' || tx.type === 'STAKE') {
      const symbol = (tx.receivedCurrency || tx.spentCurrency || '').toUpperCase();
      if (!symbol || symbol === 'EUR' || symbol === 'USD') continue;

      const amount = tx.receivedAmount || 0;
      if (amount <= 0) continue;

      let costPerUnitEUR = 0;
      if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0) {
        costPerUnitEUR = tx.pricePerUnitEUR;
      } else if (tx.spentAmount > 0 && tx.spentCurrency.toUpperCase() === 'EUR') {
        costPerUnitEUR = tx.spentAmount / amount;
      } else if (tx.nativeCurrency === 'EUR' && tx.nativeAmount) {
        costPerUnitEUR = tx.nativeAmount / amount;
      } else {
        costPerUnitEUR = getCoinPriceEUR(symbol, customPrices);
      }

      if (tx.type === 'REWARD' || tx.type === 'STAKE') {
        if (txYear === taxYear) {
          totalStakingRewardsEUR += amount * costPerUnitEUR;
        }
      }

      if (!assetInventory[symbol]) {
        assetInventory[symbol] = [];
      }

      assetInventory[symbol].push({
        id: tx.id,
        buyDate: tx.timestamp,
        timestamp: isNaN(txDate.getTime()) ? now : txDate.getTime(),
        amount,
        costPerUnitEUR,
      });
    } else if (tx.type === 'SELL') {
      const symbol = (tx.spentCurrency || tx.receivedCurrency || '').toUpperCase();
      if (!symbol || symbol === 'EUR' || symbol === 'USD') continue;

      let sellAmount = tx.spentAmount > 0 ? tx.spentAmount : tx.receivedAmount;
      if (sellAmount <= 0) continue;

      let sellPricePerUnitEUR = 0;
      if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0) {
        sellPricePerUnitEUR = tx.pricePerUnitEUR;
      } else if (tx.receivedAmount > 0 && tx.receivedCurrency.toUpperCase() === 'EUR') {
        sellPricePerUnitEUR = tx.receivedAmount / sellAmount;
      } else if (tx.nativeCurrency === 'EUR' && tx.nativeAmount) {
        sellPricePerUnitEUR = tx.nativeAmount / sellAmount;
      } else {
        sellPricePerUnitEUR = getCoinPriceEUR(symbol, customPrices);
      }

      const queue = assetInventory[symbol] || [];

      // Consume lots FIFO
      while (sellAmount > 0 && queue.length > 0) {
        const oldestLot = queue[0];
        const matchAmount = Math.min(sellAmount, oldestLot.amount);

        const holdingDurationMs = Math.max(0, (isNaN(txDate.getTime()) ? now : txDate.getTime()) - oldestLot.timestamp);
        const daysHeld = Math.floor(holdingDurationMs / (1000 * 60 * 60 * 24));
        const isTaxFree = holdingDurationMs >= ONE_YEAR_MS;

        const costBasisEUR = matchAmount * oldestLot.costPerUnitEUR;
        const proceedsEUR = matchAmount * sellPricePerUnitEUR;
        const realizedPnlEUR = proceedsEUR - costBasisEUR;

        realizedSales.push({
          id: `${tx.id}-${oldestLot.id}`,
          symbol,
          sellDate: tx.timestamp,
          buyDate: oldestLot.buyDate,
          amount: matchAmount,
          costBasisEUR,
          proceedsEUR,
          realizedPnlEUR,
          daysHeld,
          isTaxFree,
          taxYear: txYear,
        });

        oldestLot.amount -= matchAmount;
        sellAmount -= matchAmount;

        if (oldestLot.amount <= 0.00000001) {
          queue.shift();
        }
      }
    }
  }

  // 2. Build current inventory analysis & remaining lots
  const assetSummaries: AssetTaxSummary[] = [];
  const upcomingTaxFreeLots: HoldingLot[] = [];

  let totalPortfolioValueEUR = 0;
  let totalTaxFreeValueEUR = 0;
  let totalTaxableValueEUR = 0;
  let totalTaxFreeUnrealizedPnlEUR = 0;
  let totalTaxableUnrealizedPnlEUR = 0;

  for (const [symbol, queue] of Object.entries(assetInventory)) {
    const currentPrice = getCoinPriceEUR(symbol, customPrices);
    const details = getCoinDetails(symbol);

    const activeLots: HoldingLot[] = [];
    let assetTaxFreeBal = 0;
    let assetTaxableBal = 0;
    let assetTaxFreeVal = 0;
    let assetTaxableVal = 0;
    let assetTaxFreePnl = 0;
    let assetTaxablePnl = 0;

    for (const lot of queue) {
      if (lot.amount <= 0.00000001) continue;

      const durationMs = Math.max(0, now - lot.timestamp);
      const daysHeld = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      const isTaxFree = durationMs >= ONE_YEAR_MS;

      const taxFreeUnlockDate = new Date(lot.timestamp + ONE_YEAR_MS);
      const daysRemaining = Math.max(0, 365 - daysHeld);

      const totalCost = lot.amount * lot.costPerUnitEUR;
      const currentVal = lot.amount * currentPrice;
      const pnl = currentVal - totalCost;

      const holdingLot: HoldingLot = {
        id: lot.id,
        symbol,
        buyDate: lot.buyDate,
        buyTimestamp: lot.timestamp,
        amount: lot.amount,
        costPerUnitEUR: lot.costPerUnitEUR,
        totalCostEUR: totalCost,
        daysHeld,
        isTaxFree,
        taxFreeDate: taxFreeUnlockDate.toLocaleDateString('de-DE'),
        daysRemainingToTaxFree: daysRemaining,
        currentPriceEUR: currentPrice,
        currentValueEUR: currentVal,
        unrealizedPnlEUR: pnl,
      };

      activeLots.push(holdingLot);

      if (isTaxFree) {
        assetTaxFreeBal += lot.amount;
        assetTaxFreeVal += currentVal;
        assetTaxFreePnl += pnl;
      } else {
        assetTaxableBal += lot.amount;
        assetTaxableVal += currentVal;
        assetTaxablePnl += pnl;
        upcomingTaxFreeLots.push(holdingLot);
      }
    }

    const totalBal = assetTaxFreeBal + assetTaxableBal;
    const totalVal = assetTaxFreeVal + assetTaxableVal;

    if (totalBal > 0.00000001 || totalVal > 0.01) {
      totalPortfolioValueEUR += totalVal;
      totalTaxFreeValueEUR += assetTaxFreeVal;
      totalTaxableValueEUR += assetTaxableVal;
      totalTaxFreeUnrealizedPnlEUR += assetTaxFreePnl;
      totalTaxableUnrealizedPnlEUR += assetTaxablePnl;

      assetSummaries.push({
        symbol,
        name: details.name,
        totalBalance: totalBal,
        taxFreeBalance: assetTaxFreeBal,
        taxableBalance: assetTaxableBal,
        taxFreePercentage: totalBal > 0 ? (assetTaxFreeBal / totalBal) * 100 : 0,
        taxFreeValueEUR: assetTaxFreeVal,
        taxableValueEUR: assetTaxableVal,
        taxFreeUnrealizedPnlEUR: assetTaxFreePnl,
        taxableUnrealizedPnlEUR: assetTaxablePnl,
        totalCurrentValueEUR: totalVal,
        lots: activeLots.sort((a, b) => a.buyTimestamp - b.buyTimestamp),
      });
    }
  }

  // Sort upcoming tax-free lots by shortest remaining days
  upcomingTaxFreeLots.sort((a, b) => a.daysRemainingToTaxFree - b.daysRemainingToTaxFree);

  // Filter realized sales for the chosen tax year
  const salesInTaxYear = realizedSales.filter(s => s.taxYear === taxYear);

  let realizedTaxableGainEUR = 0;
  let realizedTaxableLossEUR = 0;
  let realizedTaxFreeProfitEUR = 0;

  for (const s of salesInTaxYear) {
    if (s.isTaxFree) {
      realizedTaxFreeProfitEUR += s.realizedPnlEUR;
    } else {
      if (s.realizedPnlEUR > 0) {
        realizedTaxableGainEUR += s.realizedPnlEUR;
      } else {
        realizedTaxableLossEUR += Math.abs(s.realizedPnlEUR);
      }
    }
  }

  const realizedTaxableNetEUR = realizedTaxableGainEUR - realizedTaxableLossEUR;
  const germanExemptionLimitEUR = 1000; // § 23 Abs. 3 EStG (ab 2024: 1.000 € Freigrenze)

  return {
    taxYear,
    totalPortfolioValueEUR,
    totalTaxFreeValueEUR,
    totalTaxableValueEUR,
    taxFreePercentage: totalPortfolioValueEUR > 0 ? (totalTaxFreeValueEUR / totalPortfolioValueEUR) * 100 : 0,
    totalTaxFreeUnrealizedPnlEUR,
    totalTaxableUnrealizedPnlEUR,
    realizedTaxableGainEUR,
    realizedTaxableLossEUR,
    realizedTaxableNetEUR,
    realizedTaxFreeProfitEUR,
    realizedSalesCount: salesInTaxYear.length,
    germanExemptionLimitEUR,
    exemptionExceeded: realizedTaxableNetEUR > germanExemptionLimitEUR,
    totalStakingRewardsEUR,
    assets: assetSummaries.sort((a, b) => b.totalCurrentValueEUR - a.totalCurrentValueEUR),
    upcomingTaxFreeLots,
    realizedSales: salesInTaxYear.sort((a, b) => new Date(b.sellDate).getTime() - new Date(a.sellDate).getTime()),
  };
}

export function exportTaxReportToCSV(report: PortfolioTaxReport): string {
  const lines: string[] = [];
  lines.push(`rwr/folio - FIFO Steuer- & Haltedauer-Report (Steuerjahr ${report.taxYear})`);
  lines.push(`Erstellt am;${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`);
  lines.push('');
  lines.push('--- KENNZAHLEN ---');
  lines.push(`Gesamtwert Portfolio;${report.totalPortfolioValueEUR.toFixed(2)} EUR`);
  lines.push(`Steuerfreier Bestand (> 1 Jahr);${report.totalTaxFreeValueEUR.toFixed(2)} EUR (${report.taxFreePercentage.toFixed(1)}%)`);
  lines.push(`Steuerfreier unversteuerter Gewinn;${report.totalTaxFreeUnrealizedPnlEUR.toFixed(2)} EUR`);
  lines.push(`Noch steuerpflichtiger Bestand (< 1 Jahr);${report.totalTaxableValueEUR.toFixed(2)} EUR`);
  lines.push(`Realisierter steuerpflichtiger Gewinn (${report.taxYear});${report.realizedTaxableNetEUR.toFixed(2)} EUR`);
  lines.push(`Freigrenze gem. § 23 EStG;${report.germanExemptionLimitEUR} EUR`);
  lines.push('');
  lines.push('--- AKTUELLE ASSET-HALTEDAUERN (FIFO) ---');
  lines.push('Asset;Name;Gesamtbestand;Steuerfrei;Steuerpflichtig;Steuerfrei-Anteil;Steuerfreier Wert (EUR);Steuerfreier PnL (EUR);Aktueller Kurs (EUR)');
  
  for (const a of report.assets) {
    lines.push(
      `${a.symbol};${a.name};${a.totalBalance.toFixed(6)};${a.taxFreeBalance.toFixed(6)};${a.taxableBalance.toFixed(6)};${a.taxFreePercentage.toFixed(1)}%;${a.taxFreeValueEUR.toFixed(2)};${a.taxFreeUnrealizedPnlEUR.toFixed(2)};${(a.totalCurrentValueEUR / (a.totalBalance || 1)).toFixed(2)}`
    );
  }

  lines.push('');
  lines.push('--- REALISIERTE VERKAEUFE (FIFO) ---');
  lines.push('Asset;Verkaufsdatum;Kaufdatum;Menge;Anschaffungskosten (EUR);Erlös (EUR);Gewinn/Verlust (EUR);Haltedauer (Tage);Steuerstatus');
  for (const s of report.realizedSales) {
    lines.push(
      `${s.symbol};${s.sellDate.substring(0, 10)};${s.buyDate.substring(0, 10)};${s.amount.toFixed(6)};${s.costBasisEUR.toFixed(2)};${s.proceedsEUR.toFixed(2)};${s.realizedPnlEUR.toFixed(2)};${s.daysHeld};${s.isTaxFree ? 'Steuerfrei (> 1 Jahr)' : 'Steuerpflichtig (< 1 Jahr)'}`
    );
  }

  return lines.join('\n');
}

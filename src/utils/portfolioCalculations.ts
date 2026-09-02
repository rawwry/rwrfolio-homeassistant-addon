import { Transaction, AssetSummary, PortfolioTotals } from '../types';
import { getCoinPriceEUR, getCoinDetails } from './priceService';

export function calculateAssetSummaries(
  transactions: Transaction[],
  customPrices: Record<string, number> = {}
): { assets: AssetSummary[]; totals: PortfolioTotals } {
  const assetMap: Record<string, {
    symbol: string;
    totalBought: number;
    totalSold: number;
    totalInvestedEUR: number;
    firstBuyDate: string;
    lastBuyDate: string;
    transactionCount: number;
  }> = {};

  // Sort chronological
  const sorted = [...transactions].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  for (const tx of sorted) {
    let symbol = (tx.receivedCurrency || tx.spentCurrency || 'UNKNOWN').toUpperCase();
    if (symbol === 'MATIC' || symbol === 'POLYGON') {
      symbol = 'POL';
    }

    if (symbol === 'EUR' || symbol === 'USD' || symbol === 'UNKNOWN') {
      // If selling to EUR, handle the sold asset
      if (tx.type === 'SELL' && tx.spentCurrency && tx.spentCurrency !== 'EUR') {
        let soldSym = tx.spentCurrency.toUpperCase();
        if (soldSym === 'MATIC' || soldSym === 'POLYGON') {
          soldSym = 'POL';
        }
        if (!assetMap[soldSym]) {
          assetMap[soldSym] = {
            symbol: soldSym,
            totalBought: 0,
            totalSold: 0,
            totalInvestedEUR: 0,
            firstBuyDate: tx.timestamp,
            lastBuyDate: tx.timestamp,
            transactionCount: 0,
          };
        }
        assetMap[soldSym].totalSold += tx.spentAmount;
        assetMap[soldSym].transactionCount += 1;
        assetMap[soldSym].lastBuyDate = tx.timestamp;
      }
      continue;
    }

    if (!assetMap[symbol]) {
      assetMap[symbol] = {
        symbol,
        totalBought: 0,
        totalSold: 0,
        totalInvestedEUR: 0,
        firstBuyDate: tx.timestamp,
        lastBuyDate: tx.timestamp,
        transactionCount: 0,
      };
    }

    const item = assetMap[symbol];
    item.transactionCount += 1;
    item.lastBuyDate = tx.timestamp;
    if (!item.firstBuyDate) item.firstBuyDate = tx.timestamp;

    if (tx.type === 'BUY') {
      item.totalBought += tx.receivedAmount;
      let spentEUR = 0;
      if (tx.spentCurrency.toUpperCase() === 'EUR') {
        spentEUR = tx.spentAmount;
      } else if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0 && tx.receivedAmount > 0) {
        spentEUR = tx.pricePerUnitEUR * tx.receivedAmount;
      } else if (tx.nativeCurrency?.toUpperCase() === 'EUR' && tx.nativeAmount) {
        spentEUR = tx.nativeAmount;
      } else if (tx.spentCurrency.toUpperCase() === 'USD') {
        spentEUR = tx.spentAmount / 1.08;
      } else {
        spentEUR = tx.spentAmount;
      }
      item.totalInvestedEUR += spentEUR;
    } else if (tx.type === 'REWARD' || tx.type === 'STAKE') {
      item.totalBought += tx.receivedAmount;
    } else if (tx.type === 'SELL') {
      item.totalSold += tx.spentAmount > 0 ? tx.spentAmount : tx.receivedAmount;
    } else if (tx.type === 'TRANSFER') {
      item.totalBought += tx.receivedAmount;
    }
  }

  let totalPortfolioInvestedEUR = 0;
  let totalPortfolioCurrentValueEUR = 0;

  const rawAssets: Omit<AssetSummary, 'allocationPercentage'>[] = Object.values(assetMap).map(item => {
    const currentBalance = Math.max(0, item.totalBought - item.totalSold);
    const averageBuyPriceEUR = item.totalBought > 0 ? item.totalInvestedEUR / item.totalBought : 0;
    const currentPriceEUR = getCoinPriceEUR(item.symbol, customPrices);
    const currentValueEUR = currentBalance * currentPriceEUR;
    const pnlEUR = currentValueEUR - item.totalInvestedEUR;
    const pnlPercentage = item.totalInvestedEUR > 0 ? (pnlEUR / item.totalInvestedEUR) * 100 : 0;

    totalPortfolioInvestedEUR += item.totalInvestedEUR;
    totalPortfolioCurrentValueEUR += currentValueEUR;

    const details = getCoinDetails(item.symbol);

    return {
      symbol: item.symbol,
      name: details.name,
      totalBought: item.totalBought,
      totalSold: item.totalSold,
      currentBalance,
      totalInvestedEUR: item.totalInvestedEUR,
      averageBuyPriceEUR,
      currentPriceEUR,
      currentValueEUR,
      pnlEUR,
      pnlPercentage,
      firstBuyDate: item.firstBuyDate,
      lastBuyDate: item.lastBuyDate,
      transactionCount: item.transactionCount,
    };
  });

  // Calculate allocation percentage
  const assets: AssetSummary[] = rawAssets
    .map(a => ({
      ...a,
      allocationPercentage: totalPortfolioCurrentValueEUR > 0 ? (a.currentValueEUR / totalPortfolioCurrentValueEUR) * 100 : 0,
    }))
    .sort((a, b) => b.currentValueEUR - a.currentValueEUR);

  const totalPnlEUR = totalPortfolioCurrentValueEUR - totalPortfolioInvestedEUR;
  const totalPnlPercentage = totalPortfolioInvestedEUR > 0 ? (totalPnlEUR / totalPortfolioInvestedEUR) * 100 : 0;

  const topAsset = assets[0];

  const totals: PortfolioTotals = {
    totalInvestedEUR: totalPortfolioInvestedEUR,
    currentValueEUR: totalPortfolioCurrentValueEUR,
    totalPnlEUR,
    totalPnlPercentage,
    assetCount: assets.filter(a => a.currentBalance > 0 || a.totalInvestedEUR > 0).length,
    transactionCount: transactions.length,
    topAssetSymbol: topAsset ? topAsset.symbol : '-',
    topAssetPercentage: topAsset ? topAsset.allocationPercentage : 0,
  };

  return { assets, totals };
}

export interface TimelineDataPoint {
  date: string;
  formattedDate: string;
  investedCumEUR: number;
  addedEUR: number;
  description: string;
  asset: string;
}

export function generateInvestmentTimeline(transactions: Transaction[]): TimelineDataPoint[] {
  const buys = transactions
    .filter(t => t.type === 'BUY' && t.spentAmount > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let cumulative = 0;
  const points: TimelineDataPoint[] = [];

  for (const buy of buys) {
    const eur = buy.spentCurrency.toUpperCase() === 'EUR' ? buy.spentAmount : (buy.nativeCurrency === 'EUR' ? buy.nativeAmount || 0 : buy.spentAmount);
    cumulative += eur;
    const d = new Date(buy.timestamp);
    const formattedDate = isNaN(d.getTime()) ? buy.timestamp.substring(0, 10) : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' });
    points.push({
      date: buy.timestamp,
      formattedDate,
      investedCumEUR: cumulative,
      addedEUR: eur,
      description: buy.description,
      asset: buy.receivedCurrency,
    });
  }

  return points;
}

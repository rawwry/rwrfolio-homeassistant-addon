import { Transaction, AssetSummary, PortfolioTotals, PortfolioCurrency } from '../types';
import { getCoinPriceEUR, getCoinPriceUSD, getCoinPrice, getCoinDetails, getLiveEurUsdRate } from './priceService';

export function calculateAssetSummaries(
  transactions: Transaction[],
  customPrices: Record<string, number> = {},
  currency: PortfolioCurrency = 'EUR'
): { assets: AssetSummary[]; totals: PortfolioTotals } {
  const eurUsdRate = getLiveEurUsdRate();
  const currencySymbol = currency === 'USD' ? '$' : '€';

  const assetMap: Record<string, {
    symbol: string;
    totalBought: number;
    totalSold: number;
    totalInvestedEUR: number;
    totalInvestedUSD: number;
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
      // If selling to EUR/USD, handle the sold asset
      if (tx.type === 'SELL' && tx.spentCurrency && tx.spentCurrency !== 'EUR' && tx.spentCurrency !== 'USD') {
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
            totalInvestedUSD: 0,
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
        totalInvestedUSD: 0,
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

      // 1. Precise EUR spent calculation
      let spentEUR = 0;
      if (tx.spentCurrency.toUpperCase() === 'EUR') {
        spentEUR = tx.spentAmount;
      } else if (tx.nativeCurrency?.toUpperCase() === 'EUR' && tx.nativeAmount && tx.nativeAmount > 0) {
        spentEUR = tx.nativeAmount;
      } else if (tx.pricePerUnitEUR && tx.pricePerUnitEUR > 0 && tx.receivedAmount > 0) {
        spentEUR = tx.pricePerUnitEUR * tx.receivedAmount;
      } else if (tx.nativeAmountUSD && tx.nativeAmountUSD > 0) {
        // If native USD is present and spent is not EUR, convert via tx rate or live rate
        spentEUR = tx.nativeAmountUSD / eurUsdRate;
      } else if (tx.spentCurrency.toUpperCase() === 'USD') {
        spentEUR = tx.spentAmount / eurUsdRate;
      } else {
        spentEUR = tx.spentAmount;
      }

      // 2. Precise USD spent calculation (Matches Crypto.com native USD accounting!)
      let spentUSD = 0;
      if (tx.nativeAmountUSD && tx.nativeAmountUSD > 0) {
        spentUSD = tx.nativeAmountUSD;
      } else if (tx.nativeCurrency?.toUpperCase() === 'USD' && tx.nativeAmount && tx.nativeAmount > 0) {
        spentUSD = tx.nativeAmount;
      } else if (tx.spentCurrency.toUpperCase() === 'USD') {
        spentUSD = tx.spentAmount;
      } else if (tx.pricePerUnitUSD && tx.pricePerUnitUSD > 0 && tx.receivedAmount > 0) {
        spentUSD = tx.pricePerUnitUSD * tx.receivedAmount;
      } else if (tx.spentCurrency.toUpperCase() === 'EUR') {
        spentUSD = tx.spentAmount * eurUsdRate;
      } else {
        spentUSD = spentEUR * eurUsdRate;
      }

      item.totalInvestedEUR += spentEUR;
      item.totalInvestedUSD += spentUSD;
    } else if (tx.type === 'REWARD' || tx.type === 'STAKE') {
      item.totalBought += tx.receivedAmount;
    } else if (tx.type === 'SELL') {
      item.totalSold += tx.spentAmount > 0 ? tx.spentAmount : tx.receivedAmount;
    } else if (tx.type === 'TRANSFER') {
      item.totalBought += tx.receivedAmount;
    }
  }

  let totalPortfolioInvested = 0;
  let totalPortfolioCurrentValue = 0;

  let totalPortfolioInvestedEUR = 0;
  let totalPortfolioCurrentValueEUR = 0;

  const rawAssets = Object.values(assetMap).map(item => {
    const currentBalance = Math.max(0, item.totalBought - item.totalSold);

    // Active currency metrics
    const totalInvested = currency === 'USD' ? item.totalInvestedUSD : item.totalInvestedEUR;
    const averageBuyPrice = item.totalBought > 0 ? totalInvested / item.totalBought : 0;
    const currentPrice = getCoinPrice(item.symbol, currency, customPrices);
    const currentValue = currentBalance * currentPrice;

    // Cost basis of current open holdings
    const openCostBasis = item.totalBought > 0 && currentBalance < item.totalBought
      ? currentBalance * averageBuyPrice
      : totalInvested;

    const pnl = currentValue - openCostBasis;
    const pnlPercentage = openCostBasis > 0 ? (pnl / openCostBasis) * 100 : 0;

    // EUR specific metrics
    const averageBuyPriceEUR = item.totalBought > 0 ? item.totalInvestedEUR / item.totalBought : 0;
    const currentPriceEUR = getCoinPriceEUR(item.symbol, customPrices);
    const currentValueEUR = currentBalance * currentPriceEUR;
    const openCostBasisEUR = item.totalBought > 0 && currentBalance < item.totalBought
      ? currentBalance * averageBuyPriceEUR
      : item.totalInvestedEUR;
    const pnlEUR = currentValueEUR - openCostBasisEUR;

    // USD specific metrics
    const averageBuyPriceUSD = item.totalBought > 0 ? item.totalInvestedUSD / item.totalBought : 0;
    const currentPriceUSD = getCoinPriceUSD(item.symbol, customPrices);
    const currentValueUSD = currentBalance * currentPriceUSD;
    const openCostBasisUSD = item.totalBought > 0 && currentBalance < item.totalBought
      ? currentBalance * averageBuyPriceUSD
      : item.totalInvestedUSD;
    const pnlUSD = currentValueUSD - openCostBasisUSD;

    totalPortfolioInvested += totalInvested;
    totalPortfolioCurrentValue += currentValue;

    totalPortfolioInvestedEUR += item.totalInvestedEUR;
    totalPortfolioCurrentValueEUR += currentValueEUR;

    const details = getCoinDetails(item.symbol);

    return {
      symbol: item.symbol,
      name: details.name,
      totalBought: item.totalBought,
      totalSold: item.totalSold,
      currentBalance,
      currency,
      currencySymbol,
      totalInvested,
      averageBuyPrice,
      currentPrice,
      currentValue,
      pnl,
      pnlPercentage,
      totalInvestedEUR: item.totalInvestedEUR,
      averageBuyPriceEUR,
      currentPriceEUR,
      currentValueEUR,
      pnlEUR,
      totalInvestedUSD: item.totalInvestedUSD,
      averageBuyPriceUSD,
      currentPriceUSD,
      currentValueUSD,
      pnlUSD,
      firstBuyDate: item.firstBuyDate,
      lastBuyDate: item.lastBuyDate,
      transactionCount: item.transactionCount,
    };
  });

  // Calculate allocation percentage based on active current value
  const assets: AssetSummary[] = rawAssets
    .map(a => ({
      ...a,
      allocationPercentage: totalPortfolioCurrentValue > 0 ? (a.currentValue / totalPortfolioCurrentValue) * 100 : 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue);

  const totalPnl = totalPortfolioCurrentValue - totalPortfolioInvested;
  const totalPnlPercentage = totalPortfolioInvested > 0 ? (totalPnl / totalPortfolioInvested) * 100 : 0;

  const totalPnlEUR = totalPortfolioCurrentValueEUR - totalPortfolioInvestedEUR;
  const totalPnlPercentageEUR = totalPortfolioInvestedEUR > 0 ? (totalPnlEUR / totalPortfolioInvestedEUR) * 100 : 0;

  const topAsset = assets[0];

  const totals: PortfolioTotals = {
    currency,
    currencySymbol,
    totalInvested: totalPortfolioInvested,
    currentValue: totalPortfolioCurrentValue,
    totalPnl,
    totalPnlPercentage,
    eurUsdRate,
    totalInvestedEUR: totalPortfolioInvestedEUR,
    currentValueEUR: totalPortfolioCurrentValueEUR,
    totalPnlEUR,
    totalPnlPercentageEUR,
    assetCount: assets.filter(a => a.currentBalance > 0 || a.totalInvested > 0).length,
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
  investedCumUSD: number;
  addedUSD: number;
  investedCum: number;
  added: number;
  currencySymbol: string;
  description: string;
  asset: string;
}

export function generateInvestmentTimeline(
  transactions: Transaction[],
  currency: PortfolioCurrency = 'EUR'
): TimelineDataPoint[] {
  const eurUsdRate = getLiveEurUsdRate();
  const currencySymbol = currency === 'USD' ? '$' : '€';

  const buys = transactions
    .filter(t => t.type === 'BUY' && t.spentAmount > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  let cumulativeEUR = 0;
  let cumulativeUSD = 0;
  const points: TimelineDataPoint[] = [];

  for (const buy of buys) {
    let eur = 0;
    let usd = 0;

    if (buy.spentCurrency.toUpperCase() === 'EUR') {
      eur = buy.spentAmount;
      usd = buy.nativeAmountUSD || (buy.spentAmount * eurUsdRate);
    } else if (buy.spentCurrency.toUpperCase() === 'USD') {
      usd = buy.spentAmount;
      eur = buy.spentAmount / eurUsdRate;
    } else if (buy.nativeCurrency === 'EUR' && buy.nativeAmount) {
      eur = buy.nativeAmount;
      usd = eur * eurUsdRate;
    } else if (buy.nativeAmountUSD) {
      usd = buy.nativeAmountUSD;
      eur = usd / eurUsdRate;
    } else {
      eur = buy.spentAmount;
      usd = eur * eurUsdRate;
    }

    cumulativeEUR += eur;
    cumulativeUSD += usd;

    const added = currency === 'USD' ? usd : eur;
    const cumulative = currency === 'USD' ? cumulativeUSD : cumulativeEUR;

    const d = new Date(buy.timestamp);
    const formattedDate = isNaN(d.getTime())
      ? buy.timestamp.substring(0, 10)
      : d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' });

    points.push({
      date: buy.timestamp,
      formattedDate,
      investedCumEUR: cumulativeEUR,
      addedEUR: eur,
      investedCumUSD: cumulativeUSD,
      addedUSD: usd,
      investedCum: cumulative,
      added,
      currencySymbol,
      description: buy.description,
      asset: buy.receivedCurrency,
    });
  }

  return points;
}

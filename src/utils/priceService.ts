// Service for crypto price retrieval, symbol mapping, and multi-source market data
// Supports EUR and USD with accurate live EUR/USD exchange rate conversion

import { PortfolioCurrency } from '../types';

export interface CoinInfo {
  id: string;
  name: string;
  symbol: string;
  defaultPriceEUR: number;
  defaultPriceUSD: number;
  color: string;
}

export const KNOWN_COINS: Record<string, CoinInfo> = {
  BTC: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', defaultPriceEUR: 66450, defaultPriceUSD: 77000, color: '#f7931a' },
  ETH: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', defaultPriceEUR: 2050, defaultPriceUSD: 2380, color: '#627eea' },
  HBAR: { id: 'hedera-hashgraph', name: 'Hedera', symbol: 'HBAR', defaultPriceEUR: 0.064, defaultPriceUSD: 0.074, color: '#00aa9e' },
  AKT: { id: 'akash-network', name: 'Akash Network', symbol: 'AKT', defaultPriceEUR: 0.43, defaultPriceUSD: 0.50, color: '#f44336' },
  DOT: { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', defaultPriceEUR: 0.74, defaultPriceUSD: 0.86, color: '#e6007a' },
  SOL: { id: 'solana', name: 'Solana', symbol: 'SOL', defaultPriceEUR: 135, defaultPriceUSD: 156, color: '#14f195' },
  CRO: { id: 'crypto-com-chain', name: 'Cronos', symbol: 'CRO', defaultPriceEUR: 0.082, defaultPriceUSD: 0.095, color: '#002d74' },
  ADA: { id: 'cardano', name: 'Cardano', symbol: 'ADA', defaultPriceEUR: 0.35, defaultPriceUSD: 0.41, color: '#0033ad' },
  XRP: { id: 'ripple', name: 'XRP', symbol: 'XRP', defaultPriceEUR: 0.52, defaultPriceUSD: 0.60, color: '#23292f' },
  AVAX: { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', defaultPriceEUR: 24.50, defaultPriceUSD: 28.40, color: '#e84142' },
  LINK: { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', defaultPriceEUR: 11.20, defaultPriceUSD: 13.00, color: '#375bd2' },
  NEAR: { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', defaultPriceEUR: 4.10, defaultPriceUSD: 4.75, color: '#000000' },
  MATIC: { id: 'polygon-ecosystem-token', name: 'Polygon', symbol: 'POL', defaultPriceEUR: 0.0809, defaultPriceUSD: 0.09379, color: '#8247e5' },
  POL: { id: 'polygon-ecosystem-token', name: 'Polygon Ecosystem Token', symbol: 'POL', defaultPriceEUR: 0.0809, defaultPriceUSD: 0.09379, color: '#8247e5' },
  POLYGON: { id: 'polygon-ecosystem-token', name: 'Polygon', symbol: 'POL', defaultPriceEUR: 0.0809, defaultPriceUSD: 0.09379, color: '#8247e5' },
  BNB: { id: 'binancecoin', name: 'BNB', symbol: 'BNB', defaultPriceEUR: 540, defaultPriceUSD: 625, color: '#f3ba2f' },
  SUI: { id: 'sui', name: 'Sui', symbol: 'SUI', defaultPriceEUR: 1.80, defaultPriceUSD: 2.08, color: '#4da2ff' },
  KAS: { id: 'kaspa', name: 'Kaspa', symbol: 'KAS', defaultPriceEUR: 0.16, defaultPriceUSD: 0.185, color: '#70c7ba' },
  FET: { id: 'artificial-superintelligence-alliance', name: 'Artificial Superintelligence Alliance', symbol: 'FET', defaultPriceEUR: 1.25, defaultPriceUSD: 1.45, color: '#1d2a44' },
  TAO: { id: 'bittensor', name: 'Bittensor', symbol: 'TAO', defaultPriceEUR: 310, defaultPriceUSD: 360, color: '#2b2b2b' },
  RNDR: { id: 'render-token', name: 'Render', symbol: 'RNDR', defaultPriceEUR: 5.20, defaultPriceUSD: 6.00, color: '#e51d24' },
  RENDER: { id: 'render-token', name: 'Render', symbol: 'RENDER', defaultPriceEUR: 5.20, defaultPriceUSD: 6.00, color: '#e51d24' },
  DOGE: { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', defaultPriceEUR: 0.11, defaultPriceUSD: 0.127, color: '#c2a633' },
  SHIB: { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', defaultPriceEUR: 0.000015, defaultPriceUSD: 0.000017, color: '#ffa409' },
  ATOM: { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', defaultPriceEUR: 4.50, defaultPriceUSD: 5.20, color: '#2e3148' },
  USDT: { id: 'tether', name: 'Tether USD', symbol: 'USDT', defaultPriceEUR: 0.863, defaultPriceUSD: 1.00, color: '#26a17b' },
  USDC: { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', defaultPriceEUR: 0.863, defaultPriceUSD: 1.00, color: '#2775ca' },
};

const STORAGE_PRICE_KEY = 'crypto_tracker_custom_prices';
const STORAGE_LAST_UPDATE_KEY = 'rwrfolio_prices_last_updated';
const STORAGE_EUR_USD_KEY = 'rwrfolio_eur_usd_rate';

// Global cache of latest EUR/USD exchange rate (1 EUR = X USD)
let currentEurUsdRate = 1.1591;

export function getLiveEurUsdRate(): number {
  try {
    const saved = localStorage.getItem(STORAGE_EUR_USD_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (parsed > 0.5 && parsed < 2.0) {
        currentEurUsdRate = parsed;
      }
    }
  } catch {
    // ignore
  }
  return currentEurUsdRate;
}

export function setLiveEurUsdRate(rate: number): void {
  if (rate > 0.5 && rate < 2.0) {
    currentEurUsdRate = rate;
    try {
      localStorage.setItem(STORAGE_EUR_USD_KEY, rate.toString());
    } catch {
      // ignore
    }
  }
}

export function getStoredCustomPrices(): Record<string, number> {
  try {
    const data = localStorage.getItem(STORAGE_PRICE_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    // Sanitize old frozen MATIC contract (~0.34-0.38)
    if (parsed.MATIC && parsed.MATIC > 0.25) {
      delete parsed.MATIC;
    }
    if (parsed.POLYGON && parsed.POLYGON > 0.25) {
      delete parsed.POLYGON;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to read stored prices', e);
    return {};
  }
}

export function saveStoredCustomPrice(symbol: string, priceEUR: number): void {
  try {
    const existing = getStoredCustomPrices();
    const sym = symbol.toUpperCase();
    existing[sym] = priceEUR;
    if (sym === 'POL') {
      existing.MATIC = priceEUR;
      existing.POLYGON = priceEUR;
    } else if (sym === 'MATIC') {
      existing.POL = priceEUR;
      existing.POLYGON = priceEUR;
    }
    localStorage.setItem(STORAGE_PRICE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save price', e);
  }
}

export function getLastPriceUpdateTime(): string | null {
  try {
    return localStorage.getItem(STORAGE_LAST_UPDATE_KEY);
  } catch {
    return null;
  }
}

export function setLastPriceUpdateTime(): void {
  try {
    localStorage.setItem(STORAGE_LAST_UPDATE_KEY, new Date().toISOString());
  } catch {
    // Ignore
  }
}

/**
 * Get coin price in specified currency ('EUR' | 'USD')
 */
export function getCoinPrice(
  symbol: string,
  currency: PortfolioCurrency = 'EUR',
  customPrices: Record<string, number> = {}
): number {
  const priceEUR = getCoinPriceEUR(symbol, customPrices);
  if (currency === 'EUR') {
    return priceEUR;
  }
  const rate = getLiveEurUsdRate();
  return priceEUR * rate;
}

export function getCoinPriceEUR(symbol: string, customPrices: Record<string, number> = {}): number {
  let sym = symbol.toUpperCase();
  if (sym === 'MATIC' || sym === 'POLYGON') sym = 'POL';

  if (customPrices[sym] !== undefined && customPrices[sym] > 0) {
    return customPrices[sym];
  }
  const stored = getStoredCustomPrices();
  if (stored[sym] !== undefined && stored[sym] > 0) {
    return stored[sym];
  }
  if (KNOWN_COINS[sym]) {
    return KNOWN_COINS[sym].defaultPriceEUR;
  }
  return 0;
}

export function getCoinPriceUSD(symbol: string, customPrices: Record<string, number> = {}): number {
  const priceEUR = getCoinPriceEUR(symbol, customPrices);
  const rate = getLiveEurUsdRate();
  return priceEUR * rate;
}

export function getCoinDetails(symbol: string): { name: string; color: string } {
  let sym = symbol.toUpperCase();
  if (sym === 'MATIC' || sym === 'POLYGON') sym = 'POL';

  if (KNOWN_COINS[sym]) {
    return { name: KNOWN_COINS[sym].name, color: KNOWN_COINS[sym].color };
  }
  // Generate consistent color hash for unknown coin
  let hash = 0;
  for (let i = 0; i < sym.length; i++) {
    hash = sym.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  const color = '#' + '00000'.substring(0, 6 - c.length) + c;
  return { name: sym, color };
}

/**
 * Fetch real-time market prices with multi-source fallback:
 * 1. Binance Direct (Liquid spot markets + live EUR/USDT exchange rate)
 * 2. Crypto.com Public Tickers (Exact Crypto.com reference prices for POL, AKT, HBAR, etc.)
 * 3. CoinGecko API (fallback for any remaining altcoins)
 */
export async function fetchLivePrices(symbols: string[]): Promise<Record<string, number>> {
  const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase()))).filter(s => s !== 'EUR');
  if (uniqueSymbols.length === 0) return {};

  const results: Record<string, number> = {};
  let eurUsdt = getLiveEurUsdRate();

  // 1. Fetch live EUR/USD rate & prices from Binance Public API
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price');
    if (res.ok) {
      const data: Array<{ symbol: string; price: string }> = await res.json();
      const tickerMap = new Map<string, number>();
      for (const item of data) {
        tickerMap.set(item.symbol, parseFloat(item.price));
      }

      if (tickerMap.has('EURUSDT')) {
        eurUsdt = tickerMap.get('EURUSDT')!;
        setLiveEurUsdRate(eurUsdt);
      }

      // Live Polygon (POL) liquid market price calculation:
      // High-volume POLUSDT pair gives accurate world market price
      let livePolPriceEUR: number | null = null;
      if (tickerMap.has('POLUSDT')) {
        livePolPriceEUR = tickerMap.get('POLUSDT')! / eurUsdt;
      } else if (tickerMap.has('POLEUR')) {
        livePolPriceEUR = tickerMap.get('POLEUR')!;
      }

      for (const sym of uniqueSymbols) {
        if (sym === 'USDT') {
          const price = 1 / eurUsdt;
          results[sym] = price;
          saveStoredCustomPrice(sym, price);
        } else if (sym === 'USDC' && tickerMap.has('USDCUSDT')) {
          const price = (tickerMap.get('USDCUSDT') || 1) / eurUsdt;
          results[sym] = price;
          saveStoredCustomPrice(sym, price);
        } else if (sym === 'POL' || sym === 'MATIC' || sym === 'POLYGON') {
          if (livePolPriceEUR !== null && livePolPriceEUR > 0) {
            results[sym] = livePolPriceEUR;
            saveStoredCustomPrice(sym, livePolPriceEUR);
          }
        } else if (tickerMap.has(`${sym}USDT`)) {
          // USDT pairs have deep liquidity, convert to EUR using live EUR/USD rate
          const price = tickerMap.get(`${sym}USDT`)! / eurUsdt;
          results[sym] = price;
          saveStoredCustomPrice(sym, price);
        } else if (tickerMap.has(`${sym}EUR`)) {
          const price = tickerMap.get(`${sym}EUR`)!;
          results[sym] = price;
          saveStoredCustomPrice(sym, price);
        }
      }
    }
  } catch (err) {
    console.warn('Binance price fetch notice, proceeding with Crypto.com / CoinGecko', err);
  }

  // 2. Fetch from Crypto.com Public Ticker for Crypto.com assets (e.g. POL, AKT, HBAR, CRO)
  // This ensures 100% pricing alignment with the user's Crypto.com mobile app!
  const cdcCandidateSymbols = ['POL', 'AKT', 'HBAR', 'DOT', 'CRO', 'BTC', 'ETH'].filter(s => uniqueSymbols.includes(s));
  for (const sym of cdcCandidateSymbols) {
    try {
      const cdcRes = await fetch(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${sym}_USDT`);
      if (cdcRes.ok) {
        const cdcData = await cdcRes.json();
        const priceUSDStr = cdcData.result?.data?.[0]?.a || cdcData.result?.data?.[0]?.b;
        if (priceUSDStr) {
          const priceUSD = parseFloat(priceUSDStr);
          if (priceUSD > 0) {
            const priceEUR = priceUSD / eurUsdt;
            results[sym] = priceEUR;
            saveStoredCustomPrice(sym, priceEUR);
            if (sym === 'POL') {
              results.MATIC = priceEUR;
              results.POLYGON = priceEUR;
              saveStoredCustomPrice('MATIC', priceEUR);
              saveStoredCustomPrice('POLYGON', priceEUR);
            }
          }
        }
      }
    } catch {
      // Ignore individual ticker error and fall back
    }
  }

  // Synchronize POL, MATIC, POLYGON
  const finalPolPrice = results.POL || results.MATIC || results.POLYGON;
  if (finalPolPrice && finalPolPrice > 0) {
    results.POL = finalPolPrice;
    results.MATIC = finalPolPrice;
    results.POLYGON = finalPolPrice;
    saveStoredCustomPrice('POL', finalPolPrice);
    saveStoredCustomPrice('MATIC', finalPolPrice);
    saveStoredCustomPrice('POLYGON', finalPolPrice);
  }

  // 3. CoinGecko API fallback for any still missing coins (e.g. niche tokens)
  const missingSymbols = uniqueSymbols.filter(s => !results[s]);
  if (missingSymbols.length > 0) {
    try {
      const geckoIds = Array.from(new Set(
        missingSymbols
          .map(s => KNOWN_COINS[s]?.id)
          .filter(Boolean)
      )) as string[];

      if (geckoIds.length > 0) {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds.join(',')}&vs_currencies=eur,usd`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          for (const sym of missingSymbols) {
            const id = KNOWN_COINS[sym]?.id;
            if (id && data[id]?.eur && data[id].eur > 0) {
              const price = data[id].eur;
              results[sym] = price;
              saveStoredCustomPrice(sym, price);
            }
          }
        }
      }
    } catch (err) {
      console.warn('CoinGecko fallback fetch notice', err);
    }
  }

  // 4. Fallback for any still missing symbols to default prices
  for (const sym of uniqueSymbols) {
    if (!results[sym] && KNOWN_COINS[sym]?.defaultPriceEUR) {
      results[sym] = KNOWN_COINS[sym].defaultPriceEUR;
    }
  }

  if (Object.keys(results).length > 0) {
    setLastPriceUpdateTime();
  }

  return results;
}

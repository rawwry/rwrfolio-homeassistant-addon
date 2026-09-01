// Service for crypto price retrieval, symbol mapping, and live market data

export interface CoinInfo {
  id: string;
  name: string;
  symbol: string;
  defaultPriceEUR: number;
  color: string;
}

export const KNOWN_COINS: Record<string, CoinInfo> = {
  BTC: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', defaultPriceEUR: 62500, color: '#f7931a' },
  ETH: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', defaultPriceEUR: 2850, color: '#627eea' },
  HBAR: { id: 'hedera-hashgraph', name: 'Hedera', symbol: 'HBAR', defaultPriceEUR: 0.085, color: '#00aa9e' },
  AKT: { id: 'akash-network', name: 'Akash Network', symbol: 'AKT', defaultPriceEUR: 3.45, color: '#f44336' },
  DOT: { id: 'polkadot', name: 'Polkadot', symbol: 'DOT', defaultPriceEUR: 5.80, color: '#e6007a' },
  SOL: { id: 'solana', name: 'Solana', symbol: 'SOL', defaultPriceEUR: 145, color: '#14f195' },
  CRO: { id: 'crypto-com-chain', name: 'Cronos', symbol: 'CRO', defaultPriceEUR: 0.095, color: '#002d74' },
  ADA: { id: 'cardano', name: 'Cardano', symbol: 'ADA', defaultPriceEUR: 0.42, color: '#0033ad' },
  XRP: { id: 'ripple', name: 'XRP', symbol: 'XRP', defaultPriceEUR: 0.58, color: '#23292f' },
  AVAX: { id: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX', defaultPriceEUR: 27.50, color: '#e84142' },
  LINK: { id: 'chainlink', name: 'Chainlink', symbol: 'LINK', defaultPriceEUR: 12.80, color: '#375bd2' },
  NEAR: { id: 'near', name: 'NEAR Protocol', symbol: 'NEAR', defaultPriceEUR: 4.60, color: '#000000' },
  MATIC: { id: 'matic-network', name: 'Polygon', symbol: 'MATIC', defaultPriceEUR: 0.48, color: '#8247e5' },
  POL: { id: 'matic-network', name: 'Polygon Ecosystem Token', symbol: 'POL', defaultPriceEUR: 0.48, color: '#8247e5' },
  BNB: { id: 'binancecoin', name: 'BNB', symbol: 'BNB', defaultPriceEUR: 540, color: '#f3ba2f' },
  SUI: { id: 'sui', name: 'Sui', symbol: 'SUI', defaultPriceEUR: 1.80, color: '#4da2ff' },
  KAS: { id: 'kaspa', name: 'Kaspa', symbol: 'KAS', defaultPriceEUR: 0.16, color: '#70c7ba' },
  FET: { id: 'artificial-superintelligence-alliance', name: 'Artificial Superintelligence Alliance', symbol: 'FET', defaultPriceEUR: 1.35, color: '#1d2a44' },
  TAO: { id: 'bittensor', name: 'Bittensor', symbol: 'TAO', defaultPriceEUR: 320, color: '#2b2b2b' },
  RNDR: { id: 'render-token', name: 'Render', symbol: 'RNDR', defaultPriceEUR: 5.60, color: '#e51d24' },
  RENDER: { id: 'render-token', name: 'Render', symbol: 'RENDER', defaultPriceEUR: 5.60, color: '#e51d24' },
  DOGE: { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', defaultPriceEUR: 0.11, color: '#c2a633' },
  SHIB: { id: 'shiba-inu', name: 'Shiba Inu', symbol: 'SHIB', defaultPriceEUR: 0.000015, color: '#ffa409' },
  ATOM: { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', defaultPriceEUR: 4.80, color: '#2e3148' },
  USDT: { id: 'tether', name: 'Tether USD', symbol: 'USDT', defaultPriceEUR: 0.92, color: '#26a17b' },
  USDC: { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', defaultPriceEUR: 0.92, color: '#2775ca' },
};

const STORAGE_PRICE_KEY = 'crypto_tracker_custom_prices';
const STORAGE_LAST_UPDATE_KEY = 'rwrfolio_prices_last_updated';

export function getStoredCustomPrices(): Record<string, number> {
  try {
    const data = localStorage.getItem(STORAGE_PRICE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to read stored prices', e);
    return {};
  }
}

export function saveStoredCustomPrice(symbol: string, priceEUR: number): void {
  try {
    const existing = getStoredCustomPrices();
    existing[symbol.toUpperCase()] = priceEUR;
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

export function getCoinPriceEUR(symbol: string, customPrices: Record<string, number> = {}): number {
  const sym = symbol.toUpperCase();
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

export function getCoinDetails(symbol: string): { name: string; color: string } {
  const sym = symbol.toUpperCase();
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
 * 1. Binance Direct (fast, highly available)
 * 2. CryptoCompare (multi-symbol batching)
 * 3. CoinGecko API
 */
export async function fetchLivePrices(symbols: string[]): Promise<Record<string, number>> {
  const uniqueSymbols = Array.from(new Set(symbols.map(s => s.toUpperCase()))).filter(s => s !== 'EUR');
  if (uniqueSymbols.length === 0) return {};

  const results: Record<string, number> = {};

  // 1. Try CryptoCompare (supports almost all tokens directly to EUR in one request)
  try {
    const fsyms = uniqueSymbols.join(',');
    const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=EUR`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      for (const sym of uniqueSymbols) {
        if (data[sym]?.EUR && typeof data[sym].EUR === 'number' && data[sym].EUR > 0) {
          results[sym] = data[sym].EUR;
          saveStoredCustomPrice(sym, data[sym].EUR);
        }
      }
    }
  } catch (err) {
    console.warn('CryptoCompare fetch failed, trying fallback sources', err);
  }

  // 2. For any remaining symbols, try CoinGecko
  const missingSymbols = uniqueSymbols.filter(s => !results[s]);
  if (missingSymbols.length > 0) {
    try {
      const geckoIds = missingSymbols
        .map(s => KNOWN_COINS[s]?.id)
        .filter(Boolean) as string[];

      if (geckoIds.length > 0) {
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds.join(',')}&vs_currencies=eur`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          for (const sym of missingSymbols) {
            const id = KNOWN_COINS[sym]?.id;
            if (id && data[id]?.eur && data[id].eur > 0) {
              results[sym] = data[id].eur;
              saveStoredCustomPrice(sym, data[id].eur);
            }
          }
        }
      }
    } catch (err) {
      console.warn('CoinGecko fetch failed', err);
    }
  }

  // 3. For any still missing, try Binance public ticker
  const stillMissing = uniqueSymbols.filter(s => !results[s]);
  if (stillMissing.length > 0) {
    try {
      // Get EURUSDT rate to convert USDT pairs if EUR pair not available
      let eurRate = 1.08;
      try {
        const eurUsdtRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT');
        if (eurUsdtRes.ok) {
          const d = await eurUsdtRes.json();
          eurRate = parseFloat(d.price) || 1.08;
        }
      } catch {
        // use fallback rate
      }

      await Promise.all(stillMissing.map(async (sym) => {
        try {
          // Try SYMBOLEUR first
          const eurPairRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}EUR`);
          if (eurPairRes.ok) {
            const d = await eurPairRes.json();
            const price = parseFloat(d.price);
            if (price > 0) {
              results[sym] = price;
              saveStoredCustomPrice(sym, price);
              return;
            }
          }
          // Try SYMBOLUSDT / eurRate
          const usdtPairRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`);
          if (usdtPairRes.ok) {
            const d = await usdtPairRes.json();
            const usdtPrice = parseFloat(d.price);
            if (usdtPrice > 0) {
              const eurPrice = usdtPrice / eurRate;
              results[sym] = eurPrice;
              saveStoredCustomPrice(sym, eurPrice);
            }
          }
        } catch {
          // Skip
        }
      }));
    } catch (err) {
      console.warn('Binance fallback ticker error', err);
    }
  }

  if (Object.keys(results).length > 0) {
    setLastPriceUpdateTime();
  }

  return results;
}

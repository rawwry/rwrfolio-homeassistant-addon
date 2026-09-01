import datetime
import urllib.request
import json
import sqlite3
from typing import Dict, List

DEFAULT_FALLBACK_PRICES = {
    "BTC": 88500.0,
    "ETH": 3350.0,
    "SOL": 180.0,
    "CRO": 0.128,
    "ADA": 0.78,
    "DOT": 8.10,
    "XRP": 2.25,
    "AVAX": 32.0,
    "LINK": 18.5,
    "DOGE": 0.22
}

COINGECKO_MAP = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "CRO": "crypto-com-chain",
    "SOL": "solana",
    "ADA": "cardano",
    "DOT": "polkadot",
    "XRP": "ripple",
    "DOGE": "dogecoin",
    "AVAX": "avalanche-2",
    "LINK": "chainlink",
    "MATIC": "matic-network",
    "POL": "polygon-ecosystem-token",
    "NEAR": "near",
    "SUI": "sui"
}

def update_live_prices(conn: sqlite3.Connection, symbols: List[str]) -> Dict[str, float]:
    """
    Fetches real-time EUR prices for symbols from public CoinGecko API,
    and persists them into the custom_prices SQLite table.
    """
    if not symbols:
        return {}

    clean_symbols = [s.upper() for s in symbols if s and s.upper() != "EUR"]
    gecko_ids = [COINGECKO_MAP[s] for s in clean_symbols if s in COINGECKO_MAP]
    
    updated = {}
    
    if gecko_ids:
        try:
            ids_str = ",".join(gecko_ids)
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={ids_str}&vs_currencies=eur"
            req = urllib.request.Request(
                url, 
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CryptoTracker/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    now_str = datetime.datetime.utcnow().isoformat()
                    cursor = conn.cursor()
                    for sym, g_id in COINGECKO_MAP.items():
                        if g_id in data and "eur" in data[g_id]:
                            price = float(data[g_id]["eur"])
                            updated[sym] = price
                            cursor.execute("""
                                INSERT INTO custom_prices (symbol, price_eur, source, updated_at)
                                VALUES (?, ?, 'coingecko', ?)
                                ON CONFLICT(symbol) DO UPDATE SET
                                    price_eur = excluded.price_eur,
                                    source = 'coingecko',
                                    updated_at = excluded.updated_at;
                            """, (sym, price, now_str))
                    conn.commit()
                    return updated
        except Exception as e:
            print(f"CoinGecko API price fetch error (falling back to database/default): {e}")

    # Fallback to defaults for missing coins
    now_str = datetime.datetime.utcnow().isoformat()
    cursor = conn.cursor()
    for sym in clean_symbols:
        if sym not in updated and sym in DEFAULT_FALLBACK_PRICES:
            price = DEFAULT_FALLBACK_PRICES[sym]
            updated[sym] = price
            cursor.execute("""
                INSERT OR IGNORE INTO custom_prices (symbol, price_eur, source, updated_at)
                VALUES (?, ?, 'default', ?);
            """, (sym, price, now_str))
    conn.commit()
    
    return updated

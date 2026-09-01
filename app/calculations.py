from typing import Dict, List, Any
import sqlite3

def get_portfolio_summary(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Computes portfolio holdings, DCA (Dollar/Euro Cost Average), current market values,
    and profit/loss using raw SQL queries and SQLite Row objects.
    """
    cursor = conn.cursor()

    # Load stored prices into a lookup dictionary
    cursor.execute("SELECT symbol, price_eur FROM custom_prices;")
    prices_map = {row["symbol"].upper(): float(row["price_eur"]) for row in cursor.fetchall()}

    # Group bought/received transactions by received_currency
    cursor.execute("""
        SELECT 
            received_currency AS symbol,
            SUM(received_amount) AS total_received,
            SUM(CASE WHEN spent_currency = 'EUR' THEN spent_amount ELSE 0.0 END) AS total_eur_invested,
            COUNT(*) AS tx_count,
            MIN(timestamp) AS first_buy,
            MAX(timestamp) AS last_buy
        FROM transactions
        WHERE received_currency IS NOT NULL AND received_currency != '' AND received_currency != 'EUR'
        GROUP BY received_currency;
    """)
    received_rows = {row["symbol"]: dict(row) for row in cursor.fetchall()}

    # Group sold/spent transactions by spent_currency
    cursor.execute("""
        SELECT 
            spent_currency AS symbol,
            SUM(spent_amount) AS total_spent,
            SUM(CASE WHEN received_currency = 'EUR' THEN received_amount ELSE 0.0 END) AS total_eur_proceeds
        FROM transactions
        WHERE spent_currency IS NOT NULL AND spent_currency != '' AND spent_currency != 'EUR'
        GROUP BY spent_currency;
    """)
    spent_rows = {row["symbol"]: dict(row) for row in cursor.fetchall()}

    # Combine all distinct coin symbols
    all_symbols = sorted(list(set(list(received_rows.keys()) + list(spent_rows.keys()))))
    
    asset_summaries = []
    total_portfolio_invested = 0.0
    total_portfolio_current_value = 0.0

    for sym in all_symbols:
        recv = received_rows.get(sym, {
            "total_received": 0.0,
            "total_eur_invested": 0.0,
            "tx_count": 0,
            "first_buy": "-",
            "last_buy": "-"
        })
        spnt = spent_rows.get(sym, {
            "total_spent": 0.0,
            "total_eur_proceeds": 0.0
        })

        total_bought = float(recv["total_received"] or 0.0)
        total_sold = float(spnt["total_spent"] or 0.0)
        current_balance = max(0.0, total_bought - total_sold)

        total_invested_eur = float(recv["total_eur_invested"] or 0.0)
        
        # Average Buy Price (DCA) in EUR per coin
        avg_buy_price = (total_invested_eur / total_bought) if total_bought > 0 else 0.0
        
        # Current price fallback
        current_price = prices_map.get(sym.upper(), avg_buy_price or 1.0)
        current_val_eur = current_balance * current_price
        
        # Profit / Loss calculation
        pnl_eur = current_val_eur - total_invested_eur
        pnl_percentage = ((pnl_eur / total_invested_eur) * 100.0) if total_invested_eur > 0 else 0.0

        total_portfolio_invested += total_invested_eur
        total_portfolio_current_value += current_val_eur

        asset_summaries.append({
            "symbol": sym,
            "name": get_coin_display_name(sym),
            "current_balance": current_balance,
            "total_bought": total_bought,
            "total_sold": total_sold,
            "total_invested_eur": total_invested_eur,
            "average_buy_price": avg_buy_price,
            "current_price": current_price,
            "current_value_eur": current_val_eur,
            "pnl_eur": pnl_eur,
            "pnl_percentage": pnl_percentage,
            "first_buy": recv["first_buy"][:10] if recv["first_buy"] and len(recv["first_buy"]) >= 10 else "-",
            "last_buy": recv["last_buy"][:10] if recv["last_buy"] and len(recv["last_buy"]) >= 10 else "-",
            "tx_count": recv["tx_count"]
        })

    # Compute allocation %
    for asset in asset_summaries:
        if total_portfolio_current_value > 0:
            asset["allocation_percentage"] = (asset["current_value_eur"] / total_portfolio_current_value) * 100.0
        else:
            asset["allocation_percentage"] = 0.0

    # Sort assets by current value descending
    asset_summaries.sort(key=lambda x: x["current_value_eur"], reverse=True)

    total_pnl_eur = total_portfolio_current_value - total_portfolio_invested
    total_pnl_percentage = ((total_pnl_eur / total_portfolio_invested) * 100.0) if total_portfolio_invested > 0 else 0.0

    # Overall totals
    cursor.execute("SELECT COUNT(*) AS count FROM transactions;")
    total_tx_count = cursor.fetchone()["count"]

    totals = {
        "total_invested_eur": total_portfolio_invested,
        "current_value_eur": total_portfolio_current_value,
        "total_pnl_eur": total_pnl_eur,
        "total_pnl_percentage": total_pnl_percentage,
        "asset_count": len([a for a in asset_summaries if a["current_balance"] > 0]),
        "total_tx_count": total_tx_count,
        "top_asset": asset_summaries[0]["symbol"] if asset_summaries else "None",
        "top_asset_share": asset_summaries[0]["allocation_percentage"] if asset_summaries else 0.0
    }

    return {
        "assets": asset_summaries,
        "totals": totals
    }

def get_coin_display_name(symbol: str) -> str:
    names = {
        "BTC": "Bitcoin",
        "ETH": "Ethereum",
        "CRO": "Cronos",
        "SOL": "Solana",
        "ADA": "Cardano",
        "DOT": "Polkadot",
        "XRP": "XRP",
        "DOGE": "Dogecoin",
        "AVAX": "Avalanche",
        "LINK": "Chainlink",
        "MATIC": "Polygon (MATIC)",
        "POL": "Polygon (POL)",
        "NEAR": "NEAR Protocol",
        "SUI": "Sui",
        "PEPE": "Pepe",
        "SHIB": "Shiba Inu",
        "EUR": "Euro"
    }
    return names.get(symbol.upper(), symbol.upper())

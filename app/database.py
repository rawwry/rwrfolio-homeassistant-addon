import sqlite3
import os
from contextlib import contextmanager

DATABASE_PATH = os.getenv("DATABASE_PATH", "/config/crypto.db")

def get_connection():
    # Ensure directory exists
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    conn = sqlite3.connect(DATABASE_PATH, timeout=20.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # SQLite Performance & Concurrency Pragmas
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout=5000;")
    
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Transactions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'crypto_com',
                type TEXT NOT NULL,
                description TEXT,
                spent_currency TEXT,
                spent_amount REAL DEFAULT 0.0,
                received_currency TEXT,
                received_amount REAL DEFAULT 0.0,
                price_per_unit_eur REAL DEFAULT 0.0,
                native_currency TEXT,
                native_amount REAL DEFAULT 0.0,
                transaction_kind TEXT,
                fee REAL DEFAULT 0.0,
                fee_currency TEXT,
                notes TEXT,
                imported_at TEXT NOT NULL
            );
        """)
        
        # Indices for rapid querying & grouping
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON transactions(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_received_currency ON transactions(received_currency);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_spent_currency ON transactions(spent_currency);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);")

        # Custom / Cached Prices Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS custom_prices (
                symbol TEXT PRIMARY KEY,
                price_eur REAL NOT NULL,
                source TEXT DEFAULT 'manual',
                updated_at TEXT NOT NULL
            );
        """)

        # App Settings Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # Insert default sample data if table is empty
        cursor.execute("SELECT COUNT(*) as count FROM transactions;")
        row = cursor.fetchone()
        if row and row["count"] == 0:
            insert_sample_transactions(conn)

def insert_sample_transactions(conn):
    sample_data = [
        ("tx_1", "2024-01-15T10:30:00Z", "crypto_com", "BUY", "Buy BTC", "EUR", 150.0, "BTC", 0.0035, 42857.14, "EUR", 150.0, "crypto_purchase", 0.0, "EUR", "Crypto.com Kauf via Kreditkarte", "2024-01-15T10:30:00Z"),
        ("tx_2", "2024-02-01T14:15:00Z", "crypto_com", "BUY", "Buy BTC", "EUR", 200.0, "BTC", 0.0042, 47619.05, "EUR", 200.0, "crypto_purchase", 0.0, "EUR", "Monatlicher Sparplan", "2024-02-01T14:15:00Z"),
        ("tx_3", "2024-02-10T09:00:00Z", "crypto_com", "BUY", "Buy ETH", "EUR", 300.0, "ETH", 0.125, 2400.0, "EUR", 300.0, "crypto_purchase", 0.0, "EUR", "Crypto.com App", "2024-02-10T09:00:00Z"),
        ("tx_4", "2024-02-18T18:20:00Z", "crypto_com", "REWARD", "Card Cashback (CRO)", "", 0.0, "CRO", 85.5, 0.085, "EUR", 7.27, "card_cashback", 0.0, "", "Crypto.com Visa Cashback", "2024-02-18T18:20:00Z"),
        ("tx_5", "2024-03-01T12:00:00Z", "crypto_com", "BUY", "Buy SOL", "EUR", 100.0, "SOL", 0.85, 117.65, "EUR", 100.0, "crypto_purchase", 0.0, "EUR", "Kauf via Fiat Wallet", "2024-03-01T12:00:00Z"),
        ("tx_6", "2024-03-15T08:45:00Z", "crypto_com", "STAKE", "Crypto Earn Reward", "", 0.0, "CRO", 12.0, 0.092, "EUR", 1.10, "crypto_earn_reward", 0.0, "", "Wöchentlicher Staking Ertrag", "2024-03-15T08:45:00Z")
    ]
    cursor = conn.cursor()
    cursor.executemany("""
        INSERT INTO transactions (
            id, timestamp, source, type, description, spent_currency, spent_amount,
            received_currency, received_amount, price_per_unit_eur, native_currency,
            native_amount, transaction_kind, fee, fee_currency, notes, imported_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_data)

    # Initial default prices
    default_prices = [
        ("BTC", 85000.0, "default", "2024-03-15T12:00:00Z"),
        ("ETH", 3200.0, "default", "2024-03-15T12:00:00Z"),
        ("SOL", 175.0, "default", "2024-03-15T12:00:00Z"),
        ("CRO", 0.125, "default", "2024-03-15T12:00:00Z"),
        ("ADA", 0.75, "default", "2024-03-15T12:00:00Z"),
        ("DOT", 7.80, "default", "2024-03-15T12:00:00Z"),
        ("XRP", 2.20, "default", "2024-03-15T12:00:00Z")
    ]
    cursor.executemany("""
        INSERT OR IGNORE INTO custom_prices (symbol, price_eur, source, updated_at)
        VALUES (?, ?, ?, ?)
    """, default_prices)

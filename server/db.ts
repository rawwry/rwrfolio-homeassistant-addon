import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { Transaction, TransactionType } from '../src/types';
import { USER_SAMPLE_CRYPTO_COM_CSV, parseCSVLines, parseCryptoComCSV } from '../src/utils/csvParser';

let dbClient: Client | null = null;

/**
 * Returns the resolved path to the SQLite database file.
 * Priority:
 * 1. process.env.DATABASE_PATH
 * 2. /share/rwrfolio/db/rwrfolio.db (if /share exists in Home Assistant Samba environment)
 * 3. /config/rwrfolio.db (if /config exists)
 * 4. ./data/share/rwrfolio/db/rwrfolio.db (local dev environment)
 */
export function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // Home Assistant Samba /share volume mapping
  if (fs.existsSync('/share')) {
    return '/share/rwrfolio/db/rwrfolio.db';
  }

  // Home Assistant /config volume mapping fallback
  if (fs.existsSync('/config')) {
    return '/config/rwrfolio.db';
  }

  // Local development fallback
  return path.join(process.cwd(), 'data', 'share', 'rwrfolio', 'db', 'rwrfolio.db');
}

/**
 * Returns the resolved directory for archived imported CSV files.
 * Priority:
 * 1. process.env.IMPORTED_CSV_PATH
 * 2. /share/rwrfolio/imported (if /share exists in Home Assistant Samba environment)
 * 3. /config/rwrfolio/imported (if /config exists)
 * 4. ./data/share/rwrfolio/imported (local dev environment)
 */
export function resolveImportedCsvPath(): string {
  if (process.env.IMPORTED_CSV_PATH) {
    return process.env.IMPORTED_CSV_PATH;
  }

  if (fs.existsSync('/share')) {
    return '/share/rwrfolio/imported';
  }

  if (fs.existsSync('/config')) {
    return '/config/rwrfolio/imported';
  }

  return path.join(process.cwd(), 'data', 'share', 'rwrfolio', 'imported');
}

export function getDb(): Client {
  if (!dbClient) {
    const dbFilePath = resolveDatabasePath();
    const dir = path.dirname(dbFilePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Auto-migration: if old /config/rwrfolio.db exists and new target /share/rwrfolio/db/rwrfolio.db does not exist yet
    if (dbFilePath.startsWith('/share') && !fs.existsSync(dbFilePath) && fs.existsSync('/config/rwrfolio.db')) {
      try {
        console.log('[SQLite] Migriere bestehende Datenbank von /config/rwrfolio.db nach ' + dbFilePath);
        fs.copyFileSync('/config/rwrfolio.db', dbFilePath);
      } catch (copyErr) {
        console.warn('[SQLite] Konnte /config/rwrfolio.db nicht automatisch kopieren:', copyErr);
      }
    }

    // Also ensure imported CSV directory exists
    const importedCsvDir = resolveImportedCsvPath();
    if (!fs.existsSync(importedCsvDir)) {
      fs.mkdirSync(importedCsvDir, { recursive: true });
    }

    console.log(`[SQLite] SQLite-Datenbank Pfad: ${dbFilePath}`);
    console.log(`[SQLite] CSV-Archiv Pfad (Samba Share): ${importedCsvDir}`);

    dbClient = createClient({
      url: `file:${dbFilePath}`
    });
  }
  return dbClient;
}

export async function initDb(): Promise<void> {
  const db = getDb();
  
  // Create tables for transactions, custom prices and settings
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      spentCurrency TEXT NOT NULL,
      spentAmount REAL NOT NULL,
      receivedCurrency TEXT NOT NULL,
      receivedAmount REAL NOT NULL,
      pricePerUnitEUR REAL,
      nativeCurrency TEXT,
      nativeAmount REAL,
      nativeAmountUSD REAL,
      transactionKind TEXT,
      transactionHash TEXT,
      fee REAL,
      feeCurrency TEXT,
      notes TEXT,
      importedAt TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_prices (
      symbol TEXT PRIMARY KEY,
      price_eur REAL NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Check if we need to seed with initial sample transactions if database is completely empty
  const countResult = await db.execute('SELECT COUNT(*) as count FROM transactions');
  const count = Number(countResult.rows[0]?.count ?? 0);
  
  if (count === 0) {
    console.log('[SQLite] Leere Datenbank erkannt. Initialisiere mit Beispieldaten...');
    const sampleRows = parseCSVLines(USER_SAMPLE_CRYPTO_COM_CSV);
    const initialTxs = parseCryptoComCSV(sampleRows);
    for (const tx of initialTxs) {
      await insertOrUpdateTransaction(tx);
    }
    console.log(`[SQLite] ${initialTxs.length} Transaktionen in SQLite gespeichert.`);
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = getDb();
  const rs = await db.execute('SELECT * FROM transactions ORDER BY timestamp DESC');
  return rs.rows.map(row => ({
    id: String(row.id),
    timestamp: String(row.timestamp),
    source: String(row.source || 'manual'),
    type: String(row.type) as TransactionType,
    description: String(row.description || ''),
    spentCurrency: String(row.spentCurrency || 'EUR'),
    spentAmount: Number(row.spentAmount || 0),
    receivedCurrency: String(row.receivedCurrency || ''),
    receivedAmount: Number(row.receivedAmount || 0),
    pricePerUnitEUR: row.pricePerUnitEUR !== null && row.pricePerUnitEUR !== undefined ? Number(row.pricePerUnitEUR) : undefined,
    nativeCurrency: row.nativeCurrency ? String(row.nativeCurrency) : undefined,
    nativeAmount: row.nativeAmount !== null && row.nativeAmount !== undefined ? Number(row.nativeAmount) : undefined,
    nativeAmountUSD: row.nativeAmountUSD !== null && row.nativeAmountUSD !== undefined ? Number(row.nativeAmountUSD) : undefined,
    transactionKind: row.transactionKind ? String(row.transactionKind) : undefined,
    transactionHash: row.transactionHash ? String(row.transactionHash) : undefined,
    fee: row.fee !== null && row.fee !== undefined ? Number(row.fee) : undefined,
    feeCurrency: row.feeCurrency ? String(row.feeCurrency) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    importedAt: row.importedAt ? String(row.importedAt) : undefined,
  }));
}

export async function insertOrUpdateTransaction(tx: Transaction): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db.execute({
    sql: `
      INSERT INTO transactions (
        id, timestamp, source, type, description,
        spentCurrency, spentAmount, receivedCurrency, receivedAmount,
        pricePerUnitEUR, nativeCurrency, nativeAmount, nativeAmountUSD,
        transactionKind, transactionHash, fee, feeCurrency, notes, importedAt, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        timestamp = excluded.timestamp,
        source = excluded.source,
        type = excluded.type,
        description = excluded.description,
        spentCurrency = excluded.spentCurrency,
        spentAmount = excluded.spentAmount,
        receivedCurrency = excluded.receivedCurrency,
        receivedAmount = excluded.receivedAmount,
        pricePerUnitEUR = excluded.pricePerUnitEUR,
        nativeCurrency = excluded.nativeCurrency,
        nativeAmount = excluded.nativeAmount,
        nativeAmountUSD = excluded.nativeAmountUSD,
        transactionKind = excluded.transactionKind,
        transactionHash = excluded.transactionHash,
        fee = excluded.fee,
        feeCurrency = excluded.feeCurrency,
        notes = excluded.notes,
        importedAt = excluded.importedAt;
    `,
    args: [
      tx.id,
      tx.timestamp,
      tx.source || 'manual',
      tx.type,
      tx.description || '',
      tx.spentCurrency || 'EUR',
      tx.spentAmount || 0,
      tx.receivedCurrency || '',
      tx.receivedAmount || 0,
      tx.pricePerUnitEUR ?? null,
      tx.nativeCurrency || null,
      tx.nativeAmount ?? null,
      tx.nativeAmountUSD ?? null,
      tx.transactionKind || null,
      tx.transactionHash || null,
      tx.fee ?? null,
      tx.feeCurrency || null,
      tx.notes || null,
      tx.importedAt || null,
      now
    ]
  });
}

export async function insertTransactionsBulk(txs: Transaction[]): Promise<number> {
  let count = 0;
  for (const tx of txs) {
    await insertOrUpdateTransaction(tx);
    count++;
  }
  return count;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM transactions WHERE id = ?',
    args: [id]
  });
}

export async function deleteTransactionsBulk(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.execute({
    sql: `DELETE FROM transactions WHERE id IN (${placeholders})`,
    args: ids
  });
}

export async function resetTransactionsToSample(): Promise<Transaction[]> {
  const db = getDb();
  await db.execute('DELETE FROM transactions');
  const sampleRows = parseCSVLines(USER_SAMPLE_CRYPTO_COM_CSV);
  const initialTxs = parseCryptoComCSV(sampleRows);
  for (const tx of initialTxs) {
    await insertOrUpdateTransaction(tx);
  }
  return initialTxs;
}

export async function getCustomPrices(): Promise<Record<string, number>> {
  const db = getDb();
  const rs = await db.execute('SELECT symbol, price_eur FROM custom_prices');
  const prices: Record<string, number> = {};
  for (const row of rs.rows) {
    prices[String(row.symbol)] = Number(row.price_eur);
  }
  return prices;
}

export async function saveCustomPrices(prices: Record<string, number>): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  for (const [symbol, price] of Object.entries(prices)) {
    await db.execute({
      sql: `
        INSERT INTO custom_prices (symbol, price_eur, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(symbol) DO UPDATE SET
          price_eur = excluded.price_eur,
          updated_at = excluded.updated_at;
      `,
      args: [symbol.toUpperCase(), price, now]
    });
  }
}

export async function getSettingValue(key: string, defaultValue: string = ''): Promise<string> {
  const db = getDb();
  const rs = await db.execute({
    sql: 'SELECT value FROM settings WHERE key = ?',
    args: [key]
  });
  if (rs.rows.length > 0 && rs.rows[0].value !== null && rs.rows[0].value !== undefined) {
    return String(rs.rows[0].value);
  }
  return defaultValue;
}

export async function setSettingValue(key: string, value: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `,
    args: [key, value]
  });
}

/**
 * Saves a copy of an imported CSV file into the Samba share folder /share/rwrfolio/imported
 */
export function archiveImportedCsv(rawCsvText: string, originalFileName: string = 'export.csv'): string | null {
  try {
    const archiveDir = resolveImportedCsvPath();
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetFileName = `${timestampStr}_${sanitizedName}`;
    const targetFilePath = path.join(archiveDir, targetFileName);

    fs.writeFileSync(targetFilePath, rawCsvText, 'utf-8');
    console.log(`[Samba Archive] CSV-Datei erfolgreich archiviert unter: ${targetFilePath}`);
    return targetFilePath;
  } catch (err) {
    console.error('[Samba Archive] Fehler beim Speichern der CSV-Datei in /share/rwrfolio/imported:', err);
    return null;
  }
}

/**
 * Lists archived CSV files from /share/rwrfolio/imported
 */
export function getArchivedCsvFiles(): { name: string; size: number; modified: string }[] {
  try {
    const archiveDir = resolveImportedCsvPath();
    if (!fs.existsSync(archiveDir)) return [];
    
    const files = fs.readdirSync(archiveDir);
    return files
      .filter(f => f.endsWith('.csv') || f.endsWith('.txt'))
      .map(f => {
        const full = path.join(archiveDir, f);
        const stats = fs.statSync(full);
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
  } catch (err) {
    console.error('[Samba Archive] Fehler beim Lesen der archivierten CSV-Dateien:', err);
    return [];
  }
}

import { Transaction, AppSettings } from '../types';

export interface StorageInfo {
  success: boolean;
  databasePath: string;
  importedCsvPath: string;
  archivedFilesCount: number;
  archivedFiles: { name: string; size: number; modified: string }[];
}

export async function fetchTransactionsFromApi(): Promise<Transaction[] | null> {
  try {
    const res = await fetch('/api/transactions');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Could not fetch transactions from server, using local storage fallback', err);
  }
  return null;
}

export async function saveTransactionToApi(tx: Transaction): Promise<boolean> {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to persist transaction to SQLite server', err);
    return false;
  }
}

export async function bulkImportTransactionsToApi(
  transactions: Transaction[],
  csvRawText?: string,
  fileName?: string
): Promise<{ success: boolean; inserted?: number; archivedPath?: string | null }> {
  try {
    const res = await fetch('/api/transactions/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, csvRawText, fileName }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, inserted: data.inserted, archivedPath: data.archivedPath };
    }
    return { success: false };
  } catch (err) {
    console.warn('[API] Failed to bulk import transactions to SQLite server', err);
    return { success: false };
  }
}

export async function fetchStorageInfo(): Promise<StorageInfo | null> {
  try {
    const res = await fetch('/api/storage');
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return json;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to fetch storage info from server', err);
  }
  return null;
}

export async function deleteTransactionFromApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to delete transaction on SQLite server', err);
    return false;
  }
}

export async function bulkDeleteTransactionsFromApi(ids: string[]): Promise<boolean> {
  try {
    const res = await fetch('/api/transactions/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to bulk delete transactions on SQLite server', err);
    return false;
  }
}

export async function resetDatabaseToSampleOnApi(): Promise<Transaction[] | null> {
  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to reset database on SQLite server', err);
  }
  return null;
}

export async function fetchPricesFromApi(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('/api/prices');
    if (res.ok) {
      const json = await res.json();
      if (json.success && typeof json.data === 'object') {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to fetch prices from SQLite server', err);
  }
  return null;
}

export async function savePricesToApi(prices: Record<string, number>): Promise<boolean> {
  try {
    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prices),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to save prices to SQLite server', err);
    return false;
  }
}

export async function fetchSettingsFromApi(): Promise<AppSettings | null> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[API] Failed to fetch settings from SQLite server', err);
  }
  return null;
}

export async function saveSettingsToApi(settings: AppSettings): Promise<boolean> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch (err) {
    console.warn('[API] Failed to save settings to SQLite server', err);
    return false;
  }
}

export async function sendTestEmailApi(emailConfig: any): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/settings/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailConfig }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Verbindung fehlgeschlagen' };
  }
}

import { Transaction } from '../types';

/**
 * Creates a normalized comparison fingerprint for a transaction.
 * Two transactions representing the exact same event produce identical fingerprints.
 */
export function getTransactionFingerprint(tx: Transaction): string {
  // Normalize timestamp to UTC second (handles date format variations e.g. "2026-09-01 14:41:18" vs ISO)
  let normalizedTime = (tx.timestamp || '').trim();
  try {
    const d = new Date(tx.timestamp);
    if (!isNaN(d.getTime())) {
      normalizedTime = Math.floor(d.getTime() / 1000).toString();
    }
  } catch {
    // Keep original string fallback
  }

  const type = (tx.type || 'BUY').toUpperCase();
  const recCurr = (tx.receivedCurrency || '').toUpperCase().trim();
  // Format numbers to fixed 6 decimal places to prevent float rounding differences
  const recAmt = Number(tx.receivedAmount || 0).toFixed(6);
  const spentCurr = (tx.spentCurrency || '').toUpperCase().trim();
  const spentAmt = Number(tx.spentAmount || 0).toFixed(6);

  // If hash is present, include it for blockchain uniqueness
  const hashPart = tx.transactionHash ? `_hash:${tx.transactionHash.toLowerCase().trim()}` : '';

  return `${normalizedTime}_${type}_${recCurr}:${recAmt}_${spentCurr}:${spentAmt}${hashPart}`;
}

/**
 * Checks whether candidateTx is identical to any transaction in existingList.
 */
export function isDuplicateTransaction(candidateTx: Transaction, existingList: Transaction[]): boolean {
  const candidateFp = getTransactionFingerprint(candidateTx);
  return existingList.some(existing => {
    if (existing.id && candidateTx.id && existing.id === candidateTx.id) return true;
    if (existing.transactionHash && candidateTx.transactionHash && existing.transactionHash === candidateTx.transactionHash) return true;
    return getTransactionFingerprint(existing) === candidateFp;
  });
}

export interface DeduplicationResult {
  newTransactions: Transaction[];
  skippedDuplicates: Transaction[];
  totalCandidates: number;
}

/**
 * Filters out duplicates both against already existing transactions AND within the newly uploaded batch itself.
 */
export function deduplicateTransactions(
  incomingTransactions: Transaction[],
  existingTransactions: Transaction[]
): DeduplicationResult {
  const existingFingerprints = new Set<string>();
  const existingIds = new Set<string>();
  const existingHashes = new Set<string>();

  for (const t of existingTransactions) {
    existingFingerprints.add(getTransactionFingerprint(t));
    if (t.id) existingIds.add(t.id);
    if (t.transactionHash) existingHashes.add(t.transactionHash.toLowerCase().trim());
  }

  const newTransactions: Transaction[] = [];
  const skippedDuplicates: Transaction[] = [];
  const batchFingerprints = new Set<string>();

  for (const tx of incomingTransactions) {
    const fp = getTransactionFingerprint(tx);
    const hash = tx.transactionHash ? tx.transactionHash.toLowerCase().trim() : null;

    const isDup =
      (tx.id && existingIds.has(tx.id)) ||
      existingFingerprints.has(fp) ||
      (hash && existingHashes.has(hash)) ||
      batchFingerprints.has(fp);

    if (isDup) {
      skippedDuplicates.push(tx);
    } else {
      newTransactions.push(tx);
      batchFingerprints.add(fp);
      if (hash) existingHashes.add(hash);
      if (tx.id) existingIds.add(tx.id);
    }
  }

  return {
    newTransactions,
    skippedDuplicates,
    totalCandidates: incomingTransactions.length,
  };
}

import { Transaction, TransactionType, ExchangeSource, CSVParseResult } from '../types';

export const USER_SAMPLE_CRYPTO_COM_CSV = `Timestamp (UTC),Transaction Description,Currency,Amount,To Currency,To Amount,Native Currency,Native Amount,Native Amount (in USD),Transaction Kind,Transaction Hash
2026-09-01 14:41:18,Bought HBAR,EUR,-300.00,HBAR,4416.65,USD,344.006896499925429975932745594,344.006896499925429975932745594,viban_purchase,
2026-09-01 14:40:48,Bought AKT,EUR,-300.00,AKT,629.608,USD,343.997999999829363232080084643,343.997999999829363232080084643,viban_purchase,
2026-09-01 14:40:16,Bought DOT,EUR,-300.00,DOT,379.291,USD,344.039516999927701461339347683,344.039516999927701461339347683,viban_purchase,
2026-07-25 06:49:14,Bought BTC,EUR,-340.00,BTC,0.0058933,USD,384.419996999884879146631433525,384.419996999884879146631433525,viban_purchase,
2026-07-01 21:08:00,Bought BTC,EUR,-666.00,BTC,0.0122107,USD,753.481194569641410357812516889,753.481194569641410357812516889,viban_purchase,
2026-06-07 08:09:51,Bought BTC,EUR,-770.00,BTC,0.0138279,USD,882.314433000155290957697202632,882.314433000155290957697202632,viban_purchase,
2026-06-01 06:29:05,Bought BTC,EUR,-888.00,BTC,0.0137917,USD,1028.900789279676264165721132603,1028.900789279676264165721132603,trading.limit_order.cash_account.purchase_commit,`;

// Robust CSV Line Splitter taking quotes into account
export function parseCSVLines(text: string): string[][] {
  const lines: string[][] = [];
  const rawLines = text.split(/\r\n|\n|\r/);
  
  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';
    
    for (let i = 0; i < rawLine.length; i++) {
      const char = rawLine[i];
      if (char === '"') {
        if (insideQuote && rawLine[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    lines.push(row);
  }
  
  return lines;
}

export function detectCSVFormat(headers: string[]): ExchangeSource | 'generic' {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  const headerStr = lowerHeaders.join(',');

  if (headerStr.includes('timestamp (utc)') && headerStr.includes('transaction description') && headerStr.includes('to currency')) {
    return 'crypto_com';
  }
  if (lowerHeaders.includes('timestamp (utc)') || (lowerHeaders.includes('to amount') && lowerHeaders.includes('transaction description'))) {
    return 'crypto_com';
  }
  if (lowerHeaders.includes('market') && lowerHeaders.includes('filled') && lowerHeaders.includes('fee')) {
    return 'binance';
  }
  if (lowerHeaders.includes('txid') && lowerHeaders.includes('pair') && lowerHeaders.includes('ordertype')) {
    return 'kraken';
  }
  if (lowerHeaders.includes('asset') && lowerHeaders.includes('spot price at transaction')) {
    return 'coinbase';
  }
  if (lowerHeaders.includes('transaction type') && lowerHeaders.includes('asset class')) {
    return 'bitpanda';
  }
  return 'generic';
}

export function parseCryptoComCSV(rows: string[][]): Transaction[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const getIndex = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

  const tsIdx = getIndex('Timestamp (UTC)');
  const descIdx = getIndex('Transaction Description');
  const currIdx = getIndex('Currency');
  const amountIdx = getIndex('Amount');
  const toCurrIdx = getIndex('To Currency');
  const toAmountIdx = getIndex('To Amount');
  const nativeCurrIdx = getIndex('Native Currency');
  const nativeAmountIdx = getIndex('Native Amount');
  const nativeUSDIdx = getIndex('Native Amount (in USD)');
  const kindIdx = getIndex('Transaction Kind');
  const hashIdx = getIndex('Transaction Hash');

  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(c => !c)) continue;

    const rawTimestamp = tsIdx !== -1 ? row[tsIdx] : '';
    const desc = descIdx !== -1 ? row[descIdx] : '';
    const currency = currIdx !== -1 ? row[currIdx] : '';
    const rawAmount = amountIdx !== -1 ? row[amountIdx] : '0';
    const toCurrency = toCurrIdx !== -1 ? row[toCurrIdx] : '';
    const rawToAmount = toAmountIdx !== -1 ? row[toAmountIdx] : '0';
    const nativeCurr = nativeCurrIdx !== -1 ? row[nativeCurrIdx] : '';
    const nativeAmount = nativeAmountIdx !== -1 ? parseFloat(row[nativeAmountIdx]) || undefined : undefined;
    const nativeUSD = nativeUSDIdx !== -1 ? parseFloat(row[nativeUSDIdx]) || undefined : undefined;
    const kind = kindIdx !== -1 ? row[kindIdx] : '';
    const hash = hashIdx !== -1 ? row[hashIdx] : '';

    if (!rawTimestamp && !desc && !currency && !toCurrency) continue;

    // Parse amount
    const amountVal = parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0;
    const toAmountVal = parseFloat(rawToAmount.replace(/[^0-9.-]/g, '')) || 0;

    let type: TransactionType = 'BUY';
    let spentCurr = currency;
    let spentAmt = Math.abs(amountVal);
    let recCurr = toCurrency;
    let recAmt = Math.abs(toAmountVal);

    const descLower = desc.toLowerCase();
    const kindLower = kind.toLowerCase();

    // Determine type
    if (descLower.startsWith('bought') || kindLower.includes('purchase') || kindLower.includes('buy')) {
      type = 'BUY';
      spentCurr = currency || 'EUR';
      spentAmt = Math.abs(amountVal);
      recCurr = toCurrency || desc.replace(/^bought\s+/i, '').trim();
      recAmt = Math.abs(toAmountVal);
    } else if (descLower.startsWith('sold') || kindLower.includes('sell')) {
      type = 'SELL';
      spentCurr = currency;
      spentAmt = Math.abs(amountVal);
      recCurr = toCurrency || 'EUR';
      recAmt = Math.abs(toAmountVal);
    } else if (descLower.includes('cashback') || descLower.includes('reward') || descLower.includes('earn') || descLower.includes('interest')) {
      type = 'REWARD';
      spentCurr = 'EUR';
      spentAmt = 0;
      recCurr = currency || toCurrency;
      recAmt = Math.abs(amountVal > 0 ? amountVal : toAmountVal);
    } else if (descLower.includes('deposit') || descLower.includes('withdraw') || descLower.includes('transfer')) {
      type = 'TRANSFER';
      spentCurr = currency;
      spentAmt = Math.abs(amountVal);
      recCurr = currency;
      recAmt = Math.abs(amountVal);
    } else {
      // Fallback
      if (amountVal < 0 && toAmountVal > 0) {
        type = 'BUY';
      } else if (amountVal > 0 && toAmountVal < 0) {
        type = 'SELL';
      }
    }

    // Format ISO Timestamp
    let timestamp = rawTimestamp;
    try {
      if (rawTimestamp) {
        const dateObj = new Date(rawTimestamp.replace(' ', 'T') + (rawTimestamp.includes('Z') ? '' : 'Z'));
        if (!isNaN(dateObj.getTime())) {
          timestamp = dateObj.toISOString();
        }
      }
    } catch {
      timestamp = new Date().toISOString();
    }

    // Price per unit in EUR
    let pricePerUnitEUR: number | undefined = undefined;
    if (type === 'BUY' && recAmt > 0 && spentCurr.toUpperCase() === 'EUR') {
      pricePerUnitEUR = spentAmt / recAmt;
    } else if (type === 'BUY' && recAmt > 0 && nativeCurr.toUpperCase() === 'EUR' && nativeAmount) {
      pricePerUnitEUR = nativeAmount / recAmt;
    }

    // Unique deterministic id based on data content
    const id = `cdc_${timestamp}_${recCurr}_${recAmt}_${spentAmt}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    transactions.push({
      id,
      timestamp,
      source: 'crypto_com',
      type,
      description: desc || `${type === 'BUY' ? 'Bought' : 'Transaction'} ${recCurr}`,
      spentCurrency: spentCurr || 'EUR',
      spentAmount: spentAmt,
      receivedCurrency: recCurr || currency,
      receivedAmount: recAmt,
      pricePerUnitEUR,
      nativeCurrency: nativeCurr,
      nativeAmount,
      nativeAmountUSD: nativeUSD,
      transactionKind: kind,
      transactionHash: hash,
    });
  }

  return transactions;
}

// Generic CSV parser for manual or other exchanges
export function parseGenericCSV(
  rows: string[][],
  mapping: {
    timestampCol: number;
    typeCol?: number;
    coinCol: number;
    amountCol: number;
    spentAmountCol?: number;
    spentCurrencyCol?: number;
    exchangeSource?: string;
  }
): Transaction[] {
  if (rows.length < 2) return [];
  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const rawTimestamp = row[mapping.timestampCol] || new Date().toISOString();
    const coin = (row[mapping.coinCol] || 'UNKNOWN').toUpperCase();
    const rawAmt = parseFloat((row[mapping.amountCol] || '0').replace(/[^0-9.-]/g, '')) || 0;
    const rawSpent = mapping.spentAmountCol !== undefined ? parseFloat((row[mapping.spentAmountCol] || '0').replace(/[^0-9.-]/g, '')) : 0;
    const spentCurr = mapping.spentCurrencyCol !== undefined ? row[mapping.spentCurrencyCol] || 'EUR' : 'EUR';

    let type: TransactionType = 'BUY';
    if (mapping.typeCol !== undefined && row[mapping.typeCol]) {
      const t = row[mapping.typeCol].toLowerCase();
      if (t.includes('sell') || t.includes('verkauf')) type = 'SELL';
      else if (t.includes('reward') || t.includes('stake') || t.includes('earn')) type = 'REWARD';
      else if (t.includes('transfer') || t.includes('deposit') || t.includes('withdraw')) type = 'TRANSFER';
    }

    const recAmt = Math.abs(rawAmt);
    const spentAmt = Math.abs(rawSpent || 0);

    let pricePerUnitEUR = recAmt > 0 && spentAmt > 0 && spentCurr.toUpperCase() === 'EUR' ? spentAmt / recAmt : undefined;

    const id = `gen_${rawTimestamp}_${coin}_${recAmt}_${i}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    transactions.push({
      id,
      timestamp: rawTimestamp,
      source: (mapping.exchangeSource as ExchangeSource) || 'other',
      type,
      description: `${type === 'BUY' ? 'Gekauft' : type} ${coin}`,
      spentCurrency: spentCurr,
      spentAmount: spentAmt,
      receivedCurrency: coin,
      receivedAmount: recAmt,
      pricePerUnitEUR,
    });
  }

  return transactions;
}

export function parseCSVFile(csvContent: string): CSVParseResult {
  const rows = parseCSVLines(csvContent);
  if (rows.length === 0) {
    return {
      success: false,
      transactions: [],
      totalRows: 0,
      importedCount: 0,
      skippedDuplicates: 0,
      detectedExchange: 'unknown',
      errors: ['Die Datei enthält keine Daten oder ist leer.'],
    };
  }

  const detectedExchange = detectCSVFormat(rows[0]);
  let transactions: Transaction[] = [];

  if (detectedExchange === 'crypto_com') {
    transactions = parseCryptoComCSV(rows);
  } else {
    // Attempt crypto.com parser anyway as fallback if columns match loosely
    transactions = parseCryptoComCSV(rows);
  }

  return {
    success: transactions.length > 0,
    transactions,
    totalRows: rows.length - 1,
    importedCount: transactions.length,
    skippedDuplicates: 0,
    detectedExchange,
    errors: transactions.length === 0 ? ['Konnte keine Krypto-Transaktionen aus der CSV-Struktur extrahieren.'] : [],
  };
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    'Timestamp (UTC)',
    'Exchange Source',
    'Type',
    'Description',
    'Received Currency',
    'Received Amount',
    'Spent Currency',
    'Spent Amount',
    'Price Per Unit (EUR)',
    'Native Amount (USD)',
    'Transaction Kind',
    'Transaction Hash',
    'Notes',
  ];

  const rows = transactions.map(t => [
    `"${t.timestamp}"`,
    `"${t.source}"`,
    `"${t.type}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.receivedCurrency}"`,
    t.receivedAmount.toString(),
    `"${t.spentCurrency}"`,
    t.spentAmount.toString(),
    (t.pricePerUnitEUR || (t.spentAmount > 0 && t.receivedAmount > 0 ? (t.spentAmount / t.receivedAmount) : 0)).toFixed(4),
    (t.nativeAmountUSD || 0).toString(),
    `"${t.transactionKind || ''}"`,
    `"${t.transactionHash || ''}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

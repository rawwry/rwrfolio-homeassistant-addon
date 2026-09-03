export type TransactionType = 'BUY' | 'SELL' | 'REWARD' | 'TRANSFER' | 'STAKE' | 'OTHER';

export type ExchangeSource = 'crypto_com' | 'binance' | 'kraken' | 'coinbase' | 'bitpanda' | 'manual' | 'generic' | 'other';

export type PortfolioCurrency = 'EUR' | 'USD';

export interface Transaction {
  id: string;
  timestamp: string; // ISO date string: YYYY-MM-DDTHH:mm:ssZ
  source: ExchangeSource | string;
  type: TransactionType;
  description: string;
  spentCurrency: string;
  spentAmount: number;
  receivedCurrency: string;
  receivedAmount: number;
  pricePerUnitEUR?: number;
  pricePerUnitUSD?: number;
  nativeCurrency?: string;
  nativeAmount?: number;
  nativeAmountUSD?: number;
  transactionKind?: string;
  transactionHash?: string;
  fee?: number;
  feeCurrency?: string;
  notes?: string;
  importedAt?: string;
}

export interface AssetSummary {
  symbol: string;
  name: string;
  totalBought: number;
  totalSold: number;
  currentBalance: number;
  currency?: PortfolioCurrency;
  currencySymbol?: string;
  totalInvested: number;
  averageBuyPrice: number; // DCA
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  totalInvestedEUR: number;
  averageBuyPriceEUR: number; // DCA
  currentPriceEUR: number;
  currentValueEUR: number;
  pnlEUR: number;
  totalInvestedUSD?: number;
  averageBuyPriceUSD?: number;
  currentPriceUSD?: number;
  currentValueUSD?: number;
  pnlUSD?: number;
  firstBuyDate: string;
  lastBuyDate: string;
  transactionCount: number;
  allocationPercentage: number;
}

export interface PortfolioTotals {
  currency?: PortfolioCurrency;
  currencySymbol?: string;
  totalInvested?: number;
  currentValue?: number;
  totalPnl?: number;
  totalPnlPercentage?: number;
  eurUsdRate?: number;
  totalInvestedEUR: number;
  currentValueEUR: number;
  totalPnlEUR: number;
  totalPnlPercentageEUR: number;
  assetCount: number;
  transactionCount: number;
  topAssetSymbol: string;
  topAssetPercentage: number;
}

export interface CSVParseResult {
  success: boolean;
  transactions: Transaction[];
  totalRows: number;
  importedCount: number;
  skippedDuplicates: number;
  detectedExchange: ExchangeSource | 'unknown';
  errors: string[];
}

export type ThemeMode = 'dark' | 'light' | 'system';

export interface UserProfile {
  username: string;
  email: string;
  hasPassword?: boolean;
  passwordHash?: string; // stored locally/in SQLite on the Pi
  isInitialAdmin?: boolean; // indicates default admin/admin that should be customized
  updatedAt?: string;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderEmail: string;
  recipientEmail: string;
  dailyDigest: boolean;
  priceAlertThresholdPct: number; // e.g. 5% or 10%
  alertOnLargeDip: boolean;
  alertOnTargetReached: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  currency?: PortfolioCurrency;
  user: UserProfile;
  email: EmailNotificationSettings;
  privacyMode: boolean; // hide balances with ***
}

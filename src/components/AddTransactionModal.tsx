import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, ExchangeSource } from '../types';
import { 
  Plus, 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  RefreshCw, 
  Calculator,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { KNOWN_COINS } from '../utils/priceService';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  initialTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('BUY');
  const [source, setSource] = useState<string>('crypto_com');
  const [timestamp, setTimestamp] = useState<string>(new Date().toISOString().substring(0, 16));
  const [coin, setCoin] = useState<string>('BTC');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [spentCurrency, setSpentCurrency] = useState<string>('EUR');
  const [spentAmount, setSpentAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [transactionKind, setTransactionKind] = useState<string>('manual_entry');
  const [transactionHash, setTransactionHash] = useState<string>('');

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setSource(initialTransaction.source);
      setTimestamp(
        initialTransaction.timestamp 
          ? new Date(initialTransaction.timestamp).toISOString().substring(0, 16)
          : new Date().toISOString().substring(0, 16)
      );
      setCoin(initialTransaction.receivedCurrency || 'BTC');
      setReceivedAmount(initialTransaction.receivedAmount?.toString() || '');
      setSpentCurrency(initialTransaction.spentCurrency || 'EUR');
      setSpentAmount(initialTransaction.spentAmount?.toString() || '');
      setDescription(initialTransaction.description || '');
      setNotes(initialTransaction.notes || '');
      setTransactionKind(initialTransaction.transactionKind || 'manual_entry');
      setTransactionHash(initialTransaction.transactionHash || '');
    } else {
      setType('BUY');
      setSource('crypto_com');
      setTimestamp(new Date().toISOString().substring(0, 16));
      setCoin('BTC');
      setReceivedAmount('');
      setSpentCurrency('EUR');
      setSpentAmount('');
      setDescription('');
      setNotes('');
      setTransactionKind('manual_entry');
      setTransactionHash('');
    }
  }, [initialTransaction, isOpen]);

  if (!isOpen) return null;

  const recAmtNum = parseFloat(receivedAmount) || 0;
  const spentAmtNum = parseFloat(spentAmount) || 0;
  const calculatedUnitPrice = recAmtNum > 0 && spentAmtNum > 0 && spentCurrency === 'EUR'
    ? spentAmtNum / recAmtNum
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coin.trim() || recAmtNum <= 0) {
      alert('Bitte gib ein gültiges Coin-Symbol und eine Menge größer 0 ein.');
      return;
    }

    const isoDate = new Date(timestamp).toISOString();
    const finalDesc = description.trim() 
      ? description 
      : `${type === 'BUY' ? 'Gekauft' : type === 'SELL' ? 'Verkauft' : type} ${coin.toUpperCase()}`;

    const tx: Transaction = {
      id: initialTransaction ? initialTransaction.id : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: isoDate,
      source: source as ExchangeSource,
      type,
      description: finalDesc,
      spentCurrency: spentCurrency.toUpperCase(),
      spentAmount: spentAmtNum,
      receivedCurrency: coin.toUpperCase(),
      receivedAmount: recAmtNum,
      pricePerUnitEUR: calculatedUnitPrice > 0 ? calculatedUnitPrice : undefined,
      notes: notes.trim() || undefined,
      transactionKind: transactionKind.trim() || undefined,
      transactionHash: transactionHash.trim() || undefined,
    };

    onSave(tx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {initialTransaction ? 'Transaktion bearbeiten' : 'Kauf / Transaktion manuell erfassen'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          
          {/* Type Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Transaktionstyp
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Kauf (Buy)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'SELL'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Verkauf (Sell)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('REWARD')}
                className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'REWARD'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Reward / Staking</span>
              </button>
            </div>
          </div>

          {/* Source / Börse & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Börse / Plattform
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="crypto_com">Crypto.com</option>
                <option value="binance">Binance</option>
                <option value="bitpanda">Bitpanda</option>
                <option value="kraken">Kraken</option>
                <option value="coinbase">Coinbase</option>
                <option value="manual">Manuell / Sonstige</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Datum & Uhrzeit
              </label>
              <input
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Coin & Amount Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Coin / Token Symbol
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="z.B. BTC, HBAR, AKT, DOT..."
                  value={coin}
                  onChange={(e) => setCoin(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              {/* Quick Select Pill Helpers */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['BTC', 'HBAR', 'AKT', 'DOT', 'ETH', 'SOL', 'CRO'].map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setCoin(sym)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      coin === sym ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Erhaltene Menge ({coin || 'Coin'})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="z.B. 4416.65"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Spent Amount (e.g. EUR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Gezahlter Betrag ({spentCurrency})
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="z.B. 300.00"
                value={spentAmount}
                onChange={(e) => setSpentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Zahlungswährung
              </label>
              <select
                value={spentCurrency}
                onChange={(e) => setSpentCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="USDT">USDT</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
          </div>

          {/* Calculated Price Per Unit Indicator */}
          {calculatedUnitPrice > 0 && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-indigo-300">
                <Calculator className="w-4 h-4 text-indigo-400" />
                <span>Effektiver Kaufkurs pro Einheit:</span>
              </div>
              <div className="font-mono font-bold text-white text-sm">
                {calculatedUnitPrice < 1 ? calculatedUnitPrice.toFixed(5) : calculatedUnitPrice.toFixed(2)} {spentCurrency} / {coin}
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Notizen / Transaktions-Hash (Optional)
            </label>
            <input
              type="text"
              placeholder="z.B. Crypto.com Sparplan Kauf, Limit-Order etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/25 transition-all"
            >
              {initialTransaction ? 'Änderungen speichern' : 'Transaktion speichern'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

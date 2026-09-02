import React, { useState } from 'react';
import { Edit3, X, Check } from 'lucide-react';
import { saveStoredCustomPrice, getLiveEurUsdRate } from '../utils/priceService';
import { PortfolioCurrency } from '../types';

interface PriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  currency?: PortfolioCurrency;
  onPriceUpdated: (symbol: string, newPrice: number) => void;
}

export const PriceEditModal: React.FC<PriceEditModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  currency = 'EUR',
  onPriceUpdated,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<PortfolioCurrency>(currency);
  const [priceInput, setPriceInput] = useState<string>(currentPrice.toString());

  React.useEffect(() => {
    setSelectedCurrency(currency);
    setPriceInput(currentPrice.toString());
  }, [currentPrice, symbol, currency, isOpen]);

  if (!isOpen) return null;

  const rate = getLiveEurUsdRate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(priceInput);
    if (isNaN(val) || val <= 0) {
      alert('Bitte gib einen gültigen Preis größer 0 ein.');
      return;
    }

    // Always store base EUR price
    const priceEUR = selectedCurrency === 'USD' ? val / rate : val;
    saveStoredCustomPrice(symbol, priceEUR);
    onPriceUpdated(symbol, priceEUR);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-white text-sm">Aktuellen Kurs für {symbol} anpassen</h4>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-400">Marktpreis in:</label>
              <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('EUR')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    selectedCurrency === 'EUR' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EUR (€)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('USD')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                    selectedCurrency === 'USD' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            <input
              type="number"
              step="any"
              min="0.00000001"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
            />

            <div className="mt-1 text-[11px] text-slate-500">
              {selectedCurrency === 'USD' ? (
                <span>≈ {((parseFloat(priceInput) || 0) / rate).toFixed(4)} € (Kurs 1 EUR = {rate.toFixed(4)} USD)</span>
              ) : (
                <span>≈ {((parseFloat(priceInput) || 0) * rate).toFixed(4)} $ (Kurs 1 EUR = {rate.toFixed(4)} USD)</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Speichern</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Edit3, X, Check, DollarSign } from 'lucide-react';
import { saveStoredCustomPrice } from '../utils/priceService';

interface PriceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice: number;
  onPriceUpdated: (symbol: string, newPrice: number) => void;
}

export const PriceEditModal: React.FC<PriceEditModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
  onPriceUpdated,
}) => {
  const [priceInput, setPriceInput] = useState<string>(currentPrice.toString());

  React.useEffect(() => {
    setPriceInput(currentPrice.toString());
  }, [currentPrice, symbol, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(priceInput);
    if (isNaN(val) || val <= 0) {
      alert('Bitte gib einen gültigen Preis größer 0 ein.');
      return;
    }
    saveStoredCustomPrice(symbol, val);
    onPriceUpdated(symbol, val);
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
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1.5">Marktpreis in EUR (€):</label>
            <input
              type="number"
              step="any"
              min="0.00000001"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center space-x-1"
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

import { useState } from 'react';
import { Send } from 'lucide-react';

interface SendFormProps {
  onCancel: () => void;
  onSend: (address: string, amount: string, currency: 'TON' | 'USDT') => void;
  balanceTON: string;
  balanceUSDT: string;
}

export const SendForm = ({ onCancel, onSend, balanceTON, balanceUSDT }: SendFormProps) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'TON' | 'USDT'>('USDT');

  const handleMax = () => {
    setAmount(currency === 'TON' ? balanceTON : balanceUSDT);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !amount || parseFloat(amount) <= 0) return;
    onSend(address, amount, currency);
  };

  return (
    <div className="flex flex-col flex-1 pb-4">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        
        {/* Выбор валюты */}
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => setCurrency('USDT')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${currency === 'USDT' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            USDT (Баланс: {balanceUSDT})
          </button>
          <button
            type="button"
            onClick={() => setCurrency('TON')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${currency === 'TON' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            TON (Баланс: {balanceTON})
          </button>
        </div>

        {/* Адрес */}
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">Адрес получателя (TON)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="UQ..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>

        {/* Сумма */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">Сумма</label>
          <div className="relative">
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
            <button
              type="button"
              onClick={handleMax}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md"
            >
              MAX
            </button>
          </div>
          
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-xs text-zinc-500">Комиссия сети</span>
            <span className="text-xs text-zinc-400">~0.01 TON</span>
          </div>
        </div>

        {/* Кнопка отправки */}
        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={!address || !amount || parseFloat(amount) <= 0}
            className="w-full h-12 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Далее (PIN-код)
          </button>
        </div>
      </form>
    </div>
  );
};

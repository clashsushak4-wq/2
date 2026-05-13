import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

interface AddExchangeFormProps {
  onAdd: (name: string, apiKey: string, apiSecret: string) => Promise<void>;
}

const EXCHANGE_OPTIONS = ['Binance', 'Bybit', 'OKX', 'Kraken', 'KuCoin', 'Gate.io', 'MEXC', 'Bitget'];

export const AddExchangeForm = ({ onAdd }: AddExchangeFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(EXCHANGE_OPTIONS[0]);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    apiKey.trim().length > 0 &&
    apiSecret.trim().length > 0 &&
    !isSaving;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await onAdd(name, apiKey.trim(), apiSecret.trim());
      setApiKey('');
      setApiSecret('');
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-zinc-900 border border-dashed border-zinc-700 rounded-xl p-4 flex items-center justify-center gap-2 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
      >
        <Plus size={16} />
        <span className="text-sm font-medium">Добавить биржу</span>
      </button>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <p className="text-white text-sm font-semibold">Новая биржа</p>

      {/* Exchange select */}
      <div>
        <label className="text-zinc-500 text-[10px] uppercase tracking-wide block mb-1">Биржа</label>
        <select
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500 transition-colors appearance-none"
        >
          {EXCHANGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="text-zinc-500 text-[10px] uppercase tracking-wide block mb-1">API Key</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Вставьте API ключ..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors font-mono"
        />
      </div>

      {/* API Secret */}
      <div>
        <label className="text-zinc-500 text-[10px] uppercase tracking-wide block mb-1">API Secret</label>
        <input
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          placeholder="Вставьте секретный ключ..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors font-mono"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => { setIsOpen(false); setApiKey(''); setApiSecret(''); }}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 bg-white rounded-lg py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Добавить
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ExchangeItem } from '../../../../api/client';

interface ExchangeCardProps {
  exchange: ExchangeItem;
  onDelete: (id: number) => void;
}

export const ExchangeCard = ({ exchange, onDelete }: ExchangeCardProps) => {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{exchange.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{exchange.name}</p>
            <p className="text-zinc-600 text-[10px]">{new Date(exchange.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {confirming ? (
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 text-[11px]">Удалить?</span>
            <button
              onClick={() => onDelete(exchange.id)}
              className="px-2.5 py-1 rounded-md bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors"
            >
              Да
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-400 text-[11px] font-medium hover:bg-zinc-700 transition-colors"
            >
              Нет
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
            title="Удалить"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        )}
      </div>

      <div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-wide mb-0.5">API Key</p>
        <p className="text-zinc-300 text-xs font-mono bg-zinc-800/50 rounded-lg px-2.5 py-1.5 break-all">
          {exchange.api_key_masked}
        </p>
      </div>
    </div>
  );
};

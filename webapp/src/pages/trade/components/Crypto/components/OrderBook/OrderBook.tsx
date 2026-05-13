import { useMemo } from 'react';
import { LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../../../i18n';
import type { OrderBookEntry } from '../../types';
import { MOCK_ASKS, MOCK_BIDS, MOCK_CURRENT_PRICE, MOCK_MARK_PRICE } from '../../data/mockOrderBook';

const formatPrice = (price: number) =>
  price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatQty = (qty: number) => {
  if (qty >= 1) return qty.toFixed(4);
  return qty.toFixed(4);
};

interface RowProps {
  entry: OrderBookEntry;
  maxQty: number;
  side: 'ask' | 'bid';
}

const OrderBookRow = ({ entry, maxQty, side }: RowProps) => {
  const depthPercent = Math.min((entry.quantity / maxQty) * 100, 100);
  // Bitget-style: asks red, bids cyan
  const barColor = side === 'ask' ? 'bg-violet-500/15' : 'bg-white/10';
  const priceColor = side === 'ask' ? 'text-violet-400' : 'text-white';

  return (
    <div className="relative flex items-center justify-between h-[19px]">
      <div
        className={`absolute right-0 top-0 bottom-0 ${barColor}`}
        style={{ width: `${depthPercent}%` }}
      />
      <span className={`text-[11px] font-mono tabular-nums relative z-10 ${priceColor}`}>
        {formatPrice(entry.price)}
      </span>
      <span className="text-[11px] font-mono tabular-nums text-zinc-300 relative z-10">
        {formatQty(entry.quantity)}
      </span>
    </div>
  );
};

interface OrderBookProps {
  base: string;
  quote: string;
}

export const OrderBook = ({ base, quote }: OrderBookProps) => {
  const { t } = useTranslation();

  const maxAskQty = useMemo(() => Math.max(...MOCK_ASKS.map((e) => e.quantity)), []);
  const maxBidQty = useMemo(() => Math.max(...MOCK_BIDS.map((e) => e.quantity)), []);

  const totalBidQty = MOCK_BIDS.reduce((s, e) => s + e.quantity, 0);
  const totalAskQty = MOCK_ASKS.reduce((s, e) => s + e.quantity, 0);
  const buyPercent = Math.round((totalBidQty / (totalBidQty + totalAskQty)) * 100);
  const sellPercent = 100 - buyPercent;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Column headers — Bitget style with currency suffixes */}
      <div className="flex items-start justify-between py-0.5 border-b border-zinc-800/30">
        <div className="flex flex-col leading-tight">
          <span className="text-zinc-500 text-[10px]">{t('trade.price')}</span>
          <span className="text-zinc-600 text-[9px]">({quote})</span>
        </div>
        <div className="flex flex-col items-end leading-tight">
          <span className="text-zinc-500 text-[10px]">{t('trade.qty')}</span>
          <span className="text-zinc-600 text-[9px]">({base})</span>
        </div>
      </div>

      {/* Asks (sell side) — highest price at top, lowest near current price */}
      <div className="flex flex-col">
        {MOCK_ASKS.map((entry, i) => (
          <OrderBookRow key={`ask-${i}`} entry={entry} maxQty={maxAskQty} side="ask" />
        ))}
      </div>

      {/* Current price + mark price — Bitget style: large red price with chevron */}
      <div className="flex flex-col items-center justify-center py-px border-y border-zinc-800/50 bg-zinc-900/40">
        <div className="flex items-center gap-0.5 w-full justify-center relative">
          <span className={`text-[15px] font-bold font-mono tabular-nums leading-tight ${MOCK_CURRENT_PRICE >= MOCK_MARK_PRICE ? 'text-white' : 'text-violet-400'}`}>
            {formatPrice(MOCK_CURRENT_PRICE)}
          </span>
          <ChevronRight size={13} className="text-zinc-500 absolute right-1" />
        </div>
        <span className="text-zinc-500 text-[9px] font-mono tabular-nums leading-tight">
          {formatPrice(MOCK_MARK_PRICE)}
        </span>
      </div>

      {/* Bids (buy side) */}
      <div className="flex flex-col">
        {MOCK_BIDS.map((entry, i) => (
          <OrderBookRow key={`bid-${i}`} entry={entry} maxQty={maxBidQty} side="bid" />
        ))}
      </div>

      {/* Bottom block: ratio + grouping — pinned to bottom so it aligns with Open Short button */}
      <div className="mt-1">
        {/* Buy/Sell ratio bar — Bitget style: white for buy, red for sell */}
        <div className="pt-0.5 pb-0">
          <div className="flex h-[3px] rounded-full overflow-hidden gap-px">
            <div className="bg-white rounded-l-full" style={{ width: `${buyPercent}%` }} />
            <div className="bg-violet-500 rounded-r-full" style={{ width: `${sellPercent}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-white text-[10px] font-bold">B {buyPercent}%</span>
            <span className="text-violet-400 text-[10px] font-bold">{sellPercent}% S</span>
          </div>
        </div>

        {/* Grouping selector — Bitget style with chevron */}
        <div className="flex items-center gap-2 pb-0.5 pt-0.5">
          <LayoutGrid size={11} className="text-zinc-500" />
          <button className="flex flex-1 items-center justify-between gap-1 rounded-md bg-[#1d1e23] px-2 py-1 text-zinc-300 text-[10px] font-mono">
            0.1
            <ChevronDown size={10} className="text-zinc-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

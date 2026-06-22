import { useMemo } from 'react';
import { LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../../../i18n';
import type { OrderBookEntry } from '../../types';
import { MOCK_MARK_PRICE } from '../../data/mockOrderBook';
import { useBinanceOrderBook } from '../../../../../../hooks/useBinanceMarket';

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
  onClick: (price: number) => void;
}

const OrderBookRow = ({ entry, maxQty, side, onClick }: RowProps) => {
  const depthPercent = Math.min((entry.quantity / maxQty) * 100, 100);
  // Bitget-style: asks red, bids cyan
  const barColor = side === 'ask' ? 'bg-violet-500/15' : 'bg-white/10';
  const priceColor = side === 'ask' ? 'text-violet-400' : 'text-white';

  return (
    <div 
      className="relative flex items-center justify-between h-[19px] cursor-pointer hover:bg-white/5 transition-colors"
      onClick={() => onClick(entry.price)}
    >
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
  symbol: string;
  currentPrice: number;
  onPriceClick?: (price: number) => void;
}

export const OrderBook = ({ base, quote, symbol, currentPrice, onPriceClick }: OrderBookProps) => {
  const { t } = useTranslation();
  
  const liveOrderBook = useBinanceOrderBook(symbol);
  
  const asks = liveOrderBook?.asks.slice(0, 10).reverse() || [];
  const bids = liveOrderBook?.bids.slice(0, 10) || [];

  const maxAskQty = useMemo(() => asks.length > 0 ? Math.max(...asks.map((e) => e.quantity)) : 1, [asks]);
  const maxBidQty = useMemo(() => bids.length > 0 ? Math.max(...bids.map((e) => e.quantity)) : 1, [bids]);

  const totalBidQty = bids.reduce((s, e) => s + e.quantity, 0);
  const totalAskQty = asks.reduce((s, e) => s + e.quantity, 0);
  const totalDepth = totalBidQty + totalAskQty || 1;
  
  const buyPercent = Math.round((totalBidQty / totalDepth) * 100);
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
      <div className="flex flex-col flex-1 justify-end min-h-[190px]">
        {asks.map((entry, i) => (
          <OrderBookRow key={`ask-${i}`} entry={entry} maxQty={maxAskQty} side="ask" onClick={(p) => onPriceClick?.(p)} />
        ))}
      </div>

      {/* Current price + mark price — Bitget style: large red price with chevron */}
      <div className="flex flex-col items-center justify-center py-px border-y border-zinc-800/50 bg-zinc-900/40">
        <div className="flex items-center gap-0.5 w-full justify-center relative">
          <span className={`text-[15px] font-bold font-mono tabular-nums leading-tight ${currentPrice >= MOCK_MARK_PRICE ? 'text-white' : 'text-violet-400'}`}>
            {formatPrice(currentPrice)}
          </span>
          <ChevronRight size={13} className="text-zinc-500 absolute right-1" />
        </div>
        <span className="text-zinc-500 text-[9px] font-mono tabular-nums leading-tight">
          {formatPrice(MOCK_MARK_PRICE)}
        </span>
      </div>

      {/* Bids (buy side) */}
      <div className="flex flex-col flex-1 justify-start min-h-[190px]">
        {bids.map((entry, i) => (
          <OrderBookRow key={`bid-${i}`} entry={entry} maxQty={maxBidQty} side="bid" onClick={(p) => onPriceClick?.(p)} />
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

import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { ChevronDown, Check, LayoutList, ArrowUp, ArrowDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { formatInstrumentPrice } from '../data/marketData.ts';
import { useCryptoStore } from '../store/useCryptoStore';
import { useOrderBookData } from '../hooks/useOrderBookData';
import type { OrderBookRowData } from '../hooks/useOrderBookData';
import { MarketTrades } from './MarketTrades';

interface ProcessedRow extends OrderBookRowData {
  width: string;
}

const OrderBookRow = memo(({ row, isAsk, onClick }: { row: ProcessedRow; isAsk?: boolean; onClick?: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-[15px] w-full items-center justify-between leading-none cursor-pointer active:bg-zinc-800/50 group"
    >
      <div
        className={`absolute right-0 top-0 bottom-0 transition-all duration-300 ${isAsk ? 'bg-bitget-red/15 group-hover:bg-bitget-red/25' : 'bg-bitget-green/15 group-hover:bg-bitget-green/25'}`}
        style={{ width: row.width }}
      />
      <span className={`${isAsk ? 'text-bitget-red' : 'text-bitget-green'} z-10`}>{row.price}</span>
      <span className="text-zinc-300 z-10">{row.amount}</span>
    </button>
  );
});

export const OrderBookView = memo(() => {
  const { t } = useTranslation();
  
  const amountValue = useCryptoStore(state => state.amountValue);
  const isTPSL = useCryptoStore(state => state.isTPSL);
  const setPrice = useCryptoStore(state => state.setPrice);
  const setOrderType = useCryptoStore(state => state.setOrderType);
  const isTickSizeOpen = useCryptoStore(state => state.isTickSizeOpen);
  const setTickSizeOpen = useCryptoStore(state => state.setTickSizeOpen);
  const setTickSize = useCryptoStore(state => state.setTickSize);
  const orderBookMode = useCryptoStore(state => state.orderBookMode);
  const cycleOrderBookMode = useCryptoStore(state => state.cycleOrderBookMode);
  const setOrderBookCardOpen = useCryptoStore(state => state.setOrderBookCardOpen);

  const { instrument, asks: rawAsks, bids: rawBids, availablePrecisions, activeTickSize } = useOrderBookData();

  const extraRows = (amountValue !== '' ? 1 : 0) + (isTPSL ? 2 : 0);
  const splitCount = 6 + extraRows;
  const fullCount = splitCount * 2 + 1;
  const visibleCount = orderBookMode === 'split' ? splitCount : fullCount;

  // Обрабатываем Asks
  const visibleAsks = useMemo(() => {
    // rawAsks отсортированы от меньшей цены к большей (от спреда наружу)
    const sliced = rawAsks.slice(0, visibleCount);
    
    let totalVol = 0;
    sliced.forEach(r => totalVol += r.rawAmount);

    let cumulative = 0;
    const processed = sliced.map(row => {
      cumulative += row.rawAmount;
      return {
        ...row,
        // Для Asks рендеринг будет перевернут (вверху - самые дорогие). 
        // Кумулятивность считается от спреда, поэтому мы просто суммируем по порядку.
        width: `${Math.min(100, Math.max(10, (cumulative / totalVol) * 100))}%`
      };
    });

    // Переворачиваем массив, чтобы вверху были самые дорогие аски, а внизу (ближе к спреду) самые дешевые
    return processed.reverse();
  }, [rawAsks, visibleCount]);

  // Обрабатываем Bids
  const visibleBids = useMemo(() => {
    // rawBids отсортированы от большей цены к меньшей (от спреда наружу)
    const sliced = rawBids.slice(0, visibleCount);
    
    let totalVol = 0;
    sliced.forEach(r => totalVol += r.rawAmount);

    let cumulative = 0;
    return sliced.map(row => {
      cumulative += row.rawAmount;
      return {
        ...row,
        width: `${Math.min(100, Math.max(10, (cumulative / totalVol) * 100))}%`
      };
    });
  }, [rawBids, visibleCount]);

  const bidVolume = rawBids.slice(0, visibleCount).reduce((total, row) => total + row.rawAmount, 0);
  const askVolume = rawAsks.slice(0, visibleCount).reduce((total, row) => total + row.rawAmount, 0);
  const displayedVolume = bidVolume + askVolume;
  const buyPercent = displayedVolume > 0 ? Math.round((bidVolume / displayedVolume) * 100) : 0;
  const sellPercent = displayedVolume > 0 ? 100 - buyPercent : 0;
  const priceColor = (instrument.changePercent ?? 0) >= 0 ? 'text-bitget-green' : 'text-bitget-red';

  const menuRef = useRef<HTMLDivElement>(null);
  
  // Закрытие меню по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setTickSizeOpen(false);
      }
    };
    if (isTickSizeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTickSizeOpen, setTickSizeOpen]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pl-1 text-xs font-mono select-none">
      <div className="mb-1 flex shrink-0 items-center justify-between relative">
        <span className="text-zinc-500 font-sans">{t('trade.price')}<br />({instrument.quoteAsset})</span>
        <span className="text-zinc-500 text-right font-sans">{t('trade.amount')}<br />({instrument.baseAsset})</span>
      </div>

      {!rawAsks.length && !rawBids.length && <p className="p-2 text-xs text-zinc-500">{t('trade.market.emptyBook')}</p>}
      {/* Asks Grid */}
      {(orderBookMode === 'split' || orderBookMode === 'asks') && (
        <div 
          className="grid min-h-0 flex-1 pb-1"
          style={{ gridTemplateRows: `repeat(${orderBookMode === 'split' ? splitCount : fullCount}, minmax(0, 1fr))` }}
        >
          {visibleAsks.map((ask, index) => (
            <OrderBookRow 
              key={`ask-level-${index}`} 
              row={ask} 
              isAsk 
              onClick={() => {
                setOrderType('limit');
                setPrice(ask.price.replace(/,/g, ''));
              }}
            />
          ))}
        </div>
      )}

      {/* Current Price */}
      <button 
        type="button"
        onClick={() => { haptic.medium(); setOrderBookCardOpen(true); }}
        className="my-0.5 flex shrink-0 flex-col py-1 transition-transform active:scale-95 cursor-pointer text-left"
      >
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${priceColor}`}>{formatInstrumentPrice(instrument)}</span>
          <span className="text-zinc-500 rotate-180">›</span>
        </div>
      </button>

      {/* Bids Grid */}
      {(orderBookMode === 'split' || orderBookMode === 'bids') && (
        <div 
          className="grid min-h-0 flex-1 pt-1"
          style={{ gridTemplateRows: `repeat(${orderBookMode === 'split' ? splitCount : fullCount}, minmax(0, 1fr))` }}
        >
          {visibleBids.map((bid, index) => (
            <OrderBookRow 
              key={`bid-level-${index}`} 
              row={bid} 
              onClick={() => {
                setOrderType('limit');
                setPrice(bid.price.replace(/,/g, ''));
              }}
            />
          ))}
        </div>
      )}

      {/* Buy/Sell Ratio and Precision */}
      <div className="mt-auto flex shrink-0 flex-col gap-1 pt-1">
        <div className="flex items-center text-[10px] gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 bg-bitget-green" style={{ width: `${buyPercent}%` }} />
          <div className="absolute right-0 top-0 bottom-0 bg-bitget-red" style={{ width: `${sellPercent}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 font-sans">
          <span>B {displayedVolume ? buyPercent + '%' : '—'}</span>
          <span>{displayedVolume ? sellPercent + '%' : '—'} S</span>
        </div>

        <div className="flex gap-2 relative" ref={menuRef}>
          <button 
            type="button"
            aria-label="Toggle OrderBook Mode"
            onClick={() => { haptic.light(); cycleOrderBookMode(); }}
            className="flex shrink-0 items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded p-1 cursor-pointer w-7 transition-colors"
          >
            {orderBookMode === 'split' && <LayoutList size={14} className="text-zinc-400" />}
            {orderBookMode === 'bids' && <ArrowUp size={14} className="text-bitget-green" />}
            {orderBookMode === 'asks' && <ArrowDown size={14} className="text-bitget-red" />}
          </button>

          {isTickSizeOpen && (
            <div className="absolute bottom-full right-0 mb-1.5 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 origin-bottom animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="py-1">
                {availablePrecisions.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`flex items-center justify-between w-full px-3 py-2 text-left text-sm ${activeTickSize === p ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-300 hover:bg-zinc-800'}`}
                    onClick={() => {
                      haptic.light();
                      setTickSize(p);
                    }}
                  >
                    <span>{p >= 1 ? p.toFixed(0) : p.toString()}</span>
                    {activeTickSize === p && <Check size={14} className="text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button 
            type="button" 
            aria-label={t('trade.orderBookPrecision')} 
            className={`flex flex-1 items-center justify-between bg-zinc-900 rounded p-1 cursor-pointer transition-colors ${isTickSizeOpen ? 'bg-zinc-800' : ''}`}
            onClick={() => {
              haptic.light();
              setTickSizeOpen(!isTickSizeOpen);
            }}
          >
            <span className="text-zinc-300 font-mono ml-1">
              {activeTickSize >= 1 ? activeTickSize.toFixed(0) : activeTickSize.toString()}
            </span>
            <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isTickSizeOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

export const OrderBook = memo(() => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex gap-4 mb-2 shrink-0 px-1">
        <button 
          type="button"
          onClick={() => { haptic.light(); setActiveTab('book'); }}
          className={`text-sm font-medium transition-colors ${activeTab === 'book' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('trade.orderBook')}
        </button>
        <button 
          type="button"
          onClick={() => { haptic.light(); setActiveTab('trades'); }}
          className={`text-sm font-medium transition-colors ${activeTab === 'trades' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {t('trade.trades')}
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'book' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          <OrderBookView />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'trades' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          <MarketTrades />
        </div>
      </div>
    </div>
  );
});

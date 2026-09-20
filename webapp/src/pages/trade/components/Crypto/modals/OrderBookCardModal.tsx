import { useMemo } from 'react';
import { useTranslation } from '../../../../../i18n';
import { BottomSheet } from '../../../../../shared/ui';
import { useBackButton } from '../../../../../hooks';
import { useCryptoStore, useInstrument } from '../store/useCryptoStore';
import { useOrderBookData } from '../hooks/useOrderBookData';
import { formatInstrumentPrice } from '../data/marketData.ts';

export const OrderBookCardModal = () => {
  const { t } = useTranslation();
  const isOpen = useCryptoStore(state => state.isOrderBookCardOpen);
  const onClose = () => useCryptoStore.getState().setOrderBookCardOpen(false);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const setPrice = useCryptoStore(state => state.setPrice);
  const setOrderType = useCryptoStore(state => state.setOrderType);
  
  const instrument = useInstrument(selectedSymbol);
  const { asks: rawAsks, bids: rawBids } = useOrderBookData();

  useBackButton(isOpen ? onClose : null);

  const priceColor = (instrument.changePercent ?? 0) >= 0 ? 'text-bitget-green' : 'text-bitget-red';

  // Buy/Sell Ratio
  const bidVolume = rawBids.reduce((total, row) => total + row.rawAmount, 0);
  const askVolume = rawAsks.reduce((total, row) => total + row.rawAmount, 0);
  const displayedVolume = bidVolume + askVolume;
  const buyPercent = displayedVolume > 0 ? Math.round((bidVolume / displayedVolume) * 100) : 50;
  const sellPercent = 100 - buyPercent;

  const ROW_COUNT = 30;

  // Process Bids (Left Column)
  const visibleBids = useMemo(() => {
    // rawBids is sorted from spread outwards (highest price to lowest)
    const sliced = rawBids.slice(0, ROW_COUNT);
    let totalVol = 0;
    sliced.forEach(r => totalVol += r.rawAmount);
    
    let cumulative = 0;
    return sliced.map(row => {
      cumulative += row.rawAmount;
      return {
        ...row,
        width: `${Math.min(100, Math.max(5, (cumulative / totalVol) * 100))}%`
      };
    });
  }, [rawBids]);

  // Process Asks (Right Column)
  const visibleAsks = useMemo(() => {
    // rawAsks is sorted from spread outwards (lowest price to highest)
    const sliced = rawAsks.slice(0, ROW_COUNT);
    let totalVol = 0;
    sliced.forEach(r => totalVol += r.rawAmount);
    
    let cumulative = 0;
    return sliced.map(row => {
      cumulative += row.rawAmount;
      return {
        ...row,
        width: `${Math.min(100, Math.max(5, (cumulative / totalVol) * 100))}%`
      };
    });
  }, [rawAsks]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} fullHeight noPadding>
      <div className="flex flex-col h-full text-zinc-100 font-sans pb-4">
        {/* Header */}
        <div className="px-4 py-3 shrink-0">
          <h2 className="text-xl font-bold">{t('trade.orderBook')}</h2>
        </div>

        {/* Prices Header */}
        <div className="flex justify-between items-end px-4 mt-2 shrink-0">
          <div className={`text-[28px] font-bold leading-none ${priceColor} tracking-tight`}>
            {formatInstrumentPrice(instrument)}
          </div>
          <div className="flex items-center gap-1.5 pb-1">
            <span className="text-[12px] text-zinc-500">{t('trade.markPrice')}</span>
            <span className="text-[13px] text-zinc-300 font-medium border-b border-dashed border-zinc-600">
              {formatInstrumentPrice(instrument)}
            </span>
          </div>
        </div>

        {/* Ratio Bar */}
        <div className="px-4 mt-6 shrink-0 flex flex-col gap-1.5">
          <div className="flex items-center text-[10px] gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 bg-bitget-green" style={{ width: `${buyPercent}%` }} />
            <div className="absolute right-0 top-0 bottom-0 bg-bitget-red" style={{ width: `${sellPercent}%` }} />
          </div>
          <div className="flex justify-between text-[11px] font-medium font-sans">
            <span className="text-bitget-green">B {buyPercent}%</span>
            <span className="text-bitget-red">{sellPercent}% S</span>
          </div>
        </div>

        {/* Data Grid Header */}
        <div className="flex px-4 mt-6 mb-2 text-[11px] text-zinc-500 shrink-0">
          {/* Left half headers */}
          <div className="flex-1 flex justify-between pr-2">
            <span>{t('trade.amount')}({instrument.baseAsset})</span>
            <span>{t('trade.price')}({instrument.quoteAsset})</span>
          </div>
          {/* Right half headers */}
          <div className="flex-1 flex justify-between pl-2">
            <span>{t('trade.price')}({instrument.quoteAsset})</span>
            <span>{t('trade.amount')}({instrument.baseAsset})</span>
          </div>
        </div>

        {/* Data Grid Body */}
        <div className="flex-1 flex overflow-y-auto px-4 min-h-0 text-[12px] font-mono select-none custom-scrollbar">
          {/* Bids Column */}
          <div className="flex-1 flex flex-col pr-1">
            {visibleBids.map((bid, i) => (
              <button
                type="button"
                key={i}
                className="relative flex min-h-[22px] items-center justify-between"
                onClick={() => {
                  setOrderType('limit');
                  setPrice(bid.price.replace(/,/g, ''));
                  onClose();
                }}
              >
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-bitget-green/15"
                  style={{ width: bid.width }}
                />
                <span className="text-zinc-300 z-10 pl-1">{bid.amount}</span>
                <span className="text-bitget-green z-10 pr-1">{bid.price}</span>
              </button>
            ))}
          </div>
          
          {/* Asks Column */}
          <div className="flex-1 flex flex-col pl-1">
            {visibleAsks.map((ask, i) => (
              <button
                type="button"
                key={i}
                className="relative flex min-h-[22px] items-center justify-between"
                onClick={() => {
                  setOrderType('limit');
                  setPrice(ask.price.replace(/,/g, ''));
                  onClose();
                }}
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-bitget-red/15"
                  style={{ width: ask.width }}
                />
                <span className="text-bitget-red z-10 pl-1">{ask.price}</span>
                <span className="text-zinc-300 z-10 pr-1">{ask.amount}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
};

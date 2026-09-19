import { memo, useMemo } from 'react';
import { ChevronDown, ListFilter } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { formatInstrumentPrice, getMockInstrument, MockInstrument } from '../data/mockInstruments.ts';
import { useCryptoStore } from '../store/useCryptoStore';

const VISIBLE_ROWS_PER_SIDE = 7;

// Хеш-функция для генерации псевдослучайной стабильной ширины бара на основе цены
const getStableWidth = (price: string) => {
  let hash = 0;
  for (let i = 0; i < price.length; i++) {
    hash = price.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = Math.abs(hash) % 90 + 10; // От 10% до 100%
  return `${val}%`;
};

const OrderBookRow = memo(({ price, amount, isAsk }: { price: string; amount: string; isAsk?: boolean }) => {
  const width = useMemo(() => getStableWidth(price), [price]);
  return (
    <div className="relative flex min-h-[15px] items-center justify-between leading-none">
      <div
        className={`absolute right-0 top-0 bottom-0 ${isAsk ? 'bg-bitget-red/15' : 'bg-bitget-green/15'}`}
        style={{ width }}
      />
      <span className={`${isAsk ? 'text-bitget-red' : 'text-bitget-green'} z-10`}>{price}</span>
      <span className="text-zinc-300 z-10">{amount}</span>
    </div>
  );
});

const createBookRows = (
  instrument: MockInstrument,
  direction: 'ask' | 'bid',
  count: number,
  amountMultiplier: number,
) => {
  const step = 10 ** -instrument.priceDecimals;
  const seed = Array.from(instrument.symbol).reduce((total, char) => total + char.charCodeAt(0), 0);

  return Array.from({ length: count }, (_, index) => {
    const level = direction === 'ask' ? count - index : index + 1;
    const price = instrument.price + (direction === 'ask' ? step * level : -step * level);
    const amount = ((seed % 37 + 18) * (index + 1) * amountMultiplier / 10).toFixed(2);
    return {
      price: formatInstrumentPrice(instrument, Math.max(0, price)),
      amount: `${amount}K`,
    };
  });
};

export const OrderBook = memo(() => {
  const amountPercent = useCryptoStore(state => state.amountPercent);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const { t } = useTranslation();
  const instrument = getMockInstrument(selectedSymbol);

  const asks = useMemo(
    () => createBookRows(instrument, 'ask', VISIBLE_ROWS_PER_SIDE, 1 + amountPercent / 100),
    [amountPercent, instrument],
  );
  const bids = useMemo(
    () => createBookRows(instrument, 'bid', VISIBLE_ROWS_PER_SIDE, 1.15 + amountPercent / 120),
    [amountPercent, instrument],
  );
  const buyPercent = Math.round(Math.min(70, Math.max(30, 50 + instrument.changePercent * 1.5)));
  const sellPercent = 100 - buyPercent;
  const priceColor = instrument.changePercent >= 0 ? 'text-bitget-green' : 'text-bitget-red';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pl-1 text-xs font-mono select-none">
      <div className="mb-1 flex shrink-0 items-center justify-between">
        <span className="text-zinc-500 font-sans">{t('trade.price')}<br />({instrument.quoteAsset})</span>
        <span className="text-zinc-500 text-right font-sans">{t('trade.amount')}<br />({instrument.baseAsset})</span>
      </div>

      {/* Asks */}
      <div className="grid min-h-0 flex-1 grid-rows-7 pb-1">
        {asks.map((ask) => (
          <OrderBookRow key={`ask-${ask.price}`} price={ask.price} amount={ask.amount} isAsk />
        ))}
      </div>

      {/* Current Price */}
      <div className="my-0.5 flex shrink-0 flex-col py-1">
        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${priceColor}`}>{formatInstrumentPrice(instrument)}</span>
          <span className="text-zinc-500 rotate-180">›</span>
        </div>
      </div>

      {/* Bids */}
      <div className="grid min-h-0 flex-1 grid-rows-7 pt-1">
        {bids.map((bid) => (
          <OrderBookRow key={`bid-${bid.price}`} price={bid.price} amount={bid.amount} />
        ))}
      </div>

      {/* Buy/Sell Ratio and Precision */}
      <div className="mt-auto flex shrink-0 flex-col gap-1 pt-1">
        <div className="flex items-center text-[10px] gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 bg-bitget-green" style={{ width: `${buyPercent}%` }} />
          <div className="absolute right-0 top-0 bottom-0 bg-bitget-red" style={{ width: `${sellPercent}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 font-sans">
          <span>B {buyPercent}%</span>
          <span>{sellPercent}% S</span>
        </div>

        <button type="button" aria-label={t('trade.orderBookPrecision')} className="flex items-center justify-between bg-zinc-900 rounded p-1 cursor-pointer" onClick={() => haptic.light()}>
          <ListFilter size={14} className="text-zinc-400" />
          <span className="text-zinc-300">{(10 ** -instrument.priceDecimals).toFixed(instrument.priceDecimals)}</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </button>
      </div>
    </div>
  );
});

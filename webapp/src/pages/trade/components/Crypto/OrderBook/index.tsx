import { memo, useMemo } from 'react';
import { ChevronDown, ListFilter } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

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
    <div className="flex justify-between items-center relative h-[16px]">
      <div
        className={`absolute right-0 top-0 bottom-0 ${isAsk ? 'bg-bitget-red/15' : 'bg-bitget-green/15'}`}
        style={{ width }}
      />
      <span className={`${isAsk ? 'text-bitget-red' : 'text-bitget-green'} z-10`}>{price}</span>
      <span className="text-zinc-300 z-10">{amount}</span>
    </div>
  );
});

export const OrderBook = memo(() => {
  const amountPercent = useCryptoStore(state => state.amountPercent);
  const isTPSL = useCryptoStore(state => state.isTPSL);
  const side = useCryptoStore(state => state.side);
  const { t } = useTranslation();

  const asks = useMemo(() => {
    let baseAsks = side === 'sell' ? [
      { price: '0.01315', amount: '171.21K' },
      { price: '0.01314', amount: '27.44K' },
      { price: '0.01313', amount: '70.29K' },
      { price: '0.01312', amount: '30.34K' },
    ] : [
      { price: '0.01316', amount: '276.85K' },
      { price: '0.01315', amount: '171.21K' },
      { price: '0.01314', amount: '27.44K' },
      { price: '0.01313', amount: '70.29K' },
      { price: '0.01312', amount: '30.34K' },
    ];

    if (amountPercent > 0) {
      const askPrice = side === 'sell' ? '0.01316' : '0.01317';
      baseAsks.unshift({ price: askPrice, amount: (amountPercent * 1.5).toFixed(2) + 'K' });
    }
    
    if (isTPSL && side === 'buy') {
      baseAsks.unshift({ price: '0.01318', amount: '21.05K' });
      baseAsks.unshift({ price: '0.01319', amount: '8.44K' });
    }
    return baseAsks;
  }, [amountPercent, isTPSL, side]);

  const bids = useMemo(() => {
    let baseBids = side === 'sell' ? [
      { price: '0.01311', amount: '11.06K' },
      { price: '0.01310', amount: '41.70K' },
      { price: '0.01309', amount: '69.23K' },
      { price: '0.01308', amount: '65.75K' },
    ] : [
      { price: '0.01311', amount: '11.06K' },
      { price: '0.01310', amount: '41.70K' },
      { price: '0.01309', amount: '69.23K' },
      { price: '0.01308', amount: '65.75K' },
      { price: '0.01307', amount: '63.24K' },
    ];
    
    if (amountPercent > 0) {
      const bidPrice = side === 'sell' ? '0.01307' : '0.01306';
      baseBids.push({ price: bidPrice, amount: (amountPercent * 1.2).toFixed(2) + 'K' });
    }
    
    if (isTPSL && side === 'buy') {
      baseBids.push({ price: '0.01305', amount: '18.30K' });
      baseBids.push({ price: '0.01304', amount: '45.12K' });
    }
    return baseBids;
  }, [amountPercent, isTPSL, side]);

  return (
    <div className="flex flex-col flex-1 pl-1 text-xs font-mono select-none">
      <div className="flex justify-between items-center mb-2">
        <span className="text-zinc-500 font-sans">{t('trade.price')}<br />(USDT)</span>
        <span className="text-zinc-500 text-right font-sans">{t('trade.amount')}<br />(CP)</span>
      </div>

      {/* Asks */}
      <div className="flex flex-col gap-1 flex-1 justify-end pb-2">
        {asks.map((ask) => (
          <OrderBookRow key={`ask-${ask.price}`} price={ask.price} amount={ask.amount} isAsk />
        ))}
      </div>

      {/* Current Price */}
      <div className="flex flex-col py-1.5 my-1">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-bitget-green">0.01311</span>
          <span className="text-zinc-500 rotate-180">›</span>
        </div>
      </div>

      {/* Bids */}
      <div className="flex flex-col gap-1 flex-1 pt-2">
        {bids.map((bid) => (
          <OrderBookRow key={`bid-${bid.price}`} price={bid.price} amount={bid.amount} />
        ))}
      </div>

      {/* Buy/Sell Ratio and Precision */}
      <div className="flex flex-col mt-auto pt-2 gap-2">
        <div className="flex items-center text-[10px] gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 bg-bitget-green w-[48%]" />
          <div className="absolute right-0 top-0 bottom-0 bg-bitget-red w-[52%]" />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 font-sans">
          <span>B 48%</span>
          <span>52% S</span>
        </div>

        <button type="button" aria-label={t('trade.orderBookPrecision')} className="flex items-center justify-between bg-zinc-900 rounded p-1 mt-1 cursor-pointer" onClick={() => haptic.light()}>
          <ListFilter size={14} className="text-zinc-400" />
          <span className="text-zinc-300">0.00001</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </button>
      </div>
    </div>
  );
});

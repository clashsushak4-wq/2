import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { formatByStep } from '../domain/orderCalculations';
import { normalizePrice } from '../domain/orderNormalization';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { toInstrumentSpec, formatWithSpaces } from '../data/marketData';

export const PriceInput = () => {
  const orderType = useCryptoStore(state => state.orderType);
  const price = useCryptoStore(state => state.price);
  const setPrice = useCryptoStore(state => state.setPrice);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);
  const spec = toInstrumentSpec(instrument as any);

  const handleIncrease = () => {
    const currentPrice = normalizePrice(Number(price.replace(/\s/g, '')), spec);
    if (currentPrice === 0) return;
    setPrice(formatByStep(currentPrice + spec.tickSize, spec.tickSize));
    haptic.light();
  };

  const handleDecrease = () => {
    const currentPrice = normalizePrice(Number(price.replace(/\s/g, '')), spec);
    if (currentPrice === 0) return;
    setPrice(formatByStep(Math.max(spec.tickSize, currentPrice - spec.tickSize), spec.tickSize));
    haptic.light();
  };

  if (orderType === 'market') {
    return (
      <div className="mb-1 flex items-center gap-1.5">
        <div className="flex h-9 flex-1 items-center rounded bg-zinc-900 px-3 py-1.5">
          <span className="text-[13px] text-zinc-500 font-medium tracking-wide">{t('trade.executeAtMarket')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1 flex items-center justify-between rounded bg-zinc-900 px-2 py-0.5">
      <div className="flex-1 flex flex-col">
        <label htmlFor="trade-limit-price" className="text-[10px] leading-tight text-zinc-400">{t('trade.price')} ({instrument.quoteAsset})</label>
        <input
          id="trade-limit-price"
          type="text"
          inputMode="decimal"
          value={formatWithSpaces(price)}
          onChange={(event) => {
            const raw = event.target.value.replace(/\s/g, '');
            if (/^\d*(\.\d*)?$/.test(raw)) setPrice(raw);
          }}
          className="w-full bg-transparent text-sm font-bold leading-tight text-zinc-100 outline-none"
        />
      </div>
      <div className="flex items-center gap-1 shrink-0 h-full">
        <button type="button" className="bg-zinc-800 rounded w-7 h-7 flex items-center justify-center text-zinc-200 cursor-pointer" onClick={handleDecrease}>
          <span className="text-sm font-bold select-none leading-none">-</span>
        </button>
        <button type="button" className="bg-zinc-800 rounded w-7 h-7 flex items-center justify-center text-zinc-200 cursor-pointer" onClick={handleIncrease}>
          <span className="text-sm font-bold select-none leading-none">+</span>
        </button>
      </div>
    </div>
  );
};

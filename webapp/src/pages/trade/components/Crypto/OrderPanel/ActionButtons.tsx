import { haptic } from '../../../../../utils';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { useOrderCalculations } from '../hooks/useOrderCalculations';

export const ActionButtons = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const amountPercent = useCryptoStore(state => state.amountPercent);
  const setAmountPercent = useCryptoStore.getState().setAmountPercent;
  const showToast = useCryptoStore.getState().showToast;
  const instrument = useInstrument(selectedSymbol);
  const { quoteCost, maxToOpen, liqPriceLong, liqPriceShort, isValid } = useOrderCalculations();

  const handleAction = (actionSide: 'buy' | 'sell') => {
    haptic.medium();
    if (!isValid) {
      if (amountPercent === 0) {
        showToast('Please enter an amount', 'error');
      } else {
        showToast('Insufficient margin for this order', 'error');
      }
      return;
    }
    
    showToast(`Order placed: ${actionSide.toUpperCase()} ${instrument.symbol}`, 'success');
    setAmountPercent(0);
  };

  return (
    <div className="mt-2 flex flex-col gap-3">
      {/* Long Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
          <span>Макс. для открытия</span>
          <span className="text-zinc-200 font-medium font-mono">{maxToOpen.toFixed(4)} {instrument.baseAsset}</span>
        </div>
        {amountPercent > 0 && (
          <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
            <span>Ликв.цена</span>
            <span className="text-zinc-200 font-medium font-mono">{liqPriceLong.toFixed(instrument.priceDecimals)} {instrument.quoteAsset}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => handleAction('buy')}
          className={`mt-1 flex min-h-11 w-full flex-col items-center justify-center rounded-xl px-2 py-1.5 text-white transition-all active:scale-95 ${
            !isValid && amountPercent > 0 ? 'bg-bitget-green/50 cursor-not-allowed' : 'bg-bitget-green'
          }`}
        >
          <span className="font-bold text-base leading-tight">Открыть лонг</span>
          <span className="text-[10px] text-white/70 font-medium -mt-0.5">{quoteCost.toFixed(2)} {instrument.quoteAsset}</span>
        </button>
      </div>

      {/* Short Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
          <span>Макс. для открытия</span>
          <span className="text-zinc-200 font-medium font-mono">{maxToOpen.toFixed(4)} {instrument.baseAsset}</span>
        </div>
        {amountPercent > 0 && (
          <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
            <span>Ликв.цена</span>
            <span className="text-zinc-200 font-medium font-mono">{liqPriceShort.toFixed(instrument.priceDecimals)} {instrument.quoteAsset}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => handleAction('sell')}
          className={`mt-1 flex min-h-11 w-full flex-col items-center justify-center rounded-xl px-2 py-1.5 text-white transition-all active:scale-95 ${
            !isValid && amountPercent > 0 ? 'bg-bitget-red/50 cursor-not-allowed' : 'bg-bitget-red'
          }`}
        >
          <span className="font-bold text-base leading-tight">Открыть шорт</span>
          <span className="text-[10px] text-white/70 font-medium -mt-0.5">{quoteCost.toFixed(2)} {instrument.quoteAsset}</span>
        </button>
      </div>
    </div>
  );
};

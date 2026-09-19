import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { useOrderCalculations } from '../hooks/useOrderCalculations';

export const ActionButtons = () => {
  const side = useCryptoStore(state => state.side);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);
  const { quoteCost } = useOrderCalculations();

  return (
    <div className="mt-1 flex flex-col gap-1">
      <button
        type="button"
        onClick={() => haptic.medium()}
        className="flex min-h-11 w-full flex-col items-center justify-center rounded-xl bg-bitget-green px-2 py-1.5 text-white transition-transform active:scale-95"
      >
        <span className="font-bold text-base leading-tight">{t(side === 'buy' ? 'trade.openLong' : 'trade.closeLong')}</span>
        <span className="text-[10px] text-white/70 font-medium -mt-0.5">{quoteCost.toFixed(2)} {instrument.quoteAsset}</span>
      </button>

      <button
        type="button"
        onClick={() => haptic.medium()}
        className="flex min-h-11 w-full flex-col items-center justify-center rounded-xl bg-bitget-red px-2 py-1.5 text-white transition-transform active:scale-95"
      >
        <span className="font-bold text-base leading-tight">{t(side === 'buy' ? 'trade.openShort' : 'trade.closeShort')}</span>
        <span className="text-[10px] text-white/70 font-medium -mt-0.5">{quoteCost.toFixed(2)} {instrument.quoteAsset}</span>
      </button>
    </div>
  );
};

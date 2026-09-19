import { useTranslation } from '../../../../../i18n';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';

export const BalanceInfo = () => {
  const { t } = useTranslation();
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const side = useCryptoStore(state => state.side);
  const availableBalance = useCryptoStore(state => state.availableBalance);
  const instrument = useInstrument(selectedSymbol);
  
  const asset = side === 'buy' ? instrument.quoteAsset : instrument.baseAsset;

  return (
    <div className="mb-0.5 mt-1 flex flex-col gap-0.5 font-sans text-[11px]">
      <div className="flex justify-between items-center text-zinc-400">
        <span>{t('trade.available')}</span>
        <span className="text-zinc-200 font-mono font-medium">{availableBalance.toFixed(2)} {asset}</span>
      </div>
    </div>
  );
};

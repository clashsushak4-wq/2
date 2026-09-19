import { useTranslation } from '../../../../../i18n';
import { getMockInstrument } from '../data/mockInstruments.ts';
import { useCryptoStore } from '../store/useCryptoStore';

export const BalanceInfo = () => {
  const { t } = useTranslation();
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const side = useCryptoStore(state => state.side);
  const instrument = getMockInstrument(selectedSymbol);

  // Моковые данные для шаблона
  const available = '0.00';
  const maxToOpen = '0.00';
  const asset = side === 'buy' ? instrument.quoteAsset : instrument.baseAsset;

  return (
    <div className="mb-0.5 mt-1 flex flex-col gap-0.5 font-sans text-[11px]">
      <div className="flex justify-between items-center text-zinc-400">
        <span>{t('trade.available')}</span>
        <span className="text-zinc-200 font-mono font-medium">{available} {asset}</span>
      </div>
      <div className="flex justify-between items-center text-zinc-400">
        <span>{t('trade.maxToOpen')}</span>
        <span className="text-zinc-200 font-mono font-medium">{maxToOpen} {instrument.baseAsset}</span>
      </div>
    </div>
  );
};

import { useTranslation } from '../../../../../i18n';
import { useOrderCalculations } from '../hooks/useOrderCalculations';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';

export const BalanceInfo = () => {
  const { t } = useTranslation();
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const instrument = useInstrument(selectedSymbol);
  const { account } = useOrderCalculations();

  return (
    <div className="mb-0.5 mt-1 flex flex-col gap-0.5 font-sans text-[11px]">
      <div className="flex justify-between items-center text-zinc-400">
        <span>{t('trade.available')}</span>
        <span className="text-zinc-200 font-mono font-medium">{account.availableBalance.toFixed(2)} {instrument.quoteAsset}</span>
      </div>
      <div className="flex justify-between items-center text-zinc-500">
        <span>{t('trade.equity')}</span>
        <span className="font-mono">{account.equity.toFixed(2)} {instrument.quoteAsset}</span>
      </div>
    </div>
  );
};

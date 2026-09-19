import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const SideToggle = () => {
  const side = useCryptoStore(state => state.side);
  const setSide = useCryptoStore.getState().setSide;
  const { t } = useTranslation();

  return (
    <div className="mb-1 flex rounded bg-zinc-900 p-0.5">
      <button
        type="button"
        aria-pressed={side === 'buy'}
        onClick={() => { haptic.light(); setSide('buy'); }}
        className={`flex-1 py-1 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'buy' ? 'bg-bitget-green text-white' : 'text-zinc-400'}`}
      >
        {t('trade.openTab')}
      </button>
      <button
        type="button"
        aria-pressed={side === 'sell'}
        onClick={() => { haptic.light(); setSide('sell'); }}
        className={`flex-1 py-1 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'sell' ? 'bg-bitget-red text-white' : 'text-zinc-400'}`}
      >
        {t('trade.closeTab')}
      </button>
    </div>
  );
};

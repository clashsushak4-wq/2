import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const SideToggle = () => {
  const orderIntent = useCryptoStore(state => state.orderIntent);
  const setOrderIntent = useCryptoStore.getState().setOrderIntent;
  const { t } = useTranslation();

  return (
    <div className="mb-1 flex rounded bg-zinc-900 p-0.5">
      <button
        type="button"
        aria-pressed={orderIntent === 'open'}
        onClick={() => { haptic.light(); setOrderIntent('open'); }}
        className={`flex-1 py-1 text-center text-sm font-medium rounded cursor-pointer transition-colors ${orderIntent === 'open' ? 'bg-bitget-green text-white' : 'text-zinc-400'}`}
      >
        {t('trade.openTab')}
      </button>
      <button
        type="button"
        aria-pressed={orderIntent === 'close'}
        onClick={() => { haptic.light(); setOrderIntent('close'); }}
        className={`flex-1 py-1 text-center text-sm font-medium rounded cursor-pointer transition-colors ${orderIntent === 'close' ? 'bg-bitget-red text-white' : 'text-zinc-400'}`}
      >
        {t('trade.closeTab')}
      </button>
    </div>
  );
};

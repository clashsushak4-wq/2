import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const MarginSettings = () => {
  const leverage = useCryptoStore(state => state.leverage);
  const marginMode = useCryptoStore(state => state.marginMode);
  const setLeverageOpen = useCryptoStore.getState().setLeverageOpen;
  const setMarginModeOpen = useCryptoStore.getState().setMarginModeOpen;
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 mb-2">
      <button 
        type="button" 
        aria-haspopup="dialog"
        className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1.5 rounded truncate flex-1 flex items-center justify-center cursor-pointer" 
        onClick={() => { haptic.light(); setMarginModeOpen(true); }}
      >
        {t(marginMode === 'cross' ? 'trade.cross' : 'trade.isolated')}
      </button>
      <button 
        type="button" 
        aria-haspopup="dialog" 
        className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1.5 rounded truncate flex-1 flex items-center justify-center cursor-pointer" 
        onClick={() => { haptic.light(); setLeverageOpen(true); }}
      >
        {leverage}x
      </button>
    </div>
  );
};

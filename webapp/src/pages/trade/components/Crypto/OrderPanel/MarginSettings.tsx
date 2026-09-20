import { haptic } from '../../../../../utils';

import { useCryptoStore } from '../store/useCryptoStore';

export const MarginSettings = () => {
  const leverage = useCryptoStore(state => state.leverage);
  const setLeverageOpen = useCryptoStore.getState().setLeverageOpen;

  return (
    <div className="mb-1 flex items-center gap-1">

      <button 
        type="button" 
        aria-haspopup="dialog" 
        className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded truncate flex-1 flex items-center justify-center cursor-pointer"
        onClick={() => { haptic.light(); setLeverageOpen(true); }}
      >
        {leverage}x
      </button>
    </div>
  );
};

import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const MarginSettings = () => {
  const leverage = useCryptoStore(state => state.leverage);
  const setLeverageOpen = useCryptoStore.getState().setLeverageOpen;

  return (
    <div className="flex items-center gap-1 mb-2">
      <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded truncate flex-1 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
        Изолиров...
      </div>
      <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded w-8 flex items-center justify-center cursor-pointer" onClick={() => { haptic.light(); setLeverageOpen(true); }}>
        {leverage}x
      </div>
      <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded w-10 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
        B/R
      </div>
    </div>
  );
};

import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const ActionButtons = () => {
  const side = useCryptoStore(state => state.side);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <button
        onClick={() => haptic.medium()}
        className="w-full py-2.5 bg-white text-black rounded-lg flex flex-col items-center justify-center transition-transform active:scale-95"
      >
        <span className="font-bold text-base leading-tight">{side === 'buy' ? 'Открыть лонг' : 'Закрыть лонг'}</span>
        <span className="text-[10px] text-zinc-600 font-medium -mt-0.5">0.00 USDT</span>
      </button>

      <button
        onClick={() => haptic.medium()}
        className="w-full py-2.5 bg-zinc-800 text-white border border-zinc-600 rounded-lg flex flex-col items-center justify-center transition-transform active:scale-95"
      >
        <span className="font-bold text-base leading-tight">{side === 'buy' ? 'Открыть шорт' : 'Закрыть шорт'}</span>
        <span className="text-[10px] text-zinc-400 font-medium -mt-0.5">0.00 USDT</span>
      </button>
    </div>
  );
};

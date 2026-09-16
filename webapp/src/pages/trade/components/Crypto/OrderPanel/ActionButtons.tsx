import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const ActionButtons = () => {
  const side = useCryptoStore(state => state.side);

  return (
    <div className="flex flex-col gap-2 mt-2">
      <button
        onClick={() => haptic.medium()}
        className="w-full py-2.5 bg-bitget-green text-white rounded-lg flex flex-col items-center justify-center transition-transform active:scale-95"
      >
        <span className="font-bold text-base leading-tight">{side === 'buy' ? 'Открыть лонг' : 'Закрыть лонг'}</span>
        <span className="text-[10px] text-white/70 font-medium -mt-0.5">0.00 USDT</span>
      </button>

      <button
        onClick={() => haptic.medium()}
        className="w-full py-2.5 bg-bitget-red text-white rounded-lg flex flex-col items-center justify-center transition-transform active:scale-95"
      >
        <span className="font-bold text-base leading-tight">{side === 'buy' ? 'Открыть шорт' : 'Закрыть шорт'}</span>
        <span className="text-[10px] text-white/70 font-medium -mt-0.5">0.00 USDT</span>
      </button>
    </div>
  );
};

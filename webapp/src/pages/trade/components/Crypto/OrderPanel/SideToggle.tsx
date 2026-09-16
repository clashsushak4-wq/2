import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const SideToggle = () => {
  const side = useCryptoStore(state => state.side);
  const setSide = useCryptoStore.getState().setSide;

  return (
    <div className="flex bg-zinc-900 rounded p-0.5 mb-2">
      <div
        onClick={() => { haptic.light(); setSide('buy'); }}
        className={`flex-1 py-1.5 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'buy' ? 'bg-bitget-green text-white' : 'text-zinc-400'}`}
      >
        Открыть
      </div>
      <div
        onClick={() => { haptic.light(); setSide('sell'); }}
        className={`flex-1 py-1.5 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'sell' ? 'bg-bitget-red text-white' : 'text-zinc-400'}`}
      >
        Закрыть
      </div>
    </div>
  );
};

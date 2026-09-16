import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const OrderTypeSelect = () => {
  const orderType = useCryptoStore(state => state.orderType);
  const setOrderTypeOpen = useCryptoStore.getState().setOrderTypeOpen;

  return (
    <div 
      className="flex items-center justify-between bg-black border border-zinc-700 rounded px-2 py-1.5 mb-2 cursor-pointer" 
      onClick={() => { haptic.light(); setOrderTypeOpen(true); }}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full border border-zinc-500 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        </div>
        <span className="text-sm font-bold text-zinc-100">
          {orderType === 'limit' ? 'Лимитный' : 'Рыночный'}
        </span>
      </div>
      <ChevronDown size={16} className="text-zinc-500" />
    </div>
  );
};

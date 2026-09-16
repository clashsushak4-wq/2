import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const PriceInput = () => {
  const orderType = useCryptoStore(state => state.orderType);

  if (orderType === 'market') {
    return (
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 bg-zinc-900/60 rounded px-3 py-2 flex items-center border border-zinc-800/80 h-[42px]">
          <span className="text-[13px] text-zinc-500 font-medium tracking-wide">Исполнить по рыночной цене</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="flex-1 bg-black rounded px-2 py-1 flex flex-col border border-zinc-700">
        <span className="text-[10px] text-zinc-400">Цена(USDT)</span>
        <input
          type="text"
          defaultValue="0.01312"
          className="bg-transparent text-sm font-bold text-zinc-100 outline-none w-full"
        />
      </div>
      <div className="bg-zinc-800 rounded px-2 py-1 h-full flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
        <span className="text-xs font-bold text-zinc-200">BBO</span>
      </div>
    </div>
  );
};

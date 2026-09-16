import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const TPSLSettings = () => {
  const isTPSL = useCryptoStore(state => state.isTPSL);
  const setIsTPSL = useCryptoStore.getState().setIsTPSL;
  const side = useCryptoStore(state => state.side);

  if (side === 'sell') return null;

  return (
    <>
      <div className={`flex items-center justify-between ${isTPSL ? 'mb-1.5' : 'mb-2'}`}>
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { haptic.light(); setIsTPSL(!isTPSL); }}>
          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${isTPSL ? 'bg-zinc-300 border-none' : 'border border-zinc-500'}`}>
            {isTPSL && <div className="w-1.5 h-1.5 bg-zinc-900 rounded-sm" />}
          </div>
          <span className="text-xs text-zinc-300 font-medium">TP/SL</span>
        </div>
        {isTPSL && <span className="text-[10px] text-zinc-400">Продвинутая</span>}
      </div>

      {isTPSL && (
        <div className="flex flex-col gap-1.5 mb-2">
          {/* TP Input */}
          <div className="bg-black rounded px-2 py-1.5 flex items-center justify-between border border-zinc-700">
            <span className="text-xs text-zinc-400">TP (USDT)</span>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => haptic.light()}>
              <span className="text-xs text-zinc-100">Цена</span>
              <ChevronDown size={12} className="text-zinc-500" />
            </div>
          </div>
          {/* SL Input */}
          <div className="bg-black rounded px-2 py-1.5 flex items-center justify-between border border-zinc-700">
            <span className="text-xs text-zinc-400">SL (USDT)</span>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => haptic.light()}>
              <span className="text-xs text-zinc-100">Цена</span>
              <ChevronDown size={12} className="text-zinc-500" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

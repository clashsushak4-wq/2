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
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${isTPSL ? 'bg-bitget-green' : 'bg-zinc-800'}`}>
            {isTPSL && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
          </div>
          <span className="text-xs text-zinc-300 font-medium">TP/SL</span>
        </div>
        {isTPSL && <span className="text-[10px] text-zinc-400">Продвинутая</span>}
      </div>

      {isTPSL && (
        <div className="flex flex-col gap-1.5 mb-2">
          {/* TP Input */}
          <div className="bg-zinc-900 rounded px-2 py-1.5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">TP (USDT)</span>
            <div className="flex items-center gap-1 cursor-pointer" onClick={() => haptic.light()}>
              <span className="text-xs text-zinc-100">Цена</span>
              <ChevronDown size={12} className="text-zinc-500" />
            </div>
          </div>
          {/* SL Input */}
          <div className="bg-zinc-900 rounded px-2 py-1.5 flex items-center justify-between">
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

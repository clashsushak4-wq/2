import { useState } from 'react';
import { ChevronDown, PlusSquare } from 'lucide-react';
import { haptic } from '../../../../utils';
import { LeverageModal } from './LeverageModal';
import { OrderTypeModal } from './OrderTypeModal';

interface OrderPanelProps {
  amountPercent: number;
  setAmountPercent: (val: number) => void;
  isTPSL: boolean;
  setIsTPSL: (val: boolean) => void;
}

export const OrderPanel = ({ amountPercent, setAmountPercent, isTPSL, setIsTPSL }: OrderPanelProps) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [isOrderTypeOpen, setIsOrderTypeOpen] = useState(false);
  const [leverage, setLeverage] = useState(3);
  const [isLeverageOpen, setIsLeverageOpen] = useState(false);

  return (
    <div className="flex flex-col flex-[1.2] pr-1 border-r border-zinc-900/50 select-none">

      {/* Margin Settings */}
      <div className="flex items-center gap-1 mb-2">
        <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded truncate flex-1 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
          Изолиров...
        </div>
        <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded w-8 flex items-center justify-center cursor-pointer" onClick={() => { haptic.light(); setIsLeverageOpen(true); }}>
          {leverage}x
        </div>
        <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded w-10 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
          B/R
        </div>
      </div>

      {/* Open/Close Toggles */}
      <div className="flex bg-black border border-zinc-800 rounded p-0.5 mb-2">
        <div
          onClick={() => { haptic.light(); setSide('buy'); }}
          className={`flex-1 py-1.5 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'buy' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Открыть
        </div>
        <div
          onClick={() => { haptic.light(); setSide('sell'); }}
          className={`flex-1 py-1.5 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'sell' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
        >
          Закрыть
        </div>
      </div>

      {/* Order Type */}
      <div 
        className="flex items-center justify-between bg-black border border-zinc-700 rounded px-2 py-1.5 mb-2 cursor-pointer" 
        onClick={() => { haptic.light(); setIsOrderTypeOpen(true); }}
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

      {/* Price Input */}
      {orderType === 'limit' ? (
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
      ) : (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex-1 bg-zinc-900/60 rounded px-3 py-2 flex items-center border border-zinc-800/80 h-[42px]">
            <span className="text-[13px] text-zinc-500 font-medium tracking-wide">Исполнить по рыночной цене</span>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className={`bg-black rounded px-2 py-2 flex items-center justify-between border border-zinc-700 ${amountPercent > 0 ? 'mb-1' : 'mb-2'}`}>
        <span className="text-sm text-zinc-400">Количество</span>
        <span className="text-sm text-zinc-400 font-bold">{amountPercent > 0 ? `${amountPercent}%` : 'CP'}</span>
      </div>

      {amountPercent > 0 && (
        <div className="text-[10px] text-zinc-500 mb-2 h-[26px] flex items-center font-mono">
          ≈ <span className="text-zinc-300 ml-1">{(amountPercent * 0.005).toFixed(4)}</span> <span className="text-zinc-600 mx-1">/</span> <span className="text-zinc-300">{(amountPercent * 0.005).toFixed(4)}</span> BTC
        </div>
      )}

      {/* Slider */}
      <div className="px-1 mb-2 relative flex items-center h-4 group">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={amountPercent}
          onChange={(e) => {
            haptic.light();
            setAmountPercent(Number(e.target.value));
          }}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />
        <div className="h-0.5 w-full bg-zinc-800 relative z-10 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 bg-white" style={{ width: `${amountPercent}%` }} />

          {[0, 25, 50, 75, 100].map(mark => {
            const isZero = mark === 0;
            return (
              <div
                key={mark}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full -translate-x-1/2 transition-colors ${amountPercent >= mark ? (isZero ? 'bg-zinc-100' : 'bg-white') : 'bg-zinc-700'}`}
                style={{
                  left: `${mark}%`,
                  width: isZero ? '10px' : '6px',
                  height: isZero ? '10px' : '6px'
                }}
              />
            )
          })}

          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)] -translate-x-1/2"
            style={{ left: `${amountPercent}%` }}
          />
        </div>
      </div>

      {/* TP/SL Checkbox */}
      <div className={`flex items-center justify-between ${isTPSL ? 'mb-1.5' : 'mb-2'}`}>
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { haptic.light(); setIsTPSL(!isTPSL); }}>
          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${isTPSL ? 'bg-zinc-300 border-none' : 'border border-zinc-500'}`}>
            {isTPSL && <div className="w-1.5 h-1.5 bg-zinc-900 rounded-sm" />}
          </div>
          <span className="text-xs text-zinc-300 font-medium">TP/SL</span>
        </div>
        {isTPSL && <span className="text-[10px] text-zinc-400">Продвинутая</span>}
      </div>

      {/* TP/SL Inputs */}
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

      {/* Action Buttons */}
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

      <LeverageModal
        isOpen={isLeverageOpen}
        onClose={() => setIsLeverageOpen(false)}
        currentLeverage={leverage}
        onChange={setLeverage}
      />

      <OrderTypeModal
        isOpen={isOrderTypeOpen}
        onClose={() => setIsOrderTypeOpen(false)}
        currentType={orderType}
        onChange={setOrderType}
      />
    </div>
  );
};

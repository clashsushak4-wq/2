import { useState } from 'react';
import { ChevronDown, PlusSquare } from 'lucide-react';
import { haptic } from '../../../../utils';

export const OrderPanel = () => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');

  return (
    <div className="flex flex-col flex-[1.2] pr-2 border-r border-zinc-900/50 select-none">

      {/* Margin Settings */}
      <div className="flex items-center gap-1 mb-3">
        <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded truncate flex-1 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
          Изолиров...
        </div>
        <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded w-8 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
          3x
        </div>
        <div className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded w-10 flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
          B/R
        </div>
      </div>

      {/* Buy/Sell Toggles */}
      <div className="flex bg-zinc-900 rounded p-0.5 mb-3">
        <div
          onClick={() => { haptic.light(); setSide('buy'); }}
          className={`flex-1 py-1.5 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'buy' ? 'bg-white text-black' : 'text-zinc-400'}`}
        >
          Купить
        </div>
        <div
          onClick={() => { haptic.light(); setSide('sell'); }}
          className={`flex-1 py-1.5 text-center text-sm font-medium rounded cursor-pointer transition-colors ${side === 'sell' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}
        >
          Продать
        </div>
      </div>

      {/* Order Type */}
      <div className="flex items-center justify-between bg-zinc-900 rounded px-2 py-1.5 mb-3 cursor-pointer" onClick={() => haptic.light()}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border border-zinc-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
          </div>
          <span className="text-sm font-bold text-zinc-100">Лимитный</span>
        </div>
        <ChevronDown size={16} className="text-zinc-500" />
      </div>

      {/* Price Input */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex-1 bg-zinc-900 rounded px-2 py-1 flex flex-col border border-zinc-800">
          <span className="text-[10px] text-zinc-500">Цена(USDT)</span>
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

      {/* Amount Input */}
      <div className="bg-zinc-900 rounded px-2 py-2 flex items-center justify-between border border-zinc-800 mb-3">
        <span className="text-sm text-zinc-400">Количество</span>
        <span className="text-sm text-zinc-400 font-bold">CP</span>
      </div>

      {/* Slider */}
      <div className="px-1 mb-4">
        <div className="h-0.5 w-full bg-zinc-800 relative flex items-center justify-between">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-100 absolute -left-1" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 absolute left-1/4" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 absolute left-2/4 -translate-x-1/2" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 absolute right-1/4" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 absolute -right-0.5" />
        </div>
      </div>

      {/* Total Input */}
      <div className="bg-zinc-900 rounded px-2 py-2 flex items-center justify-between border border-zinc-800 mb-4">
        <span className="text-sm text-zinc-400">Всего</span>
        <span className="text-sm text-zinc-400 font-bold">USDT</span>
      </div>

      {/* Info Rows */}
      <div className="flex flex-col gap-1 mb-4 text-xs">
        <div className="flex justify-between items-center text-zinc-500">
          <span className="border-b border-dashed border-zinc-600 pb-0.5">Доступно</span>
          <div className="flex items-center gap-1 text-zinc-200">
            <span>0.00 USDT</span>
            <PlusSquare size={12} className="text-zinc-100 cursor-pointer" onClick={() => haptic.light()} />
          </div>
        </div>
        <div className="flex justify-between items-center text-zinc-500">
          <span className="border-b border-dashed border-zinc-600 pb-0.5">Макс.</span>
          <span className="text-zinc-200">0.00 USDT</span>
        </div>
        <div className="flex justify-between items-center text-zinc-500">
          <span className="border-b border-dashed border-zinc-600 pb-0.5">Занять</span>
          <span className="text-zinc-200">0.00 USDT</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => haptic.medium()}
        className={`w-full py-3 rounded-lg font-bold text-base transition-transform active:scale-95 ${side === 'buy' ? 'bg-white text-black' : 'bg-zinc-700 text-white'
          }`}
      >
        {side === 'buy' ? 'Купить CP' : 'Продать CP'}
      </button>

    </div>
  );
};

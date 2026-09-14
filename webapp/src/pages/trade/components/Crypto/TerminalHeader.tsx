import { ChevronDown, BarChart2, MoreHorizontal, CircleDollarSign } from 'lucide-react';
import { haptic } from '../../../../utils';

export const TerminalHeader = () => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-zinc-900">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5" onClick={() => haptic.light()}>
          <h1 className="text-xl font-bold text-zinc-100">CP/USDT</h1>
          <span className="bg-zinc-800 text-zinc-300 text-[10px] font-medium px-1.5 py-0.5 rounded">3x</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </div>
        <span className="text-zinc-400 text-sm font-medium">-5.21%</span>
      </div>

      <div className="flex items-center gap-4 text-zinc-400">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => haptic.light()}>
          <CircleDollarSign size={16} className="text-white" />
          <span className="text-sm font-medium text-white">0.00</span>
        </div>
        <BarChart2 size={20} className="cursor-pointer" onClick={() => haptic.light()} />
        <MoreHorizontal size={20} className="cursor-pointer" onClick={() => haptic.light()} />
      </div>
    </div>
  );
};

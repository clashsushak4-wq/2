import { ChevronDown, FileText } from 'lucide-react';
import { haptic } from '../../../../utils';

export const BottomTabs = () => {
  return (
    <div className="flex flex-col mt-2 select-none">
      {/* Tabs Header */}
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-1.5 px-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => haptic.light()}>
          <span className="text-white font-bold text-sm">Ордера(0)</span>
          <ChevronDown size={14} className="text-zinc-400" />
        </div>
        <span className="text-zinc-400 font-medium text-sm cursor-pointer" onClick={() => haptic.light()}>Активы</span>
        <span className="text-zinc-400 font-medium text-sm cursor-pointer" onClick={() => haptic.light()}>Позиции(0)</span>
        <span className="text-zinc-400 font-medium text-sm cursor-pointer" onClick={() => haptic.light()}>Вайчер на по...</span>
        <FileText size={16} className="text-zinc-300 ml-auto cursor-pointer" onClick={() => haptic.light()} />
      </div>

      {/* Tabs Content */}
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => haptic.light()}>
          <div className="w-4 h-4 rounded border border-zinc-600 bg-transparent flex items-center justify-center" />
          <span className="text-zinc-300 text-sm">Показать текущий</span>
        </div>
        <button 
          className="bg-zinc-800 text-zinc-100 text-sm font-medium px-4 py-1.5 rounded-full"
          onClick={() => haptic.light()}
        >
          Отменить все
        </button>
      </div>
    </div>
  );
};

import { haptic } from '../../../../../utils';

export const OrdersTab = () => {
  return (
    <div className="flex items-center justify-between px-2 py-2">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => haptic.light()}>
        <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center" />
        <span className="text-zinc-300 text-sm">Показать текущий</span>
      </div>
      <button 
        className="bg-zinc-800 text-zinc-100 text-sm font-medium px-4 py-1.5 rounded-full transition-transform active:scale-95"
        onClick={() => haptic.light()}
      >
        Отменить все
      </button>
    </div>
  );
};

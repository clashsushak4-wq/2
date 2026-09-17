import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface MarketTileProps {
  icon: LucideIcon;
  title: string;
  onClick?: () => void;
}

export const MarketTile = ({ icon: Icon, title, onClick }: MarketTileProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border-2 rounded-xl transition-colors text-left border-zinc-700 active:bg-zinc-800"
    >
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
        <Icon size={18} className="text-black" />
      </div>
      
      <span className="flex-1 text-white text-base font-medium">{title}</span>

      <ChevronRight size={16} className="text-zinc-600 shrink-0" />
    </button>
  );
};

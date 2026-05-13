import { ChevronDown, RotateCw, Star } from 'lucide-react';
import { haptic } from '../../../../../../utils';

interface ChartHeaderProps {
  symbol: string;
  onSymbolPress: () => void;
}

export const ChartHeader = ({ symbol, onSymbolPress }: ChartHeaderProps) => (
  <div
    className="flex items-center justify-between px-4 pb-2 shrink-0"
    style={{ paddingTop: 'calc(10px + var(--safe-top, 0px))' }}
  >
    <div className="flex items-center min-w-0">
      <button
        onClick={() => {
          haptic.light();
          onSymbolPress();
        }}
        className="flex items-center gap-1 min-w-0"
      >
        <span className="text-white text-[22px] leading-none font-bold truncate">{symbol}</span>
        <ChevronDown size={14} className="text-zinc-400 shrink-0" />
      </button>
    </div>

    <div className="flex items-center gap-4 text-white shrink-0">
      <button onClick={() => haptic.light()} className="w-8 h-8 flex items-center justify-center">
        <Star size={22} />
      </button>
      <button onClick={() => haptic.light()} className="w-8 h-8 flex items-center justify-center">
        <RotateCw size={21} />
      </button>
    </div>
  </div>
);

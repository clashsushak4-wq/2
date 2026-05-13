import { Atom, ChevronDown, Hexagon, PencilLine } from 'lucide-react';
import { haptic } from '../../../../../../utils';
import { TIMEFRAME_LABELS } from './data/mockChartData';

interface TimeframeTabsProps {
  activeTimeframe: string;
  onChange: (timeframe: string) => void;
}

export const TimeframeTabs = ({ activeTimeframe, onChange }: TimeframeTabsProps) => (
  <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-zinc-900">
    <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
      {TIMEFRAME_LABELS.map((timeframe) => {
        const isActive = timeframe === activeTimeframe;
        return (
          <button
            key={timeframe}
            onClick={() => {
              if (!isActive) haptic.light();
              onChange(timeframe);
            }}
            className={`h-7 px-2.5 rounded-md text-[12px] font-bold whitespace-nowrap ${
              isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500'
            }`}
          >
            {timeframe}
          </button>
        );
      })}
      <button className="h-7 px-2.5 rounded-md text-[12px] font-bold text-zinc-500 whitespace-nowrap flex items-center gap-1">
        Больше
        <ChevronDown size={10} />
      </button>
    </div>

    <div className="flex items-center gap-3 shrink-0 text-zinc-300">
      <Atom size={17} />
      <PencilLine size={17} />
      <Hexagon size={17} />
    </div>
  </div>
);

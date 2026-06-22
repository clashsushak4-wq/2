import { BarChart3 } from 'lucide-react';

export type IndicatorType = 'none' | 'SMA' | 'EMA' | 'RSI';

const INDICATORS: IndicatorType[] = ['none', 'SMA', 'EMA', 'RSI'];

interface IndicatorTabsProps {
  activeIndicator: IndicatorType;
  onChange: (ind: IndicatorType) => void;
}

export const IndicatorTabs = ({ activeIndicator, onChange }: IndicatorTabsProps) => (
  <div className="flex items-center justify-between gap-2 px-4 py-2 border-y border-zinc-900 shrink-0">
    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar min-w-0">
      {INDICATORS.map((ind) => (
        <button
          key={ind}
          onClick={() => onChange(ind)}
          className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
            activeIndicator === ind ? 'text-violet-400 font-bold' : 'text-zinc-500'
          }`}
        >
          {ind === 'none' ? 'Hide' : ind}
        </button>
      ))}
    </div>
    <BarChart3 size={17} className="text-zinc-400 shrink-0" />
  </div>
);

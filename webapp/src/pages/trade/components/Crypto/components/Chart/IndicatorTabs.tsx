import { BarChart3 } from 'lucide-react';
import { INDICATOR_LABELS } from './data/mockChartData';

export const IndicatorTabs = () => (
  <div className="flex items-center justify-between gap-2 px-4 py-2 border-y border-zinc-900">
    <div className="flex items-center gap-4 overflow-x-auto no-scrollbar min-w-0">
      {INDICATOR_LABELS.map((label) => (
        <button key={label} className="text-[11px] font-medium text-zinc-500 whitespace-nowrap">
          {label}
        </button>
      ))}
    </div>
    <BarChart3 size={17} className="text-white shrink-0" />
  </div>
);

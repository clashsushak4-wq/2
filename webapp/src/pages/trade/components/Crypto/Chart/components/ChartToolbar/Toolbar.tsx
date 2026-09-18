import { LineChart, BarChart2, Settings2, Edit3, ChevronDown } from 'lucide-react';
import { Timeframe, ChartType } from '../../types';

interface ToolbarProps {
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  chartType: ChartType;
  onToggleChartType: () => void;
  onOpenTimeframeModal: () => void;
}

const QUICK_TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: '1 мин.', value: '1m' },
  { label: '15 мин.', value: '15m' },
  { label: '1 ч.', value: '1h' },
  { label: '4 ч.', value: '4h' },
  { label: '1 д.', value: '1d' },
];

export const Toolbar = ({ 
  selectedTimeframe, 
  onSelectTimeframe, 
  chartType, 
  onToggleChartType,
  onOpenTimeframeModal
}: ToolbarProps) => {
  return (
    <div className="flex items-center justify-between px-3 mb-2 border-t border-[#1a1a1a] pt-2">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pr-2">
        {QUICK_TIMEFRAMES.map(tf => {
          const isActive = selectedTimeframe === tf.value;
          return (
            <button 
              key={tf.value} 
              onClick={() => onSelectTimeframe(tf.value)}
              className={`shrink-0 px-2 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer active:opacity-70 ${
                isActive ? 'bg-[#1e1e1e] text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tf.label}
            </button>
          );
        })}
        <button 
          onClick={onOpenTimeframeModal}
          className="flex items-center gap-1 shrink-0 px-2 py-1.5 rounded-[6px] text-[13px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#1e1e1e]/50 transition-colors cursor-pointer active:opacity-70"
        >
          ТФ <ChevronDown size={14} className="mt-0.5" />
        </button>
      </div>
      
      <div className="flex items-center gap-3 text-zinc-400 shrink-0 border-l border-zinc-800 pl-3">
        <button onClick={onToggleChartType} className="cursor-pointer active:opacity-70 transition-opacity">
          {chartType === 'candles' ? <LineChart size={16} /> : <BarChart2 size={16} />}
        </button>
        <button className="cursor-pointer active:opacity-70 transition-opacity"><Edit3 size={15} /></button>
        <button className="cursor-pointer active:opacity-70 transition-opacity"><Settings2 size={16} /></button>
      </div>
    </div>
  );
};

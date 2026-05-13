import { ChevronDown } from 'lucide-react';
import { MOCK_CHART_STATS } from './data/mockChartData';

interface MarketSummaryProps {
  base: string;
  change24h: number;
}

export const MarketSummary = ({ base, change24h }: MarketSummaryProps) => {
  const isPositive = change24h >= 0;
  const stats = MOCK_CHART_STATS.map((stat) =>
    stat.label.includes('(ETH)') ? { ...stat, label: `Объем за 24ч (${base})` } : stat,
  );

  return (
    <div className="grid grid-cols-[1fr_1.05fr] gap-4 px-4 py-4 border-b border-zinc-900">
      <div className="min-w-0">
        <button className="flex items-center gap-1 text-zinc-400 text-[11px] mb-1">
          Последняя цена
          <ChevronDown size={10} className="text-zinc-600" />
        </button>
        <div className="text-violet-400 text-[30px] leading-none font-bold tabular-nums">2,342.46</div>
        <div className="mt-2 flex items-center gap-1 text-[13px] tabular-nums">
          <span className="text-white">₮103,254.51</span>
          <span className={isPositive ? 'text-white' : 'text-violet-400'}>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
        </div>
        <div className="mt-1 text-zinc-600 text-[12px]">Цена маркировки 2,342.49</div>
      </div>

      <div className="space-y-1.5 pt-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between gap-2 text-[11px] leading-tight">
            <span className="text-zinc-600 truncate">{stat.label}</span>
            <span className="text-white font-mono tabular-nums shrink-0">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

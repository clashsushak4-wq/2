import { haptic } from '../../../../../../utils';
import type { ChartBottomTab } from '../../types';

const TABS: { key: ChartBottomTab; label: string }[] = [
  { key: 'orderBook', label: 'Книга ордеров' },
  { key: 'trades', label: 'Сделки' },
  { key: 'depth', label: 'Глубина' },
];

interface ChartBottomTabsProps {
  activeTab: ChartBottomTab;
  onChange: (tab: ChartBottomTab) => void;
}

export const ChartBottomTabs = ({ activeTab, onChange }: ChartBottomTabsProps) => (
  <div className="px-4 py-3 border-b border-zinc-900">
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            onClick={() => {
              if (!isActive) haptic.light();
              onChange(tab.key);
            }}
            className={`h-9 px-3 rounded-lg text-[13px] font-bold whitespace-nowrap ${
              isActive ? 'bg-zinc-800 text-white' : 'text-zinc-600'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  </div>
);

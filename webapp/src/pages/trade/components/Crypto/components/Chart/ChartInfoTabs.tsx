import { haptic } from '../../../../../../utils';

export type ChartInfoTab = 'chart' | 'coin' | 'contract';

const TABS: { key: ChartInfoTab; label: string }[] = [
  { key: 'chart', label: 'График' },
  { key: 'coin', label: 'Данные о монете' },
  { key: 'contract', label: 'О контракте' },
];

interface ChartInfoTabsProps {
  activeTab: ChartInfoTab;
  onChange: (tab: ChartInfoTab) => void;
}

export const ChartInfoTabs = ({ activeTab, onChange }: ChartInfoTabsProps) => (
  <div className="flex items-center gap-5 px-4 border-b border-zinc-900 shrink-0">
    {TABS.map((tab) => {
      const isActive = tab.key === activeTab;
      return (
        <button
          key={tab.key}
          onClick={() => {
            if (!isActive) haptic.light();
            onChange(tab.key);
          }}
          className={`relative py-3 text-[14px] font-bold whitespace-nowrap ${
            isActive ? 'text-white' : 'text-zinc-600'
          }`}
        >
          {tab.label}
          {isActive && <span className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-white" />}
        </button>
      );
    })}
  </div>
);

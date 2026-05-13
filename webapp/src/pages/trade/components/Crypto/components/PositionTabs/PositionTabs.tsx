import { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { useTranslation } from '../../../../../../i18n';
import { haptic } from '../../../../../../utils';
import type { PositionTab } from '../../types';

const TABS: { key: PositionTab; i18nKey: string; count?: number; dropdown?: boolean; labelKey?: string }[] = [
  { key: 'positions', i18nKey: 'trade.positions', count: 0, labelKey: 'trade.size' },
  { key: 'orders', i18nKey: 'trade.orders', count: 0, dropdown: true },
  { key: 'bots', i18nKey: 'trade.bots', count: 0 },
  { key: 'copytrading', i18nKey: 'trade.copytrading' },
];

export const PositionTabs = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PositionTab>('positions');

  const handleTab = (tab: PositionTab) => {
    if (tab === activeTab) return;
    haptic.light();
    setActiveTab(tab);
  };

  return (
    <div className="border-t border-zinc-900 shrink-0 bg-black">
      {/* Tabs row */}
      <div className="flex items-center gap-3.5 px-4 h-10 overflow-x-auto no-scrollbar border-b border-zinc-900">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => handleTab(tab.key)}
              className={`relative flex h-full items-center gap-0.5 whitespace-nowrap text-[14px] font-bold transition-colors ${
                isActive ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {t(tab.labelKey ?? tab.i18nKey)}
              {typeof tab.count === 'number' && (
                <span className={isActive ? 'text-white' : 'text-zinc-500'}>
                  ({tab.count})
                </span>
              )}
              {tab.dropdown && <ChevronDown size={13} className="text-zinc-500" />}
              {isActive && (
                <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-violet-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab indicator underline */}
      <div className="flex items-center justify-between px-4 py-1.5">
        <button className="flex items-center gap-2 text-zinc-300">
          <span className="w-3.5 h-3.5 rounded border border-zinc-600" />
          <span className="text-[12px]">{t('trade.showCurrent')}</span>
        </button>
        <div className="flex items-center gap-4">
          <Filter size={16} className="text-zinc-400" />
          <button className="h-8 rounded-full bg-[#1d1e23] px-3.5 text-[11px] font-bold text-white">
            {t('trade.closeAll')}
          </button>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex items-center justify-center py-6">
        <span className="text-zinc-700 text-[11px]">{t('trade.noOpenOrders')}</span>
      </div>
    </div>
  );
};

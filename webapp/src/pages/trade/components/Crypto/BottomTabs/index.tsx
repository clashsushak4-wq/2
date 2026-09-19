import { useCryptoStore } from '../store/useCryptoStore';
import type { TabType } from '../store/useCryptoStore';
import { OrdersTab } from './OrdersTab';
import { PositionsTab } from './PositionsTab';
import { ScreenerTab } from './ScreenerTab';
import { HistoryTab } from './HistoryTab';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

export const BottomTabs = () => {
  const activeTab = useCryptoStore(state => state.activeTab);
  const setActiveTab = useCryptoStore(state => state.setActiveTab);
  const openOrderCount = usePaperTradingStore(state => state.orders.filter((order) => (
    order.status === 'pending' || order.status === 'partially_filled'
  )).length);
  const positionCount = usePaperTradingStore(state => state.positions.length);
  const { t } = useTranslation();

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'orders', label: t('trade.orders'), count: openOrderCount },
    { id: 'positions', label: t('trade.positions'), count: positionCount },
    { id: 'screener', label: t('trade.screener') },
    { id: 'history', label: t('trade.orderHistory') },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'orders': return <OrdersTab />;
      case 'positions': return <PositionsTab />;
      case 'screener': return <ScreenerTab />;
      case 'history': return <HistoryTab />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col mt-2 select-none">
      {/* Tabs Header */}
      <div role="tablist" className="flex items-center gap-4 pb-1.5 px-2 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            key={tab.id}
            onClick={() => {
              haptic.light();
              setActiveTab(tab.id);
            }}
            className="flex items-center gap-1 cursor-pointer"
          >
            <span
              className={`font-medium text-sm transition-colors ${
                activeTab === tab.id ? 'text-white font-bold' : 'text-zinc-400'
              }`}
            >
              {tab.label}
            </span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-bold leading-none text-zinc-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div role="tabpanel" className="min-h-[100px]">
        {renderContent()}
      </div>
    </div>
  );
};

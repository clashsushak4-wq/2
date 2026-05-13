import { useState } from 'react';
import { ChevronDown, CandlestickChart, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from '../../../../../../i18n';
import { haptic } from '../../../../../../utils';
import type { ViewMode, MarketTab } from '../../types';

const TABS: { key: MarketTab; i18nKey: string }[] = [
  { key: 'futures', i18nKey: 'trade.futures' },
  { key: 'margin', i18nKey: 'trade.margin' },
];

interface ScreenHeaderProps {
  symbol: string;
  change24h: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSymbolPress: () => void;
}

export const ScreenHeader = ({ symbol, change24h, viewMode, onViewModeChange, onSymbolPress }: ScreenHeaderProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<MarketTab>('futures');

  const handleTab = (tab: MarketTab) => {
    if (tab === activeTab) return;
    haptic.light();
    setActiveTab(tab);
  };

  const handleViewMode = (mode: ViewMode) => {
    if (mode === viewMode) return;
    haptic.light();
    onViewModeChange(mode);
  };

  const isPositive = change24h >= 0;

  return (
    <>
      <div
        className="flex items-center gap-4 px-4 overflow-x-auto no-scrollbar shrink-0"
        style={{ paddingTop: 'calc(8px + var(--safe-top, 0px))' }}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTab(tab.key)}
              className={`relative py-2 whitespace-nowrap text-[15px] font-bold transition-colors ${
                activeTab === tab.key ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {t(tab.i18nKey)}
              {activeTab === tab.key && (
                <span className="absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-violet-400" />
              )}
            </button>
          ))}
        </div>
        <SlidersHorizontal size={18} className="text-white shrink-0" />
      </div>

      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div>
          <button
            onClick={() => { haptic.light(); onSymbolPress(); }}
            className="flex items-center gap-1 group"
          >
            <span className="text-white text-[21px] leading-none font-bold">{symbol}</span>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-zinc-500 text-[11px]">{t('trade.perpetual')}</span>
            <span
              className={`text-[11px] font-bold tabular-nums ${
                isPositive ? 'text-white' : 'text-violet-400'
              }`}
            >
              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => handleViewMode('chart')}
            className="w-7 h-7 flex items-center justify-center transition-colors"
          >
            <CandlestickChart size={20} className={viewMode === 'chart' ? 'text-white' : 'text-zinc-400'} />
          </button>
          <button
            onClick={() => handleViewMode('terminal')}
            className="w-7 h-7 flex items-center justify-center transition-colors"
          >
            <MoreHorizontal size={22} className={viewMode === 'terminal' ? 'text-white' : 'text-zinc-400'} />
          </button>
        </div>
      </div>
    </>
  );
};

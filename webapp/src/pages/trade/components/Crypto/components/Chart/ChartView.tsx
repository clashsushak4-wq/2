import { useState } from 'react';
import type { ChartBottomTab } from '../../types';
import { ChartBottomTabs } from './ChartBottomTabs';
import { ChartHeader } from './ChartHeader';
import { ChartInfoTabs, type ChartInfoTab } from './ChartInfoTabs';
import { ChartTradeActions } from './ChartTradeActions';
import { IndicatorTabs } from './IndicatorTabs';
import { MarketSummary } from './MarketSummary';
import { MockCandlestickChart } from './MockCandlestickChart';
import { TimeframeTabs } from './TimeframeTabs';

interface ChartViewProps {
  symbol: string;
  base: string;
  change24h: number;
  onSymbolPress: () => void;
}

export const ChartView = ({ symbol, base, change24h, onSymbolPress }: ChartViewProps) => {
  const [activeInfoTab, setActiveInfoTab] = useState<ChartInfoTab>('chart');
  const [activeTimeframe, setActiveTimeframe] = useState('1Д');
  const [activeBottomTab, setActiveBottomTab] = useState<ChartBottomTab>('orderBook');

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-black">
      <ChartHeader symbol={symbol} onSymbolPress={onSymbolPress} />
      <div className="flex-1 min-h-0 overflow-y-auto pb-1">
        <ChartInfoTabs activeTab={activeInfoTab} onChange={setActiveInfoTab} />
        <MarketSummary base={base} change24h={change24h} />
        <TimeframeTabs activeTimeframe={activeTimeframe} onChange={setActiveTimeframe} />
        <MockCandlestickChart />
        <IndicatorTabs />
        <ChartBottomTabs activeTab={activeBottomTab} onChange={setActiveBottomTab} />
      </div>
      <ChartTradeActions />
    </div>
  );
};

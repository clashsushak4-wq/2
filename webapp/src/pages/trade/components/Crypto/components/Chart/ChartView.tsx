import { useState } from 'react';
import type { ChartBottomTab } from '../../types';
import { ChartBottomTabs } from './ChartBottomTabs';
import { ChartHeader } from './ChartHeader';
import { ChartInfoTabs, type ChartInfoTab } from './ChartInfoTabs';
import { ChartTradeActions } from './ChartTradeActions';
import { MarketSummary } from './MarketSummary';
import { CandlestickChart } from './CandlestickChart';
interface ChartViewProps {
  symbol: string;
  base: string;
  change24h: number;
  onSymbolPress: () => void;
}

export const ChartView = ({ symbol, base, change24h, onSymbolPress }: ChartViewProps) => {
  const [activeInfoTab, setActiveInfoTab] = useState<ChartInfoTab>('chart');
  const [activeBottomTab, setActiveBottomTab] = useState<ChartBottomTab>('orderBook');


  return (
    <div className="flex flex-1 min-h-0 flex-col bg-black">
      <div className="md:hidden shrink-0">
        <ChartHeader symbol={symbol} onSymbolPress={onSymbolPress} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-1">
        <ChartInfoTabs activeTab={activeInfoTab} onChange={setActiveInfoTab} />
        <MarketSummary base={base} change24h={change24h} />
        <CandlestickChart symbol={symbol} interval="1h" />
        <ChartBottomTabs activeTab={activeBottomTab} onChange={setActiveBottomTab} />
      </div>
      <div className="md:hidden shrink-0">
        <ChartTradeActions />
      </div>
    </div>
  );
};

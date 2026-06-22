import { useState } from 'react';
import type { ChartBottomTab } from '../../types';
import { ChartBottomTabs } from './ChartBottomTabs';
import { ChartHeader } from './ChartHeader';
import { ChartInfoTabs, type ChartInfoTab } from './ChartInfoTabs';
import { ChartTradeActions } from './ChartTradeActions';
import { MarketSummary } from './MarketSummary';
import { CandlestickChart } from './CandlestickChart';
import { TimeframeTabs } from './TimeframeTabs';
import { IndicatorTabs, type IndicatorType } from './IndicatorTabs';
interface ChartViewProps {
  symbol: string;
  base: string;
  change24h: number;
  onSymbolPress: () => void;
}

export const ChartView = ({ symbol, base, change24h, onSymbolPress }: ChartViewProps) => {
  const [activeInfoTab, setActiveInfoTab] = useState<ChartInfoTab>('chart');
  const [activeTimeframe, setActiveTimeframe] = useState('1ч');
  const [activeBottomTab, setActiveBottomTab] = useState<ChartBottomTab>('orderBook');
  const [activeIndicator, setActiveIndicator] = useState<IndicatorType>('none');

  const getBinanceInterval = (tf: string) => {
    switch (tf) {
      case '1м': return '1m';
      case '15м': return '15m';
      case '1ч': return '1h';
      case '4ч': return '4h';
      case '1Д': return '1d';
      default: return '1h';
    }
  };


  return (
    <div className="flex flex-1 min-h-0 flex-col bg-black">
      <div className="md:hidden shrink-0">
        <ChartHeader symbol={symbol} onSymbolPress={onSymbolPress} />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-1 flex flex-col">
        <ChartInfoTabs activeTab={activeInfoTab} onChange={setActiveInfoTab} />
        <MarketSummary base={base} change24h={change24h} />
        <TimeframeTabs activeTimeframe={activeTimeframe} onChange={setActiveTimeframe} />
        <CandlestickChart symbol={symbol} interval={getBinanceInterval(activeTimeframe)} indicator={activeIndicator} />
        <IndicatorTabs activeIndicator={activeIndicator} onChange={setActiveIndicator} />
        <ChartBottomTabs activeTab={activeBottomTab} onChange={setActiveBottomTab} />
      </div>
      <div className="md:hidden shrink-0">
        <ChartTradeActions />
      </div>
    </div>
  );
};

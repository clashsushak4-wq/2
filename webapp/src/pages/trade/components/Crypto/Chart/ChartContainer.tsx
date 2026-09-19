import { useState, useMemo } from 'react';
import { useInstrument, useCryptoStore } from '../store/useCryptoStore';
import { Timeframe, ChartType } from './types';
import { generateMockChartData } from './data/chartGenerator';
import { Toolbar } from './components/ChartToolbar/Toolbar';
import { TimeframeModal } from './components/ChartToolbar/TimeframeModal';
import { LightweightChart } from './components/ChartArea/LightweightChart';

export const ChartContainer = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const instrument = useInstrument(selectedSymbol);

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1d');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [isTimeframeModalOpen, setIsTimeframeModalOpen] = useState(false);

  // Generate historical data only once per symbol/timeframe
  const chartData = useMemo(() => {
    return generateMockChartData(instrument.symbol, instrument.price, instrument.changePercent, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument.symbol, selectedTimeframe]);

  return (
    <div className="flex flex-col mt-2">
      <Toolbar 
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
        chartType={chartType}
        onToggleChartType={() => setChartType(prev => prev === 'candles' ? 'area' : 'candles')}
        onOpenTimeframeModal={() => setIsTimeframeModalOpen(true)}
      />
      
      <div className="h-[340px] w-full bg-[#0a0a0a]">
        <LightweightChart data={chartData} chartType={chartType} livePrice={instrument.price} />
      </div>

      <TimeframeModal 
        isOpen={isTimeframeModalOpen}
        onClose={() => setIsTimeframeModalOpen(false)}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
      />
    </div>
  );
};

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { useBinanceTicker } from '../../../../hooks/useBinanceMarket';
import { ChartView, ScreenHeader, SymbolPicker, Terminal } from './components';
import type { TradePair, ViewMode } from './types';

interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  const [symbol, setSymbolState] = useState('BTCUSDT');
  const [base, setBase] = useState('BTC');
  const [quote, setQuote] = useState('USDT');
  
  const ticker = useBinanceTicker(symbol);
  const change24h = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [pickerOpen, setPickerOpen] = useState(false);

  useBackButton(viewMode === 'chart' ? () => setViewMode('terminal') : onClose);

  const handleSelectSymbol = useCallback((pair: TradePair) => {
    setSymbolState(pair.symbol);
    setBase(pair.base);
    setQuote(pair.quote);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 bg-black flex flex-col"
      >
        {/* Mobile: Header only shown in terminal mode. Desktop: Always shown */}
        <div className={`shrink-0 ${viewMode === 'terminal' ? 'block' : 'hidden md:block'}`}>
          <ScreenHeader
            symbol={symbol}
            change24h={change24h}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSymbolPress={() => setPickerOpen(true)}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Chart Area - Full width on mobile (when active), takes remaining space on desktop */}
          <div className={`flex-1 min-w-0 ${viewMode === 'chart' ? 'flex' : 'hidden md:flex'} flex-col`}>
            <ChartView
              symbol={symbol}
              base={base}
              change24h={change24h}
              onSymbolPress={() => setPickerOpen(true)}
            />
          </div>

          {/* Terminal / Order Area - Full width on mobile (when active), fixed width sidebar on desktop */}
          <div className={`w-full md:w-[320px] lg:w-[360px] shrink-0 md:border-l md:border-zinc-900 bg-black ${viewMode === 'terminal' ? 'flex' : 'hidden md:flex'} flex-col`}>
            <Terminal symbol={symbol} base={base} quote={quote} currentPrice={ticker ? parseFloat(ticker.lastPrice) : 0} />
          </div>
        </div>
      </motion.div>

      <SymbolPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectSymbol}
      />
    </div>
  );
};

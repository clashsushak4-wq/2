import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { ChartView, ScreenHeader, SymbolPicker, Terminal } from './components';
import type { TradePair, ViewMode } from './types';

interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  const [symbol, setSymbolState] = useState('BTCUSDT');
  const [base, setBase] = useState('BTC');
  const [quote, setQuote] = useState('USDT');
  const [change24h, setChange24h] = useState(1.08);
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [pickerOpen, setPickerOpen] = useState(false);

  useBackButton(viewMode === 'chart' ? () => setViewMode('terminal') : onClose);

  const handleSelectSymbol = useCallback((pair: TradePair) => {
    setSymbolState(pair.symbol);
    setBase(pair.base);
    setQuote(pair.quote);
    setChange24h(pair.change);
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
        {viewMode === 'terminal' ? (
          <>
            <ScreenHeader
              symbol={symbol}
              change24h={change24h}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onSymbolPress={() => setPickerOpen(true)}
            />
            <Terminal symbol={symbol} base={base} quote={quote} />
          </>
        ) : (
          <ChartView
            symbol={symbol}
            base={base}
            change24h={change24h}
            onSymbolPress={() => setPickerOpen(true)}
          />
        )}
      </motion.div>

      <SymbolPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectSymbol}
      />
    </div>
  );
};

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings } from 'lucide-react';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { slideFromRight } from '../../../../../shared/animations';
import { PullToRefresh } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import {
  formatApproximateFiat,
  formatInstrumentPrice,
  formatSignedPercent,
  getMockInstrument,
} from '../data/mockInstruments.ts';
import { useCryptoStore } from '../store/useCryptoStore';

export const ChartScreen = () => {
  const isOpen = useCryptoStore(state => state.isChartOpen);
  const setChartOpen = useCryptoStore(state => state.setChartOpen);
  const setSymbolSelectOpen = useCryptoStore(state => state.setSymbolSelectOpen);
  const isSymbolSelectOpen = useCryptoStore(state => state.isSymbolSelectOpen);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const { t } = useTranslation();
  const instrument = getMockInstrument(selectedSymbol);
  const changeColor = instrument.changePercent >= 0 ? 'text-bitget-green' : 'text-bitget-red';
  const onClose = () => setChartOpen(false);
  const refreshChart = useCallback(async () => {
    setRefreshSequence(sequence => sequence + 1);
    await new Promise<void>(resolve => window.setTimeout(resolve, 650));
  }, []);

  // Bind to Telegram Native BackButton
  useBackButton(isOpen ? onClose : null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={slideFromRight}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute inset-0 z-[60] overflow-hidden bg-[#0a0a0a] text-zinc-100 font-sans"
        >
          <PullToRefresh disabled={isSymbolSelectOpen} onRefresh={refreshChart}>
            <div key={refreshSequence} className="contents">
              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
                <button
                  type="button"
                  aria-label={t('trade.selectSymbol')}
                  className="flex items-center gap-1.5 cursor-pointer transition-opacity active:opacity-70"
                  onClick={() => { haptic.light(); setSymbolSelectOpen(true); }}
                >
                  <h1 className="text-[18px] font-bold text-white tracking-tight leading-none">{instrument.symbol}</h1>
                  <ChevronDown size={14} className="text-zinc-500" />
                </button>
                <button
                  type="button"
                  aria-label={t('trade.chartSettings')}
                  className="p-1 cursor-pointer transition-opacity active:opacity-70"
                  onClick={() => haptic.light()}
                >
                  <Settings size={18} className="text-zinc-300" />
                </button>
              </div>

              {/* Ticker Data Card */}
              <div className="flex justify-between items-start px-4 pt-1">
                {/* Left Column */}
                <div className="flex flex-col">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-zinc-400 mb-0.5 active:opacity-70 transition-opacity"
                    onClick={() => haptic.light()}
                  >
                    <span className="text-[15px] font-medium tracking-tight">{t('trade.lastPrice')}</span>
                    <ChevronDown size={14} className="mt-0.5" />
                  </button>

                  <div className="text-[38px] font-bold text-white leading-none tracking-tight mb-2">
                    {formatInstrumentPrice(instrument)}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[14px] text-zinc-200 font-medium">≈ {formatApproximateFiat(instrument)}</span>
                    <span className={`text-[14px] ${changeColor} font-medium`}>
                      {formatSignedPercent(instrument.changePercent)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[13px] text-zinc-400">{t('trade.markPrice')}</span>
                    <span className="text-[13px] text-zinc-300">{formatInstrumentPrice(instrument)}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-[7px] text-[12px] min-w-[145px] mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t('trade.high24h')}</span>
                    <span className="text-white font-medium tracking-wide">{formatInstrumentPrice(instrument, instrument.high24h)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t('trade.low24h')}</span>
                    <span className="text-white font-medium tracking-wide">{formatInstrumentPrice(instrument, instrument.low24h)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t('trade.volume24h')}</span>
                    <span className="text-white font-medium tracking-wide">{instrument.volume24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">{t('trade.turnover24h')} ({instrument.quoteAsset})</span>
                    <span className="text-white font-medium tracking-wide">{instrument.turnover24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 truncate mr-2">{t('trade.openInterest')} ({instrument.quoteAsset})</span>
                    <span className="text-white font-medium tracking-wide shrink-0">{instrument.openInterest}</span>
                  </div>
                </div>
              </div>
            </div>
          </PullToRefresh>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

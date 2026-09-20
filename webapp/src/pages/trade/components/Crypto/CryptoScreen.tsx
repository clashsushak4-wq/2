import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { PullToRefresh } from '../../../../shared/ui';
import { TerminalHeader } from './layout/TerminalHeader';
import { ToastProvider } from './layout/ToastProvider';
import { BottomTabs } from './BottomTabs';
import { OrderPanel } from './OrderPanel/index';
import { OrderBook } from './OrderBook/index';
import { LeverageModal } from './modals/LeverageModal';
import { MarginModeModal } from './modals/MarginModeModal';
import { SymbolSelectModal } from './modals/SymbolSelectModal';
import { OrderBookCardModal } from './modals/OrderBookCardModal';
import { OrderTypeModal } from './modals/OrderTypeModal';
import { UnitModal } from './modals/UnitModal';
import { ChartScreen } from './Chart/ChartScreen';
import { useMarketStore } from './store/useMarketStore';
import { useCryptoStore } from './store/useCryptoStore';
import { usePaperTradingStore } from './store/usePaperTradingStore';
import { MarketStatus, DemoAccountStart } from './layout/MarketStatus';
import { useTranslation } from '../../../../i18n';


interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  useBackButton(onClose);
  const { t } = useTranslation();
  const selected = useCryptoStore(state => state.selectedSymbol);
  const isChartOpen = useCryptoStore(state => state.isChartOpen);
  const timeframe = useCryptoStore(state => state.chartTimeframe);
  const instrument = useMarketStore(state => state.instruments[selected]);
  const status = useMarketStore(state => state.status);
  const book = useMarketStore(state => state.books[selected]);
  const exists = usePaperTradingStore(state => state.exists);
  const executionReady = usePaperTradingStore(state => state.executionReady);
  const ready = Boolean(instrument?.price);
  const canTrade = exists && executionReady && status === 'live' && instrument?.tradingReady && book;
  useEffect(() => {
    if (selected) useMarketStore.getState().subscribe(selected, isChartOpen ? timeframe : '1m');
    return () => useMarketStore.getState().unsubscribe();
  }, [selected, isChartOpen, timeframe]);
  const [refreshSequence, setRefreshSequence] = useState(0);

  const refreshTerminal = useCallback(async () => {
    await Promise.all([useMarketStore.getState().refresh(), usePaperTradingStore.getState().refresh()]);
    setRefreshSequence(sequence => sequence + 1);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-zinc-100 flex flex-col font-sans">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0"
      >
        <PullToRefresh onRefresh={refreshTerminal}>
          <div key={refreshSequence} className="contents">
            <ToastProvider />
            <MarketStatus />
            {ready && <TerminalHeader />}
            {!exists && <DemoAccountStart />}
            {ready && <>

            {/* The order form defines the shared terminal height. */}
            <div className="relative mx-2 mt-1">
              <div className="w-[58.333%] min-w-0">
                {canTrade ? <OrderPanel /> : <div className="min-h-[320px] p-3 text-xs text-zinc-500">
                  {t('trade.market.rulesUnavailable')}
                </div>}
              </div>
              <div className="absolute inset-y-0 right-0 w-[41.667%] min-h-0 overflow-hidden">
                <OrderBook />
              </div>
            </div>

            {exists && <BottomTabs />}
            </>}

          </div>
        </PullToRefresh>

        {/* Overlays stay outside the transformed pull-to-refresh layer. */}
        {ready && <>
        <LeverageModal />
        <MarginModeModal />
        <SymbolSelectModal />
        <OrderBookCardModal />
        <OrderTypeModal />
        <UnitModal />
        <ChartScreen />
        </>}
      </motion.div>
    </div>
  );
};

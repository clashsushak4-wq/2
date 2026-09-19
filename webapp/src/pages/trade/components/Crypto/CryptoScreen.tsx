import { useCallback, useState } from 'react';
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
import { useMockDataEngine } from './hooks/useMockDataEngine';

interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  useBackButton(onClose);
  useMockDataEngine();
  const [refreshSequence, setRefreshSequence] = useState(0);

  const refreshTerminal = useCallback(async () => {
    await new Promise<void>(resolve => window.setTimeout(resolve, 650));
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
            <TerminalHeader />

            {/* The order form defines the shared terminal height. */}
            <div className="relative mx-2 mt-1">
              <div className="w-[58.333%] min-w-0">
                <OrderPanel />
              </div>
              <div className="absolute inset-y-0 right-0 w-[41.667%] min-h-0 overflow-hidden">
                <OrderBook />
              </div>
            </div>

            <BottomTabs />

          </div>
        </PullToRefresh>

        {/* Overlays stay outside the transformed pull-to-refresh layer. */}
        <LeverageModal />
        <MarginModeModal />
        <SymbolSelectModal />
        <OrderBookCardModal />
        <OrderTypeModal />
        <UnitModal />
        <ChartScreen />
      </motion.div>
    </div>
  );
};

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { PullToRefresh } from '../../../../shared/ui';
import { TerminalHeader } from './layout/TerminalHeader';
import { BottomTabs } from './BottomTabs';
import { OrderPanel } from './OrderPanel/index';
import { OrderBook } from './OrderBook/index';
import { LeverageModal } from './modals/LeverageModal';
import { MarginModeModal } from './modals/MarginModeModal';
import { SymbolSelectModal } from './modals/SymbolSelectModal';
import { OrderTypeModal } from './modals/OrderTypeModal';
import { UnitModal } from './modals/UnitModal';
import { ChartScreen } from './Chart/ChartScreen';
import { useCryptoStore } from './store/useCryptoStore';

interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  useBackButton(onClose);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const isPullToRefreshDisabled = useCryptoStore(state => (
    state.isOrderTypeOpen
    || state.isLeverageOpen
    || state.isUnitOpen
    || state.isMarginModeOpen
    || state.isSymbolSelectOpen
    || state.isChartOpen
  ));

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
        <PullToRefresh disabled={isPullToRefreshDisabled} onRefresh={refreshTerminal}>
          <div key={refreshSequence} className="contents">
            <TerminalHeader />

            {/* Main Content (2 columns) */}
            <div className="flex px-2 pt-2">
              <OrderPanel />
              <OrderBook />
            </div>

            <BottomTabs />

            {/* Modals mounted here, they control their own state via Zustand */}
            <LeverageModal />
            <MarginModeModal />
            <SymbolSelectModal />
            <OrderTypeModal />
            <UnitModal />

            {/* Full Screen Overlays */}
            <ChartScreen />
          </div>
        </PullToRefresh>
      </motion.div>
    </div>
  );
};

import { motion } from 'framer-motion';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
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

interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  useBackButton(onClose);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-zinc-100 flex flex-col font-sans">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 flex flex-col overflow-y-auto custom-scrollbar"
      >
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
      </motion.div>
    </div>
  );
};

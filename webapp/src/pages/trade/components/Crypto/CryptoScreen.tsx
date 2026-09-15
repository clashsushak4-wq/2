import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { TerminalHeader } from './TerminalHeader';
import { OrderPanel } from './OrderPanel';
import { OrderBook } from './OrderBook';
import { BottomTabs } from './BottomTabs';

interface CryptoScreenProps {
  onClose: () => void;
}

export const CryptoScreen = ({ onClose }: CryptoScreenProps) => {
  useBackButton(onClose);
  const [amountPercent, setAmountPercent] = useState(0);
  const [isTPSL, setIsTPSL] = useState(false);

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
        <div className="flex px-3 pt-4">
          <OrderPanel amountPercent={amountPercent} setAmountPercent={setAmountPercent} isTPSL={isTPSL} setIsTPSL={setIsTPSL} />
          <OrderBook amountPercent={amountPercent} isTPSL={isTPSL} />
        </div>

        <BottomTabs />
      </motion.div>
    </div>
  );
};

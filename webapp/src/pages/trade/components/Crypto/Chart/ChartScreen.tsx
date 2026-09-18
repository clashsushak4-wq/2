import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Settings } from 'lucide-react';
import { useBackButton } from '../../../../../hooks';
import { slideFromRight } from '../../../../../shared/animations';
import { haptic } from '../../../../../utils';
import { useCryptoStore } from '../store/useCryptoStore';

export const ChartScreen = () => {
  const isOpen = useCryptoStore(state => state.isChartOpen);
  const onClose = () => useCryptoStore.getState().setChartOpen(false);

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
          className="absolute inset-0 z-[60] bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1 shrink-0">
            <button 
              type="button" 
              className="flex items-center gap-1.5 cursor-pointer transition-opacity active:opacity-70"
              onClick={() => { haptic.light(); useCryptoStore.getState().setSymbolSelectOpen(true); }}
            >
              <h1 className="text-[18px] font-bold text-white tracking-tight leading-none">BTCUSDT</h1>
              <ChevronDown size={14} className="text-zinc-500" />
            </button>
            <button type="button" className="p-1 cursor-pointer transition-opacity active:opacity-70" onClick={() => haptic.light()}>
              <Settings size={18} className="text-zinc-300" />
            </button>
          </div>

          {/* Ticker Data Card */}
          <div className="flex justify-between items-start px-4 pt-1">
        
        {/* Left Column */}
        <div className="flex flex-col">
          <button type="button" className="flex items-center gap-1 text-zinc-400 mb-0.5 active:opacity-70 transition-opacity" onClick={() => haptic.light()}>
            <span className="text-[15px] font-medium tracking-tight">Последняя цена</span>
            <ChevronDown size={14} className="mt-0.5" />
          </button>
          
          <div className="text-[38px] font-bold text-white leading-none tracking-tight mb-2">
            76,941.7
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px] text-zinc-200 font-medium">≈ ₴3,434,562.07</span>
            <span className="text-[14px] text-emerald-500 font-medium">+0.69%</span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[13px] text-zinc-400">Цена маркировки</span>
            <span className="text-[13px] text-zinc-300">76,941.7</span>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-[7px] text-[12px] min-w-[145px] mt-1">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">24 ч. макс.</span>
            <span className="text-white font-medium tracking-wide">77,134.9</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">24 ч. мин.</span>
            <span className="text-white font-medium tracking-wide">75,985.2</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">24 ч. объем</span>
            <span className="text-white font-medium tracking-wide">23.89K</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">24 ч. оборот (USDT)</span>
            <span className="text-white font-medium tracking-wide">1.83B</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 truncate mr-2">Открытый интерес (U...</span>
            <span className="text-white font-medium tracking-wide shrink-0">1.28B</span>
          </div>
        </div>

      </div>
    </motion.div>
    )}
  </AnimatePresence>
  );
};

import { motion, AnimatePresence } from 'framer-motion';
import { slideUp } from '../../../../../shared/animations';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import type { TPSLMode } from '../domain/types';

export type { TPSLMode } from '../domain/types';

interface TPSLModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMode: TPSLMode;
  onSelectMode: (mode: TPSLMode) => void;
  type: 'tp' | 'sl';
}

const MODES: { id: TPSLMode; titleKey: string; descriptionKey: string }[] = [
  { id: 'price', titleKey: 'trade.tpslModePrice', descriptionKey: 'trade.tpslModePriceDescription' },
  { id: 'roi', titleKey: 'trade.tpslModeRoi', descriptionKey: 'trade.tpslModeRoiDescription' },
  { id: 'change', titleKey: 'trade.tpslModeChange', descriptionKey: 'trade.tpslModeChangeDescription' },
  { id: 'pnl', titleKey: 'trade.tpslModePnl', descriptionKey: 'trade.tpslModePnlDescription' },
] as const;

export const TPSLModeModal = ({ isOpen, onClose, selectedMode, onSelectMode, type }: TPSLModeModalProps) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70]"
            onClick={onClose}
          />
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed bottom-0 left-0 right-0 bg-[#121212] rounded-t-2xl z-[80] overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>
            
            <div className="px-4 pb-6">
              <h2 className="text-[17px] font-bold text-white mb-4">
                {t('trade.tpslSettings')} · {type.toUpperCase()}
              </h2>
              
              <div className="flex flex-col gap-3">
                {MODES.map((mode) => {
                  const isActive = mode.id === selectedMode;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        haptic.light();
                        onSelectMode(mode.id);
                        onClose();
                      }}
                      className={`text-left p-4 rounded-xl border transition-colors active:scale-[0.98] ${
                        isActive 
                          ? 'border-white bg-transparent' 
                          : 'border-zinc-800/80 bg-[#171717]'
                      }`}
                    >
                      <div className={`font-semibold text-[15px] mb-1 ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                        {t(mode.titleKey)}
                      </div>
                      <div className="text-zinc-400 text-[13px] leading-[1.3]">
                        {t(mode.descriptionKey)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

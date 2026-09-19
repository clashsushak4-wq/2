import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { slideUp } from '../../../../../../../shared/animations';
import { useTranslation } from '../../../../../../../i18n';
import type { Timeframe } from '../../types';

interface TimeframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

const TF_GROUPS = [
  { label: '1s', value: '1s' },
  { label: '2m', value: '2m' },
  { label: '3m', value: '3m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '4h', value: '4h' },
  { label: '6h', value: '6h' },
  { label: '8h', value: '8h' },
  { label: '12h', value: '12h' },
  { label: '1d', value: '1d' },
  { label: '2d', value: '2d' },
  { label: '3d', value: '3d' },
  { label: '5d', value: '5d' },
  { label: '1w', value: '1w' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
] as const;

export const TimeframeModal = ({ isOpen, onClose, selectedTimeframe, onSelectTimeframe }: TimeframeModalProps) => {
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
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-white">{t('trade.timeframe')}</h2>
              <button type="button" aria-label={t('common.close')} onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors active:scale-95">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {TF_GROUPS.map(tf => {
                  const isActive = tf.value === selectedTimeframe;
                  return (
                    <button
                      type="button"
                      key={tf.value}
                      onClick={() => {
                        onSelectTimeframe(tf.value as Timeframe);
                        onClose();
                      }}
                      className={`py-2.5 rounded-lg border text-[13px] transition-colors active:scale-95 ${
                        isActive 
                          ? 'bg-[#1a1a1a] border-zinc-700 text-white font-medium' 
                          : 'bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      {tf.label}
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

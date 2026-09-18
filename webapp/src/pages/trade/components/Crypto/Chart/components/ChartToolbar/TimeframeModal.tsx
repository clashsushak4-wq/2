import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { slideUp } from '../../../../../../../shared/animations';
import { Timeframe } from '../../types';

interface TimeframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

const TF_GROUPS = [
  { label: '1 с.', value: '1s' },
  { label: '2 мин.', value: '2m' },
  { label: '3 мин.', value: '3m' },
  { label: '5 мин.', value: '5m' },
  { label: '15 мин.', value: '15m' },
  { label: '30м', value: '30m' },
  { label: '1 ч.', value: '1h' },
  { label: '2 ч.', value: '2h' },
  { label: '4 ч.', value: '4h' },
  { label: '6 ч.', value: '6h' },
  { label: '8ч', value: '8h' },
  { label: '12 ч.', value: '12h' },
  { label: '1 д.', value: '1d' },
  { label: '2 дн.', value: '2d' },
  { label: '3 д.', value: '3d' },
  { label: '5 дн.', value: '5d' },
  { label: '1 нед.', value: '1w' },
  { label: '1 мес.', value: '1M' },
  { label: '3 мес.', value: '3M' },
] as const;

export const TimeframeModal = ({ isOpen, onClose, selectedTimeframe, onSelectTimeframe }: TimeframeModalProps) => {
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
              <h2 className="text-lg font-bold text-white">Период времени</h2>
              <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors active:scale-95">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {TF_GROUPS.map(tf => {
                  const isActive = tf.value === selectedTimeframe;
                  return (
                    <button
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

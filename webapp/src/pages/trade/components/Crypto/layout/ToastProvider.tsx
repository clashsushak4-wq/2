import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCryptoStore } from '../store/useCryptoStore';

export const ToastProvider = memo(() => {
  const toastMessage = useCryptoStore(state => state.toastMessage);
  const toastType = useCryptoStore(state => state.toastType);
  const hideToast = useCryptoStore.getState().hideToast;

  return (
    <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg pointer-events-auto cursor-pointer ${
              toastType === 'success' ? 'bg-bitget-green/20 text-bitget-green border border-bitget-green/30' : 'bg-bitget-red/20 text-bitget-red border border-bitget-red/30'
            }`}
            onClick={hideToast}
          >
            {toastType === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const BottomSheet = ({ isOpen, onClose, children, title }: BottomSheetProps) => {
  // Блокируем скролл body, когда открыта шторка
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Темный фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Сама шторка */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 rounded-t-3xl z-50 flex flex-col max-h-[90vh]"
          >
            {/* Ползунок (Drag Handle) */}
            <div className="flex justify-center pt-4 pb-2 w-full touch-none">
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
            </div>

            {/* Заголовок */}
            {title && (
              <div className="px-6 pb-4">
                <h2 className="text-xl font-bold text-white text-center">{title}</h2>
              </div>
            )}

            {/* Контент с прокруткой */}
            <div className="overflow-y-auto px-6 pb-8 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

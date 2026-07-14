import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { useMediaQuery } from '../../hooks';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export const BottomSheet = ({ isOpen, onClose, children, title }: BottomSheetProps) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

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
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
          {/* Темный фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Сама шторка / Модальное окно */}
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag={isDesktop ? false : "y"}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (!isDesktop && (info.offset.y > 100 || info.velocity.y > 500)) {
                onClose();
              }
            }}
            className="relative w-full bg-zinc-950 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] md:max-w-md shadow-2xl overflow-hidden"
          >
            {/* Ползунок (Drag Handle) - только для мобилок */}
            {!isDesktop && (
              <div className="flex justify-center pt-4 pb-2 w-full touch-none">
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
              </div>
            )}

            {/* Заголовок */}
            {title && (
              <div className={`px-6 pb-4 ${isDesktop ? 'pt-6' : ''}`}>
                <h2 className="text-xl font-bold text-white text-center">{title}</h2>
              </div>
            )}

            {/* Контент с прокруткой */}
            <div className={`overflow-y-auto px-6 pb-8 custom-scrollbar ${isDesktop && !title ? 'pt-6' : ''}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

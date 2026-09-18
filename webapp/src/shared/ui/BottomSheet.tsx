import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { useAppStore } from '../../store';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  fullHeight?: boolean;
  noPadding?: boolean;
}

export const BottomSheet = ({ isOpen, onClose, children, title, fullHeight, noPadding }: BottomSheetProps) => {
  const isDesktop = useAppStore((s) => s.isFullscreen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = dialog?.querySelectorAll<HTMLElement>(focusableSelector);
    (focusable?.[0] ?? dialog)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute('disabled'));
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center md:justify-center">
          {/* Темный фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Сама шторка / Модальное окно */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            initial={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`relative w-full bg-zinc-950 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-2xl flex flex-col ${fullHeight ? 'h-[96vh] max-h-[96vh]' : 'max-h-[90vh]'} md:max-h-[85vh] md:max-w-md shadow-2xl overflow-hidden`}
          >
            {/* Ползунок (Только визуал) */}
            {!isDesktop && (
              <div className="flex justify-center pt-4 pb-2 w-full shrink-0">
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
              </div>
            )}

            {/* Заголовок */}
            {title && (
              <div className={`px-6 pb-4 shrink-0 ${isDesktop ? 'pt-6' : ''}`}>
                <h2 id={titleId} className="text-xl font-bold text-white text-center">{title}</h2>
              </div>
            )}

            {/* Контент с прокруткой */}
            <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar ${noPadding ? '' : `px-6 pb-8 ${isDesktop && !title ? 'pt-6' : ''}`}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

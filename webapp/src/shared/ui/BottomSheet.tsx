import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store';

const SHEET_DURATION = 0.24;
const SHEET_EASE = [0.22, 1, 0.36, 1] as const;
const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let documentScrollLocks = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

const lockDocumentScroll = () => {
  if (documentScrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  documentScrollLocks += 1;

  return () => {
    documentScrollLocks = Math.max(0, documentScrollLocks - 1);
    if (documentScrollLocks === 0) {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    }
  };
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  fullHeight?: boolean;
  noPadding?: boolean;
}

export const BottomSheet = ({
  isOpen,
  onClose,
  children,
  title,
  fullHeight,
  noPadding,
}: BottomSheetProps) => {
  const isDesktop = useAppStore(state => state.isFullscreen);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isOpenRef = useRef(isOpen);
  const hasFocusedRef = useRef(false);
  const titleId = useId();

  onCloseRef.current = onClose;
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const unlockDocumentScroll = lockDocumentScroll();
    hasFocusedRef.current = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      const dialog = dialogRef.current;
      if (event.key !== 'Tab' || !dialog) return;

      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(element => !element.hasAttribute('disabled'));
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockDocumentScroll();
      previousFocus?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  const focusDialog = () => {
    if (!isOpenRef.current || hasFocusedRef.current) return;

    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? dialog)?.focus({ preventScroll: true });
    hasFocusedRef.current = true;
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bottom-sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SHEET_DURATION, ease: 'easeOut' }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-end overflow-hidden overscroll-none bg-black/70 md:items-center md:justify-center md:backdrop-blur-sm"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            initial={isDesktop ? { opacity: 0, scale: 0.97, y: 12 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.97, y: 12 } : { y: '100%' }}
            transition={{ type: 'tween', duration: SHEET_DURATION, ease: SHEET_EASE }}
            onAnimationComplete={focusDialog}
            onClick={event => event.stopPropagation()}
            className={`relative flex w-full transform-gpu will-change-transform flex-col overflow-hidden rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl md:max-h-[85vh] md:max-w-md md:rounded-2xl md:border ${fullHeight ? 'h-[96dvh] max-h-[96dvh]' : 'max-h-[90dvh]'}`}
          >
            {!isDesktop && (
              <div className="flex w-full shrink-0 justify-center pb-2 pt-4">
                <div className="h-1.5 w-12 rounded-full bg-zinc-800" />
              </div>
            )}

            {title && (
              <div className={`shrink-0 px-6 pb-4 ${isDesktop ? 'pt-6' : ''}`}>
                <h2 id={titleId} className="text-center text-xl font-bold text-white">{title}</h2>
              </div>
            )}

            <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar ${noPadding ? '' : `px-6 pb-8 ${isDesktop && !title ? 'pt-6' : ''}`}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

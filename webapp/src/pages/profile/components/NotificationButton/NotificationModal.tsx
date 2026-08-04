import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { useTranslation } from '../../../../i18n';

interface NotificationModalProps {
  onClose: () => void;
  isDesktopInline?: boolean;
}

export const NotificationModal = ({ onClose, isDesktopInline }: NotificationModalProps) => {
  const { t } = useTranslation();
  useBackButton(onClose);

  const content = (
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={isDesktopInline ? "w-full h-full flex flex-col relative" : "absolute inset-0 bg-black flex flex-col"}
      >
        <div className="bg-transparent px-4 pb-4 flex justify-between items-center border-b border-white/5" style={{ paddingTop: isDesktopInline ? '24px' : 'calc(16px + var(--safe-top, 0px))' }}>
          <h3 className="text-2xl font-bold text-white">{t('profile.notifications.title')}</h3>
          <button className="text-xs text-zinc-400 hover:text-white transition-colors">
            {t('profile.notifications.readAll')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center py-12">
            <Bell size={48} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">{t('profile.notifications.empty')}</p>
          </div>
        </div>
      </motion.div>
  );

  if (isDesktopInline) {
    return <>{content}</>;
  }

  const portalRoot = document.getElementById('modal-root') ?? document.body;
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {content}
    </div>
  , portalRoot);
};

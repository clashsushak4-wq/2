import { motion } from 'framer-motion';
import { Book } from 'lucide-react';
import { useBackButton } from '../../../../hooks';
import { useTranslation } from '../../../../i18n';
import { slideFromRight } from '../../../../shared/animations';

interface DiaryScreenProps {
  onClose: () => void;
}

export const DiaryScreen = ({ onClose }: DiaryScreenProps) => {
  useBackButton(onClose);
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3"
      >
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Book size={24} className="text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm font-medium">{t('trade.diary')}</p>
        <p className="text-zinc-700 text-xs">{t('trade.comingSoon')}</p>
      </motion.div>
    </div>
  );
};

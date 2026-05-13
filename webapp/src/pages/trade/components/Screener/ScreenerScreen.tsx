import { motion } from 'framer-motion';
import { ScanSearch } from 'lucide-react';
import { useBackButton } from '../../../../hooks';
import { slideFromRight } from '../../../../shared/animations';
import { useTranslation } from '../../../../i18n';

interface ScreenerScreenProps {
  onClose: () => void;
}

export const ScreenerScreen = ({ onClose }: ScreenerScreenProps) => {
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
          <ScanSearch size={24} className="text-zinc-600" />
        </div>
        <p className="text-zinc-500 text-sm font-medium">Screener</p>
        <p className="text-zinc-700 text-xs">{t('trade.screener')}</p>
      </motion.div>
    </div>
  );
};

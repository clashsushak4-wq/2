import { useTranslation } from '../../../../../../../i18n';
import type { Timeframe } from '../../types';
import { useBackButton } from '../../../../../../../hooks';
import { BottomSheet } from '../../../../../../../shared/ui';

interface TimeframeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

import { TIMEFRAMES } from '../../../data/marketData';
const TF_GROUPS = TIMEFRAMES.map(value => ({ label: value, value }));

export const TimeframeModal = ({ isOpen, onClose, selectedTimeframe, onSelectTimeframe }: TimeframeModalProps) => {
  const { t } = useTranslation();
  useBackButton(isOpen ? onClose : null);
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('trade.timeframe')}>
      <div className="grid grid-cols-4 gap-2 px-2 pb-6">
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
    </BottomSheet>
  );
};

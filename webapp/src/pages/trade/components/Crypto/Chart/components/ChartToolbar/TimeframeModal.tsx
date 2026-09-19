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

const TF_GROUPS = [
  { label: '1s', value: '1s' },
  { label: '1m', value: '1m' },
  { label: '2m', value: '2m' },
  { label: '3m', value: '3m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '4h', value: '4h' },
  { label: '6h', value: '6h' },
  { label: '8h', value: '8h' },
  { label: '12h', value: '12h' },
  { label: '1d', value: '1d' },
  { label: '2d', value: '2d' },
  { label: '3d', value: '3d' },
  { label: '5d', value: '5d' },
  { label: '1w', value: '1w' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
] as const;

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

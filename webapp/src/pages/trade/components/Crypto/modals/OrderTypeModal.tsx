import { Check } from 'lucide-react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore, OrderType } from '../store/useCryptoStore';

export const OrderTypeModal = () => {
  const isOpen = useCryptoStore(state => state.isOrderTypeOpen);
  const onClose = () => useCryptoStore.getState().setOrderTypeOpen(false);
  const currentType = useCryptoStore(state => state.orderType);
  const onChange = useCryptoStore.getState().setOrderType;
  const { t } = useTranslation();

  useBackButton(isOpen ? onClose : null);

  const options: { value: OrderType; labelKey: string }[] = [
    { value: 'limit', labelKey: 'trade.limitOrder' },
    { value: 'market', labelKey: 'trade.marketOrder' }
  ];

  const handleSelect = (val: OrderType) => {
    haptic.medium();
    onChange(val);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('trade.orderType')}>
      <div className="flex flex-col text-zinc-100 mb-2 px-2 mt-0">
        {options.map((opt) => (
          <button
            type="button"
            aria-pressed={currentType === opt.value}
            key={opt.value}
            className="flex items-center justify-between py-3 border-b border-zinc-800/50 cursor-pointer text-left"
            onClick={() => handleSelect(opt.value)}
          >
            <span className="text-[15px] font-medium">{t(opt.labelKey)}</span>
            {currentType === opt.value && <Check size={20} className="text-white" />}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};

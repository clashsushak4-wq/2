import { Check } from 'lucide-react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useCryptoStore, OrderType } from '../store/useCryptoStore';

export const OrderTypeModal = () => {
  const isOpen = useCryptoStore(state => state.isOrderTypeOpen);
  const onClose = () => useCryptoStore.getState().setOrderTypeOpen(false);
  const currentType = useCryptoStore(state => state.orderType);
  const onChange = useCryptoStore.getState().setOrderType;

  useBackButton(isOpen ? onClose : null);

  const options: { value: OrderType; label: string }[] = [
    { value: 'limit', label: 'Лимитный' },
    { value: 'market', label: 'Рыночный' }
  ];

  const handleSelect = (val: OrderType) => {
    haptic.medium();
    onChange(val);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Тип ордера">
      <div className="flex flex-col text-zinc-100 mb-2 px-2 mt-0">
        {options.map((opt) => (
          <div
            key={opt.value}
            className="flex items-center justify-between py-3 border-b border-zinc-800/50 cursor-pointer"
            onClick={() => handleSelect(opt.value)}
          >
            <span className="text-[15px] font-medium">{opt.label}</span>
            {currentType === opt.value && <Check size={20} className="text-white" />}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};

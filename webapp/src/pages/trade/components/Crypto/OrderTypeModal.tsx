import { Check } from 'lucide-react';
import { BottomSheet } from '../../../../shared/ui';
import { haptic } from '../../../../utils';

interface OrderTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: 'limit' | 'market';
  onChange: (type: 'limit' | 'market') => void;
}

export const OrderTypeModal = ({ isOpen, onClose, currentType, onChange }: OrderTypeModalProps) => {
  const options = [
    { value: 'limit', label: 'Лимитный' },
    { value: 'market', label: 'Рыночный' }
  ] as const;

  const handleSelect = (val: 'limit' | 'market') => {
    haptic.medium();
    onChange(val);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Тип ордера">
      <div className="flex flex-col text-zinc-100 mb-4 px-2">
        {options.map((opt) => (
          <div
            key={opt.value}
            className="flex items-center justify-between py-4 border-b border-zinc-800/50 cursor-pointer"
            onClick={() => handleSelect(opt.value)}
          >
            <span className="text-base font-medium">{opt.label}</span>
            {currentType === opt.value && <Check size={20} className="text-white" />}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
};

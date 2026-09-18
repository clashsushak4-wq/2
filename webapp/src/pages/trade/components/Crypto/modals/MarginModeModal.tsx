import { useState, useEffect } from 'react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore, MarginMode } from '../store/useCryptoStore';

export const MarginModeModal = () => {
  const isOpen = useCryptoStore(state => state.isMarginModeOpen);
  const onClose = () => useCryptoStore.getState().setMarginModeOpen(false);
  const currentMode = useCryptoStore(state => state.marginMode);
  const onChange = useCryptoStore.getState().setMarginMode;
  const { t } = useTranslation();

  useBackButton(isOpen ? onClose : null);
  const [mode, setMode] = useState<MarginMode>(currentMode);

  useEffect(() => {
    if (isOpen) {
      setMode(currentMode);
    }
  }, [isOpen, currentMode]);

  const handleConfirm = () => {
    haptic.medium();
    onChange(mode);
    onClose();
  };

  const handleSelect = (selectedMode: MarginMode) => {
    haptic.light();
    setMode(selectedMode);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Режим маржи">
      <div className="flex flex-col text-zinc-100">
        <p className="text-[11px] text-zinc-400 mb-3 leading-tight">
          Настройка режима маржи действует только для текущей торговой пары
        </p>

        <div className="flex flex-col gap-2 mb-4">
          {/* Cross */}
          <button
            type="button"
            onClick={() => handleSelect('cross')}
            className={`flex flex-col px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
              mode === 'cross' ? 'border-white bg-zinc-900' : 'border-zinc-800 bg-transparent'
            }`}
          >
            <span className="text-[15px] font-bold mb-0.5">Кросс</span>
            <span className="text-[10px] text-zinc-400 leading-tight">
              Все позиции по одному маржинальному активу имеют один и тот же баланс маржи. В случае ликвидации трейдеры рискуют потерять весь остаток маржи вместе с любыми позициями по маржинальному активу.
            </span>
          </button>

          {/* Isolated */}
          <button
            type="button"
            onClick={() => handleSelect('isolated')}
            className={`flex flex-col px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
              mode === 'isolated' ? 'border-white bg-zinc-900' : 'border-zinc-800 bg-transparent'
            }`}
          >
            <span className="text-[15px] font-bold mb-0.5">Изолированная</span>
            <span className="text-[10px] text-zinc-400 leading-tight">
              В режиме изолированной маржи на каждую позицию выделяется определенная сумма маржи. Если маржа позиции опускается ниже уровня поддерживаемой маржи, позиция ликвидируется, а максимальный убыток ограничивается маржой позиции. В режиме изолированной маржи вы можете добавлять или уменьшать маржу для конкретной позиции.
            </span>
          </button>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-2 bg-white text-black font-bold text-base rounded-xl transition-transform active:scale-95"
        >
          {t('trade.confirm') || 'Подтвердить'}
        </button>
      </div>
    </BottomSheet>
  );
};

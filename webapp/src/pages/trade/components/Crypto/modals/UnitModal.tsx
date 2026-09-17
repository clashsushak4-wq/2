import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore, UnitType } from '../store/useCryptoStore';

const OPTIONS: { id: UnitType; titleKey: string; descKey: string }[] = [
  {
    id: 'qty_btc',
    titleKey: 'trade.quantityBtc',
    descKey: 'trade.quantityBtcDescription',
  },
  {
    id: 'cost_usdt',
    titleKey: 'trade.costUsdt',
    descKey: 'trade.costUsdtDescription',
  },
  {
    id: 'value_usdt',
    titleKey: 'trade.valueUsdt',
    descKey: 'trade.valueUsdtDescription',
  },
];

export const UnitModal = () => {
  const isOpen = useCryptoStore(state => state.isUnitOpen);
  const onClose = () => useCryptoStore.getState().setUnitOpen(false);
  const currentUnit = useCryptoStore(state => state.unit);
  const onChange = useCryptoStore.getState().setUnit;
  const { t } = useTranslation();

  useBackButton(isOpen ? onClose : null);

  const handleSelect = (val: UnitType) => {
    haptic.medium();
    onChange(val);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('trade.futuresUnitSettings')}>
      <div className="flex flex-col text-zinc-100 mb-2 px-2 mt-0 gap-2">
        {OPTIONS.map((opt) => {
          const isSelected = currentUnit === opt.id;
          return (
            <button
              type="button"
              aria-pressed={isSelected}
              key={opt.id}
              className={`p-3 rounded-xl border cursor-pointer transition-colors text-left ${
                isSelected ? 'border-white bg-[#1a1a1a]' : 'border-zinc-800/80 bg-transparent'
              }`}
              onClick={() => handleSelect(opt.id)}
            >
              <div className="font-bold text-[15px] mb-1">{t(opt.titleKey)}</div>
              <div className="text-[11px] text-zinc-400 leading-tight font-medium">{t(opt.descKey)}</div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};

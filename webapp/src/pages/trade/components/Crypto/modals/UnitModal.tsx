import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { getMockInstrument } from '../data/mockInstruments.ts';
import { useCryptoStore, UnitType } from '../store/useCryptoStore';

export const UnitModal = () => {
  const isOpen = useCryptoStore(state => state.isUnitOpen);
  const onClose = () => useCryptoStore.getState().setUnitOpen(false);
  const currentUnit = useCryptoStore(state => state.unit);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const onChange = useCryptoStore.getState().setUnit;
  const { t } = useTranslation();
  const instrument = getMockInstrument(selectedSymbol);
  const options: { id: UnitType; title: string; description: string }[] = [
    {
      id: 'qty_base',
      title: `${t('trade.amount')} – ${instrument.baseAsset}`,
      description: `${t('trade.quantityAssetDescription')} ${instrument.baseAsset}`,
    },
    {
      id: 'cost_quote',
      title: `${t('trade.cost')} – ${instrument.quoteAsset}`,
      description: t('trade.costQuoteDescription'),
    },
    {
      id: 'value_quote',
      title: `${t('trade.value')} – ${instrument.quoteAsset}`,
      description: t('trade.valueQuoteDescription'),
    },
  ];

  useBackButton(isOpen ? onClose : null);

  const handleSelect = (val: UnitType) => {
    haptic.medium();
    onChange(val);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('trade.futuresUnitSettings')}>
      <div className="flex flex-col text-zinc-100 mb-2 px-2 mt-0 gap-2">
        {options.map((opt) => {
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
              <div className="font-bold text-[15px] mb-1">{opt.title}</div>
              <div className="text-[11px] text-zinc-400 leading-tight font-medium">{opt.description}</div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};

import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useCryptoStore, UnitType } from '../store/useCryptoStore';

const OPTIONS: { id: UnitType; title: string; desc: string }[] = [
  {
    id: 'qty_btc',
    title: 'Количество – BTC',
    desc: 'Количество по фьючерсной позиции в BTC',
  },
  {
    id: 'cost_usdt',
    title: 'Себестоимость – USDT',
    desc: 'Фактическая сумма маржи по сделке, например, начальная маржа на момент открытия позиции или маржа, рассчитанная на момент закрытия позиции',
  },
  {
    id: 'value_usdt',
    title: 'Стоимость – USDT',
    desc: 'Рыночная стоимость базового актива, рассчитанная на основе маржи и кредитного плеча и скорректированная с учетом изменений рыночной цены.',
  },
];

export const UnitModal = () => {
  const isOpen = useCryptoStore(state => state.isUnitOpen);
  const onClose = () => useCryptoStore.getState().setUnitOpen(false);
  const currentUnit = useCryptoStore(state => state.unit);
  const onChange = useCryptoStore.getState().setUnit;

  useBackButton(isOpen ? onClose : null);

  const handleSelect = (val: UnitType) => {
    haptic.medium();
    onChange(val);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Настройка единицы фьючерсов">
      <div className="flex flex-col text-zinc-100 mb-2 px-2 mt-0 gap-2">
        {OPTIONS.map((opt) => {
          const isSelected = currentUnit === opt.id;
          return (
            <div
              key={opt.id}
              className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                isSelected ? 'border-white bg-[#1a1a1a]' : 'border-zinc-800/80 bg-transparent'
              }`}
              onClick={() => handleSelect(opt.id)}
            >
              <div className="font-bold text-[15px] mb-1">{opt.title}</div>
              <div className="text-[11px] text-zinc-400 leading-tight font-medium">{opt.desc}</div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
};

import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const PriceInput = () => {
  const orderType = useCryptoStore(state => state.orderType);
  const price = useCryptoStore(state => state.price);
  const setPrice = useCryptoStore(state => state.setPrice);
  const { t } = useTranslation();

  if (orderType === 'market') {
    return (
      <div className="flex items-center gap-1.5 mb-2">
        <div className="flex-1 bg-zinc-900 rounded px-3 py-2 flex items-center h-[42px]">
          <span className="text-[13px] text-zinc-500 font-medium tracking-wide">{t('trade.executeAtMarket')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mb-2">
      <div className="flex-1 bg-zinc-900 rounded px-2 py-1 flex flex-col">
        <label htmlFor="trade-limit-price" className="text-[10px] text-zinc-400">{t('trade.price')} (USDT)</label>
        <input
          id="trade-limit-price"
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="bg-transparent text-sm font-bold text-zinc-100 outline-none w-full"
        />
      </div>
      <button type="button" className="bg-zinc-800 rounded px-2 py-1 h-full flex items-center justify-center cursor-pointer" onClick={() => haptic.light()}>
        <span className="text-xs font-bold text-zinc-200">BBO</span>
      </button>
    </div>
  );
};

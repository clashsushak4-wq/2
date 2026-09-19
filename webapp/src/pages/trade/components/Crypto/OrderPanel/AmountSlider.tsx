import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { getMockInstrument } from '../data/mockInstruments.ts';
import { useCryptoStore, UnitType } from '../store/useCryptoStore';

const getUnitLabel = (
  unit: UnitType,
  baseAsset: string,
  quoteAsset: string,
  t: (key: string) => string,
) => {
  if (unit === 'qty_base') return { left: t('trade.amount'), right: baseAsset };
  if (unit === 'cost_quote') return { left: t('trade.cost'), right: quoteAsset };
  return { left: t('trade.value'), right: quoteAsset };
};

export const AmountSlider = () => {
  const amountPercent = useCryptoStore(state => state.amountPercent);
  const setAmountPercent = useCryptoStore.getState().setAmountPercent;
  const unit = useCryptoStore(state => state.unit);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const setUnitOpen = useCryptoStore.getState().setUnitOpen;
  const { t } = useTranslation();
  const instrument = getMockInstrument(selectedSymbol);
  const unitInfo = getUnitLabel(unit, instrument.baseAsset, instrument.quoteAsset, t);
  const baseAmount = amountPercent * 0.0005;
  const quoteValue = baseAmount * instrument.price;

  return (
    <>
      {/* Amount Input */}
      <div className="mb-1 flex items-center justify-between rounded bg-zinc-900 px-2 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 font-medium">{unitInfo.left}</span>
          {amountPercent > 0 && <span className="text-sm text-zinc-100 font-bold ml-1">{amountPercent}%</span>}
        </div>
        
        <button
          type="button"
          aria-haspopup="dialog"
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => { haptic.light(); setUnitOpen(true); }}
        >
          <span className="text-sm text-zinc-300 font-bold">{unitInfo.right}</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </button>
      </div>

      {amountPercent > 0 && (
        <div className="mb-1 flex h-5 items-center font-mono text-[10px] text-zinc-500">
          ≈ <span className="text-zinc-300 ml-1">{quoteValue.toFixed(2)} {instrument.quoteAsset}</span>
          <span className="text-zinc-600 mx-1">/</span>
          <span className="text-zinc-300">{baseAmount.toFixed(4)} {instrument.baseAsset}</span>
        </div>
      )}

      {/* Slider */}
      <div className="relative mb-1 flex h-4 items-center px-1 group">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={amountPercent}
          onChange={(e) => {
            setAmountPercent(Number(e.target.value));
          }}
          onPointerUp={() => haptic.light()}
          onKeyUp={(event) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) haptic.light();
          }}
          aria-label={t('trade.amount')}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />
        <div className="h-0.5 w-full bg-zinc-800 relative z-10 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 bg-white" style={{ width: `${amountPercent}%` }} />

          {[0, 25, 50, 75, 100].map(mark => {
            const isZero = mark === 0;
            return (
              <div
                key={mark}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full -translate-x-1/2 transition-colors ${amountPercent >= mark ? (isZero ? 'bg-zinc-100' : 'bg-white') : 'bg-zinc-700'}`}
                style={{
                  left: `${mark}%`,
                  width: isZero ? '10px' : '6px',
                  height: isZero ? '10px' : '6px'
                }}
              />
            )
          })}

          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)] -translate-x-1/2"
            style={{ left: `${amountPercent}%` }}
          />
        </div>
      </div>
    </>
  );
};

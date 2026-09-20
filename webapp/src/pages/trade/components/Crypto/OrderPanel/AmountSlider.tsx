import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import type { UnitType } from '../store/useCryptoStore';
import { useOrderCalculations } from '../hooks/useOrderCalculations';
import {
  amountValueFromQuantity,
  calculateOrderEstimate,
  formatByStep,
} from '../domain/orderCalculations';
import { isCleanNumber, normalizeQuantity } from '../domain/orderNormalization';
import { formatWithSpaces } from '../data/marketData';

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
  const amountValue = useCryptoStore(state => state.amountValue);
  const setAmountValue = useCryptoStore.getState().setAmountValue;
  const setAmountPercent = useCryptoStore.getState().setAmountPercent;
  const unit = useCryptoStore(state => state.unit);
  const leverage = useCryptoStore(state => state.leverage);
  const orderType = useCryptoStore(state => state.orderType);
  const orderIntent = useCryptoStore(state => state.orderIntent);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const setUnitOpen = useCryptoStore.getState().setUnitOpen;
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);
  const unitInfo = getUnitLabel(unit, instrument.baseAsset, instrument.quoteAsset, t);
  const {
    availableBalance,
    baseAmount,
    maxQuantity,
    maxToClose,
    notional,
    parsedPrice,
    percent,
    spec,
    validationErrors,
  } = useOrderCalculations();
  const sliderPercent = Math.round(percent);

  const updateManualAmount = (nextValue: string) => {
    const raw = nextValue.replace(/\s/g, '');
    if (!/^\d*(\.\d*)?$/.test(raw)) return;
    setAmountValue(raw);
    const numericValue = raw === '' ? 0 : Number(raw);
    const cleanValue = isCleanNumber(numericValue) ? numericValue : 0;
    const nextEstimate = calculateOrderEstimate({
      intent: orderIntent,
      unit,
      inputValue: Math.max(0, cleanValue),
      price: parsedPrice,
      leverage,
      availableBalance,
      orderType,
      maxCloseQuantity: maxToClose,
      spec,
    });
    setAmountPercent(Math.round(nextEstimate.percent));
  };

  const updateSlider = (nextPercent: number) => {
    const quantity = normalizeQuantity(maxQuantity * (nextPercent / 100), spec);
    const feeRate = orderType === 'limit' ? spec.makerFeeRate : spec.takerFeeRate;
    const nextValue = amountValueFromQuantity(unit, quantity, parsedPrice, leverage, feeRate);
    const formatted = unit === 'qty_base'
      ? formatByStep(nextValue, spec.quantityStep)
      : nextValue.toFixed(2);
    setAmountValue(nextPercent === 0 ? '' : formatted);
    setAmountPercent(nextPercent);
  };

  return (
    <>
      <div className="mb-1 flex items-center justify-between rounded bg-zinc-900 px-2 py-1">
        <div className="min-w-0 flex-1">
          <label htmlFor="trade-order-amount" className="block text-[10px] leading-tight text-zinc-500">
            {unitInfo.left}
          </label>
          <input
            id="trade-order-amount"
            type="text"
            inputMode="decimal"
            value={formatWithSpaces(amountValue)}
            placeholder="0"
            onChange={(event) => updateManualAmount(event.target.value)}
            className="w-full bg-transparent text-sm font-bold leading-tight text-zinc-100 outline-none"
          />
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

      {baseAmount > 0 && (
        <div className="mb-1 flex h-5 items-center font-mono text-[10px] text-zinc-500">
          ≈ <span className="text-zinc-300 ml-1">{notional.toFixed(2)} {instrument.quoteAsset}</span>
          <span className="text-zinc-600 mx-1">/</span>
          <span className="text-zinc-300">{formatByStep(baseAmount, spec.quantityStep)} {instrument.baseAsset}</span>
        </div>
      )}

      {amountValue !== '' && validationErrors.length > 0 && (
        <div className="mb-1 text-[10px] leading-tight text-bitget-red" role="alert">
          {t(`trade.validation_${validationErrors[0]}`)}
        </div>
      )}

      {/* Slider */}
      <div className="relative mb-1 flex h-4 items-center px-1 group">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={sliderPercent}
          onChange={(e) => {
            updateSlider(Number(e.target.value));
          }}
          onPointerUp={() => haptic.light()}
          onKeyUp={(event) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) haptic.light();
          }}
          aria-label={t('trade.amount')}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />
        <div className="h-0.5 w-full bg-zinc-800 relative z-10 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 bg-white" style={{ width: `${sliderPercent}%` }} />

          {[0, 25, 50, 75, 100].map(mark => {
            const isZero = mark === 0;
            return (
              <div
                key={mark}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full -translate-x-1/2 transition-colors ${sliderPercent >= mark ? (isZero ? 'bg-zinc-100' : 'bg-white') : 'bg-zinc-700'}`}
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
            style={{ left: `${sliderPercent}%` }}
          />
        </div>
      </div>
    </>
  );
};

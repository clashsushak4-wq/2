import { useRef } from 'react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { roundToStep } from '../domain/orderCalculations';
import { calculateTriggerPrice, isValidTriggerPrice } from '../domain/tpslCalculations';
import type { TradeDirection } from '../domain/types';
import { oppositeDirection } from '../domain/demoAccount';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';
import { useOrderCalculations } from '../hooks/useOrderCalculations';

export const ActionButtons = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const orderType = useCryptoStore(state => state.orderType);
  const orderIntent = useCryptoStore(state => state.orderIntent);
  const leverage = useCryptoStore(state => state.leverage);
  const marginMode = useCryptoStore(state => state.marginMode);
  const price = useCryptoStore(state => state.price);
  const isTPSL = useCryptoStore(state => state.isTPSL);
  const tpMode = useCryptoStore(state => state.tpMode);
  const slMode = useCryptoStore(state => state.slMode);
  const tpValue = useCryptoStore(state => state.tpValue);
  const slValue = useCryptoStore(state => state.slValue);
  const resetOrderDraft = useCryptoStore.getState().resetOrderDraft;
  const showToast = useCryptoStore.getState().showToast;
  const placeOrder = usePaperTradingStore.getState().placeOrder;
  const instrument = useInstrument(selectedSymbol);
  const { t } = useTranslation();
  const submitLock = useRef(false);
  const busy = usePaperTradingStore(state => state.busy);
  const {
    baseAmount,
    fee,
    quoteCost,
    notional,
    maxToOpen,
    maxToCloseLong,
    maxToCloseShort,
    position,
    parsedPrice,
    spec,
    validationErrors,
    isValid,
  } = useOrderCalculations();

  const handleAction = async (targetDirection: TradeDirection) => {
    if (submitLock.current) return;
    haptic.medium();
    const maxCloseQuantity = targetDirection === 'long' ? maxToCloseLong : maxToCloseShort;
    if (orderIntent === 'close' && maxCloseQuantity <= 0) {
      showToast(t(position
        ? 'trade.validation_close_quantity_exceeded'
        : 'trade.validation_position_not_found'), 'error');
      return;
    }
    if (!isValid) {
      const errorKey = validationErrors[0] ?? 'amount_required';
      showToast(t(`trade.validation_${errorKey}`), 'error');
      return;
    }

    const takeProfitPrice = orderIntent === 'open' && isTPSL && tpValue !== ''
      ? calculateTriggerPrice({
        mode: tpMode,
        value: Number(tpValue),
        kind: 'tp',
        direction: targetDirection,
        entryPrice: parsedPrice,
        leverage,
        quantity: baseAmount,
      })
      : null;
    const stopLossPrice = orderIntent === 'open' && isTPSL && slValue !== ''
      ? calculateTriggerPrice({
        mode: slMode,
        value: Number(slValue),
        kind: 'sl',
        direction: targetDirection,
        entryPrice: parsedPrice,
        leverage,
        quantity: baseAmount,
      })
      : null;

    if (orderIntent === 'open' && isTPSL && takeProfitPrice === null && stopLossPrice === null) {
      showToast(t('trade.validation_tpsl_required'), 'error');
      return;
    }
    if (takeProfitPrice !== null && !isValidTriggerPrice('tp', targetDirection, takeProfitPrice, parsedPrice)) {
      showToast(t('trade.validation_take_profit_direction'), 'error');
      return;
    }
    if (stopLossPrice !== null && !isValidTriggerPrice('sl', targetDirection, stopLossPrice, parsedPrice)) {
      showToast(t('trade.validation_stop_loss_direction'), 'error');
      return;
    }

    submitLock.current = true;

    const result = await placeOrder({
      clientOrderId: `terminal-${Date.now()}-${orderIntent}-${targetDirection}`,
      symbol: instrument.symbol,
      direction: orderIntent === 'close' ? oppositeDirection(targetDirection) : targetDirection,
      intent: orderIntent,
      type: orderType,
      quantity: baseAmount,
      limitPrice: orderType === 'limit' ? Number(price) : null,
      marketPrice: instrument.price,
      leverage,
      marginMode,
      tpsl: {
        takeProfitPrice: takeProfitPrice === null ? null : roundToStep(takeProfitPrice, spec.tickSize),
        stopLossPrice: stopLossPrice === null ? null : roundToStep(stopLossPrice, spec.tickSize),
      },
      spec,
    });

    submitLock.current = false;
    if (!result.ok) {
      showToast(
        result.reason ? t(`trade.validation_${result.reason}`) : t('trade.orderRejected'),
        'error',
      );
      return;
    }
    showToast(t(result.status === 'filled' ? 'trade.orderFilled' : 'trade.orderPending'), 'success');
    resetOrderDraft();
  };

  const isLongValid = !busy && isValid && (orderIntent === 'open' || maxToCloseLong > 0);
  const isShortValid = !busy && isValid && (orderIntent === 'open' || maxToCloseShort > 0);
  const maxLabel = orderIntent === 'open' ? t('trade.maxToOpen') : t('trade.maxToClose');
  const orderSummary = orderIntent === 'open'
    ? `${quoteCost.toFixed(2)} + ${fee.toFixed(2)} ${instrument.quoteAsset}`
    : `${notional.toFixed(2)} ${instrument.quoteAsset}`;

  return (
    <div className="mt-2 flex flex-col gap-3">
      {orderIntent === 'close' && !position && (
        <div className="rounded bg-zinc-900 px-2 py-1.5 text-center text-[10px] leading-tight text-zinc-500">
          {t('trade.noPositionToClose')}
        </div>
      )}
      {orderIntent === 'close' && position && maxToCloseLong <= 0 && maxToCloseShort <= 0 && (
        <div className="rounded bg-zinc-900 px-2 py-1.5 text-center text-[10px] leading-tight text-zinc-500">
          {t('trade.validation_close_quantity_exceeded')}
        </div>
      )}
      {/* Long Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
          <span>{maxLabel}</span>
          <span className="text-zinc-200 font-medium font-mono">
            {(orderIntent === 'open' ? maxToOpen : maxToCloseLong).toFixed(4)} {instrument.baseAsset}
          </span>
        </div>

        <button
          type="button"
          disabled={!isLongValid}
          onClick={() => handleAction('long')}
          className={`mt-1 flex min-h-11 w-full flex-col items-center justify-center rounded-xl px-2 py-1.5 text-white transition-all active:scale-95 ${
            !isLongValid ? 'bg-bitget-green/50 cursor-not-allowed' : 'bg-bitget-green'
          }`}
        >
          <span className="font-bold text-base leading-tight">
            {t(orderIntent === 'open' ? 'trade.openLong' : 'trade.closeLong')}
          </span>
          <span className="text-[10px] text-white/70 font-medium -mt-0.5">{orderSummary}</span>
        </button>
      </div>

      {/* Short Section */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center text-[11px] text-zinc-400 px-1">
          <span>{maxLabel}</span>
          <span className="text-zinc-200 font-medium font-mono">
            {(orderIntent === 'open' ? maxToOpen : maxToCloseShort).toFixed(4)} {instrument.baseAsset}
          </span>
        </div>

        <button
          type="button"
          disabled={!isShortValid}
          onClick={() => handleAction('short')}
          className={`mt-1 flex min-h-11 w-full flex-col items-center justify-center rounded-xl px-2 py-1.5 text-white transition-all active:scale-95 ${
            !isShortValid ? 'bg-bitget-red/50 cursor-not-allowed' : 'bg-bitget-red'
          }`}
        >
          <span className="font-bold text-base leading-tight">
            {t(orderIntent === 'open' ? 'trade.openShort' : 'trade.closeShort')}
          </span>
          <span className="text-[10px] text-white/70 font-medium -mt-0.5">{orderSummary}</span>
        </button>
      </div>
    </div>
  );
};

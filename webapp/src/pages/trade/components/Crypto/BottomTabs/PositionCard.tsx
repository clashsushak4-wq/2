import { useRef } from 'react';
import { useTranslation } from '../../../../../i18n';
import { haptic } from '../../../../../utils';
import type { MockInstrument } from '../data/mockInstruments';
import { toInstrumentSpec } from '../data/mockInstruments';
import { formatByStep } from '../domain/orderCalculations';
import { calculateCloseQuantityByPercent } from '../domain/positionCalculations';
import type { PaperPosition } from '../domain/types';
import { useCryptoStore } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

interface PositionCardProps {
  instrument: MockInstrument;
  onEditTPSL: () => void;
  position: PaperPosition;
}

export const PositionCard = ({ instrument, onEditTPSL, position }: PositionCardProps) => {
  const { t } = useTranslation();
  const closePosition = usePaperTradingStore.getState().closePosition;
  const showToast = useCryptoStore.getState().showToast;
  const closeLock = useRef(false);
  const roe = position.initialMargin > 0
    ? (position.unrealizedPnl / position.initialMargin) * 100
    : 0;
  const pnlColor = position.unrealizedPnl >= 0 ? 'text-bitget-green' : 'text-bitget-red';

  const handleClose = (percent: number) => {
    if (closeLock.current) return;
    const quantity = calculateCloseQuantityByPercent(
      position.quantity,
      percent,
      instrument.quantityStep,
    );
    if (quantity <= 0) {
      showToast(t('trade.action_close_quantity_invalid'), 'error');
      return;
    }

    closeLock.current = true;
    haptic.medium();
    const result = closePosition(
      position.symbol,
      instrument.price,
      toInstrumentSpec(instrument),
      quantity,
    );
    const quantitySuffix = result.quantity
      ? `: ${formatByStep(result.quantity, instrument.quantityStep)} ${instrument.baseAsset}`
      : '';
    showToast(`${t(`trade.action_${result.code}`)}${quantitySuffix}`, result.ok ? 'success' : 'error');
    window.setTimeout(() => { closeLock.current = false; }, 350);
  };

  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-100">{position.symbol}</span>
          <span className={position.direction === 'long' ? 'text-bitget-green' : 'text-bitget-red'}>
            {t(position.direction === 'long' ? 'trade.long' : 'trade.short')} {position.leverage}x
          </span>
        </div>
        <span className={`font-mono font-bold ${pnlColor}`}>
          {position.unrealizedPnl >= 0 ? '+' : ''}{position.unrealizedPnl.toFixed(2)} ({roe.toFixed(2)}%)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-500">
        <span>{t('trade.size')}</span>
        <span className="text-right font-mono text-zinc-200">
          {formatByStep(position.quantity, instrument.quantityStep)} {instrument.baseAsset}
        </span>
        <span>{t('trade.entryPrice')}</span>
        <span className="text-right font-mono text-zinc-200">
          {position.averageEntryPrice.toFixed(instrument.priceDecimals)}
        </span>
        <span>{t('trade.markPrice')}</span>
        <span className="text-right font-mono text-zinc-200">
          {position.markPrice.toFixed(instrument.priceDecimals)}
        </span>
        <span>{t('trade.liquidationPrice')}</span>
        <span className="text-right font-mono text-zinc-200">
          {position.liquidationPrice.toFixed(instrument.priceDecimals)}
        </span>
      </div>

      {(position.tpsl.takeProfitPrice !== null || position.tpsl.stopLossPrice !== null) && (
        <div className="mt-2 flex gap-3 text-[11px] text-zinc-500">
          <span>TP: <b className="text-zinc-300">{position.tpsl.takeProfitPrice?.toFixed(instrument.priceDecimals) ?? '—'}</b></span>
          <span>SL: <b className="text-zinc-300">{position.tpsl.stopLossPrice?.toFixed(instrument.priceDecimals) ?? '—'}</b></span>
        </div>
      )}

      <div className="mt-2 grid grid-cols-2 gap-1">
        <button
          type="button"
          className="rounded-md border border-zinc-800 py-1.5 font-medium text-zinc-300"
          onClick={() => { haptic.light(); onEditTPSL(); }}
        >
          {t('trade.editTpsl')}
        </button>
        <button
          type="button"
          className="rounded-md bg-zinc-100 py-1.5 font-bold text-zinc-950 active:scale-[0.98]"
          onClick={() => handleClose(100)}
        >
          {t('trade.closePosition')}
        </button>
      </div>

      <div className="mt-2">
        <div className="mb-1 text-[10px] text-zinc-500">{t('trade.partialClose')}</div>
        <div className="grid grid-cols-3 gap-1">
          {[25, 50, 75].map((percent) => {
            const closeQuantity = calculateCloseQuantityByPercent(
              position.quantity,
              percent,
              instrument.quantityStep,
            );
            return (
              <button
                type="button"
                key={percent}
                disabled={closeQuantity <= 0}
                className="rounded-md bg-zinc-900 py-1.5 font-medium text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => handleClose(percent)}
              >
                {percent}%
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
};

import { useTranslation } from '../../../../../i18n';
import { usePaperTradingStore } from '../store/usePaperTradingStore';
import { oppositeDirection } from '../engine/paperTradingEngine';
import { formatByStep } from '../domain/orderCalculations';
import { useCryptoStore } from '../store/useCryptoStore';

export const HistoryTab = () => {
  const { t, language } = useTranslation();
  const orders = usePaperTradingStore(state => state.orders);
  const instruments = useCryptoStore(state => state.instruments);
  const history = orders.filter((order) => order.status !== 'pending' && order.status !== 'partially_filled');

  if (history.length === 0) {
    return (
      <div className="px-2 py-8 flex flex-col items-center justify-center text-zinc-500">
        <span className="text-sm">{t('trade.emptyHistory')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-900 px-2 pb-5 pt-2 text-xs">
      {history.map((order) => {
        const intent = order.intent ?? (order.reduceOnly ? 'close' : 'open');
        const positionDirection = intent === 'close'
          ? oppositeDirection(order.direction)
          : order.direction;
        const instrument = instruments[order.symbol];
        const quantityStep = instrument?.quantityStep ?? 0.0001;
        const priceStep = instrument?.tickSize ?? 0.0001;
        const reasonKey = order.rejectReason
          ? order.rejectReason.startsWith('reduce_only_')
            ? `trade.reason_${order.rejectReason}`
            : `trade.validation_${order.rejectReason}`
          : null;
        return (
        <div key={order.id} className="py-2">
          <div className="flex items-center justify-between">
            <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-100">{order.symbol}</span>
              <span className={positionDirection === 'long' ? 'text-bitget-green' : 'text-bitget-red'}>
                {t(positionDirection === 'long' ? 'trade.long' : 'trade.short')}
              </span>
              <span className="rounded bg-zinc-900 px-1 py-0.5 text-[10px] text-zinc-500">
                {t(intent === 'close' ? 'trade.closeTab' : 'trade.openTab')}
              </span>
              <span className="text-[10px] text-zinc-600">
                {t(order.type === 'limit' ? 'trade.limitOrder' : 'trade.marketOrder')}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-1">
              {new Intl.DateTimeFormat(language, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }).format(new Date(order.updatedAt))}
            </div>
            </div>
            <div className="text-right">
            <div className="font-mono text-zinc-200">
              {formatByStep(order.filledQuantity, quantityStep)} / {formatByStep(order.quantity, quantityStep)}
            </div>
            <div className="text-[10px] uppercase text-zinc-500">{t(`trade.status_${order.status}`)}</div>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
            <span>
              {t('trade.price')}: {order.averageFillPrice !== null
                ? formatByStep(order.averageFillPrice, priceStep)
                : order.requestedPrice !== null
                  ? formatByStep(order.requestedPrice, priceStep)
                  : '—'}
            </span>
            <span>{t('trade.paidFees')}: {order.fee.toFixed(2)}</span>
          </div>
          {reasonKey && <div className="mt-1 text-[10px] text-amber-500">{t(reasonKey)}</div>}
        </div>
        );
      })}
    </div>
  );
};

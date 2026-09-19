import { useTranslation } from '../../../../../i18n';
import { haptic } from '../../../../../utils';
import { usePaperTradingStore } from '../store/usePaperTradingStore';
import { oppositeDirection } from '../engine/paperTradingEngine';
import { formatByStep } from '../domain/orderCalculations';
import { useCryptoStore } from '../store/useCryptoStore';

export const OrdersTab = () => {
  const { t } = useTranslation();
  const orders = usePaperTradingStore(state => state.orders);
  const instruments = useCryptoStore(state => state.instruments);
  const showToast = useCryptoStore.getState().showToast;
  const cancelOrder = usePaperTradingStore.getState().cancelOrder;
  const cancelAllOrders = usePaperTradingStore.getState().cancelAllOrders;
  const openOrders = orders.filter((order) => order.status === 'pending' || order.status === 'partially_filled');

  if (openOrders.length === 0) {
    return (
      <div className="px-2 py-8 flex flex-col items-center justify-center text-zinc-500">
        <span className="text-sm">{t('trade.noOpenOrders')}</span>
      </div>
    );
  }

  return (
    <div className="px-2 pb-5 pt-2">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          className="text-xs text-zinc-400"
          onClick={() => {
            haptic.medium();
            const result = cancelAllOrders();
            const suffix = result.affectedCount > 0 ? `: ${result.affectedCount}` : '';
            showToast(`${t(`trade.action_${result.code}`)}${suffix}`, result.ok ? 'success' : 'error');
          }}
        >
          {t('trade.cancelAll')}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {openOrders.map((order) => {
          const intent = order.intent ?? (order.reduceOnly ? 'close' : 'open');
          const positionDirection = intent === 'close'
            ? oppositeDirection(order.direction)
            : order.direction;
          const instrument = instruments[order.symbol];
          const formattedPrice = order.requestedPrice !== null && instrument
            ? formatByStep(order.requestedPrice, instrument.tickSize)
            : order.requestedPrice?.toString() ?? '—';
          const formattedQuantity = instrument
            ? formatByStep(order.remainingQuantity, instrument.quantityStep)
            : order.remainingQuantity.toString();
          return (
          <article key={order.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-100">{order.symbol}</span>
                <span className={positionDirection === 'long' ? 'text-bitget-green' : 'text-bitget-red'}>
                  {t(positionDirection === 'long' ? 'trade.long' : 'trade.short')}
                </span>
                <span className="rounded bg-zinc-900 px-1 py-0.5 text-[10px] text-zinc-400">
                  {t(intent === 'close' ? 'trade.closeTab' : 'trade.openTab')}
                </span>
                <span className="text-zinc-500">{t(order.type === 'limit' ? 'trade.limitOrder' : 'trade.marketOrder')}</span>
              </div>
              <span className="text-amber-400">{t('trade.pending')}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-500">
              <span>{t('trade.price')}</span>
              <span className="text-right font-mono text-zinc-200">{formattedPrice}</span>
              <span>{t('trade.amount')}</span>
              <span className="text-right font-mono text-zinc-200">{formattedQuantity}</span>
              <span>{t('trade.margin')}</span>
              <span className="text-right font-mono text-zinc-200">{order.reservedMargin.toFixed(2)}</span>
            </div>
            <button
              type="button"
              className="mt-2 w-full rounded-md bg-zinc-900 py-1.5 font-medium text-zinc-200"
              onClick={() => {
                haptic.light();
                const result = cancelOrder(order.id);
                showToast(t(`trade.action_${result.code}`), result.ok ? 'success' : 'error');
              }}
            >
              {t('trade.cancelOrder')}
            </button>
          </article>
          );
        })}
      </div>
    </div>
  );
};

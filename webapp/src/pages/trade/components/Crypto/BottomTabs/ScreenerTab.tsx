import { useTranslation } from '../../../../../i18n';
import { calculatePaperAccount, usePaperTradingStore } from '../store/usePaperTradingStore';

export const ScreenerTab = () => {
  const { t } = useTranslation();
  const state = usePaperTradingStore();
  const reset = async () => {
    if (window.confirm(t('trade.confirmResetDemo'))) await state.resetAccount();
  };
  const account = calculatePaperAccount(state);
  const filledOrders = state.orders.filter((order) => order.status === 'filled' || order.status === 'liquidated');
  const profitableEntries = state.ledger.filter((entry) => entry.type === 'realized_pnl' && entry.amount > 0).length;
  const closedTrades = state.ledger.filter((entry) => entry.type === 'realized_pnl').length;
  const winRate = closedTrades > 0 ? (profitableEntries / closedTrades) * 100 : 0;

  return (
    <div className="px-2 pb-5 pt-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        {[
          [t('trade.totalPnl'), account.realizedPnl.toFixed(2)],
          [t('trade.unrealizedPnl'), account.unrealizedPnl.toFixed(2)],
          [t('trade.paidFees'), account.paidFees.toFixed(2)],
          [t('trade.market.funding'), account.fundingPaid.toFixed(2)],
          [t('trade.winRate'), `${winRate.toFixed(1)}%`],
          [t('trade.filledOrders'), String(filledOrders.length)],
          [t('trade.equity'), account.equity.toFixed(2)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-900 bg-zinc-950 p-2.5">
            <div className="text-zinc-500">{label}</div>
            <div className="mt-1 font-mono text-sm font-bold text-zinc-100">{value}</div>
          </div>
        ))}
      </div>
      <button disabled={state.busy} onClick={() => void reset()}
        className="mt-3 w-full rounded-lg border border-zinc-800 py-2 text-zinc-400 disabled:opacity-40">
        {t('trade.resetDemo')}
      </button>
      <p className="mt-3 text-zinc-500">{t('trade.market.accountInfo')}</p>
      <p className="mt-2 text-zinc-500">{t('trade.market.executionModel')}</p>

    </div>
  );
};

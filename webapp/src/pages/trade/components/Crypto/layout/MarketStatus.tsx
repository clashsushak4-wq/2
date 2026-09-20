import { useTranslation } from '../../../../../i18n';
import { useMarketStore } from '../store/useMarketStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

export const MarketStatus = () => {
  const { t } = useTranslation();
  const { status, source, error } = useMarketStore();
  const accountError = usePaperTradingStore(state => state.error);
  return <div role="status" className="px-3 py-2 text-[11px] text-zinc-400">
    <span className="text-amber-400 mr-2">DEMO</span>
    {source && <span>{source.name} · {source.environment} · {source.quote} · </span>}
    <span className={status === 'live' ? 'text-emerald-400' : 'text-amber-400'}>{t('trade.market.' + status)}</span>
    {(error || accountError) && <p className="mt-1 break-all text-amber-400">{error || accountError}</p>}
  </div>;
};

export const DemoAccountStart = () => {
  const { t } = useTranslation();
  const { source } = useMarketStore();
  const { loaded, error, busy, createAccount } = usePaperTradingStore();
  return <div className="m-3 rounded-xl bg-zinc-900 p-4 text-sm space-y-3">
    <p>{t('trade.market.accountInfo')}</p>
    {!loaded ? <p>{t('trade.market.accountLoading')}</p> :
      error === 'authentication_required' ? <p>{t('trade.market.accountRequired')}</p> :
      source && <button disabled={busy} onClick={() => void createAccount()}
        className="bg-white text-black rounded-lg px-4 py-2 disabled:opacity-40">
        {t('trade.market.create')} · {source.initialBalance} {source.quote}
      </button>}
  </div>;
};

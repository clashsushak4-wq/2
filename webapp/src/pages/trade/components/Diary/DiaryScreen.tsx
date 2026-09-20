import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useBackButton } from '../../../../hooks';
import { useTranslation } from '../../../../i18n';
import { apiClient } from '../../../../api/client';
import { usePaperTradingStore } from '../Crypto/store/usePaperTradingStore';
import type { TradingSnapshot } from '../Crypto/store/usePaperTradingStore';
import type { MarketSource } from '../Crypto/data/marketData';
import { MarketStatus, DemoAccountStart } from '../Crypto/layout/MarketStatus';

const LEGACY_KEY = 'crypto_terminal_demo_v1';
function exportLegacy() {
  const data = localStorage.getItem(LEGACY_KEY);
  if (!data) return;
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'legacy-demo-account.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const DiaryScreen = ({ onClose }: { onClose: () => void }) => {
  useBackButton(onClose);
  const { t } = useTranslation();
  const current = usePaperTradingStore();
  const [sources, setSources] = useState<MarketSource[]>([]);
  const [selected, setSelected] = useState('');
  const [archive, setArchive] = useState<TradingSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [run, setRun] = useState('');
  const [legacy] = useState(() => { try { return Boolean(localStorage.getItem(LEGACY_KEY)); } catch { return false; } });
  useEffect(() => {
    let active = true;
    apiClient.get('/trade/accounts').then(response => {
      if (active) setSources(response.data.map((row: { source: MarketSource }) => row.source));
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [current.source?.key]);
  useEffect(() => {
    setArchive(null); setError(false);
    if (!selected) return;
    const controller = new AbortController();
    apiClient.get('/trade/account', { params: { source: selected }, signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setArchive(response.data.state); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [selected]);
  const account = selected ? archive : current.exists ? current : null;
  const state = run ? account?.archives?.find(item => item.id === run) ?? account : account;
  return <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black text-zinc-100">
    <div className="flex items-center gap-3 p-4">
      <button onClick={onClose} aria-label={t('trade.close')}><ArrowLeft size={20} /></button>
      <h1 className="font-bold">{t('trade.diary')}</h1>
    </div>
    <MarketStatus />
    <div className="flex-1 overflow-y-auto px-3 pb-6">
      <select value={selected} onChange={e => { setSelected(e.target.value); setRun(''); }} aria-label={t('trade.market.archived')}
        className="mb-3 w-full rounded-lg bg-zinc-900 p-3 text-sm">
        <option value="">{t('trade.market.currentAccount')}</option>
        {sources.filter(source => source.key !== current.source?.key).map(source =>
          <option key={source.key} value={source.key}>{source.name} · {source.environment} · #{source.id}</option>)}
      </select>
      {Boolean(account?.archives?.length) && <select value={run} onChange={e => setRun(e.target.value)}
        className="mb-3 w-full rounded-lg bg-zinc-900 p-3 text-sm" aria-label={t('trade.market.archived')}>
        <option value="">{t('trade.market.currentAccount')}</option>
        {account?.archives?.map((item, index) => <option value={item.id} key={item.id}>
          {t('trade.market.archived')} #{index + 1}
        </option>)}
      </select>}
      {error && <p className="p-3 text-amber-400 text-xs">{t('trade.market.requestFailed')}</p>}
      {selected && <p className="py-2 text-xs text-amber-400">{t('trade.market.pausedAccount')}</p>}
      {!state && !selected && <DemoAccountStart />}
      {state && <>
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          {[[t('trade.equity'), state.account.equity], [t('trade.totalPnl'), state.realizedPnl],
            [t('trade.paidFees'), state.paidFees], [t('trade.market.funding'), state.fundingPaid]].map(([label, value]) =>
            <div key={label} className="rounded-lg bg-zinc-900 p-3"><p className="text-zinc-500">{label}</p>
              <p className="mt-1 font-mono">{Number(value).toFixed(2)} {state.source?.quote}</p></div>)}
        </div>
        <h2 className="my-3 text-sm font-semibold">{t('trade.trades')} · {state.fills.length}</h2>
        {[...state.fills].reverse().map(fill => <div key={fill.id} className="border-b border-zinc-900 py-2 text-xs">
          <div className="flex justify-between"><b>{fill.symbol}</b><span>{new Date(fill.createdAt).toLocaleString()}</span></div>
          <p className="mt-1 font-mono">{fill.direction} · {fill.quantity} @ {fill.price}</p>
          <p className="text-zinc-500">{t('trade.paidFees')}: {fill.fee}</p>
        </div>)}
        <h2 className="my-3 text-sm font-semibold">{t('trade.history')}</h2>
        {[...state.ledger].reverse().map(entry => <div key={entry.id} className="border-b border-zinc-900 py-2 text-xs">
          <div className="flex justify-between"><span>{entry.symbol} · {entry.type}</span>
            <span className={entry.amount >= 0 ? 'text-bitget-green' : 'text-bitget-red'}>{entry.amount.toFixed(4)}</span></div>
          <p className="text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</p>
        </div>)}
      </>}
      {legacy && <div className="mt-4 rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
        <p>{t('trade.market.legacyInfo')}</p>
        <button onClick={exportLegacy} className="mt-3 text-cyan-400">{t('trade.market.legacyExport')}</button>
      </div>}
    </div>
  </div>;
};

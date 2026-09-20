import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useBackButton } from '../../../../hooks';
import { useTranslation } from '../../../../i18n';
import { useAppStore } from '../../../../store';
import { useMarketStore } from '../Crypto/store/useMarketStore';
import { useCryptoStore } from '../Crypto/store/useCryptoStore';
import { MarketStatus } from '../Crypto/layout/MarketStatus';
import { formatInstrumentPrice, formatSignedPercent, formatVolume } from '../Crypto/data/marketData';

export const ScreenerScreen = ({ onClose }: { onClose: () => void }) => {
  useBackButton(onClose);
  const { t } = useTranslation();
  const instruments = useMarketStore(state => state.instruments);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'volume' | 'gainers' | 'losers'>('volume');
  const rows = useMemo(() => Object.values(instruments).filter(item =>
    item.symbol.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'volume'
      ? (b.turnover24h ?? -Infinity) - (a.turnover24h ?? -Infinity)
      : sort === 'gainers' ? (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity)
      : (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity)), [instruments, query, sort]);
  return <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black text-zinc-100">
    <div className="flex items-center gap-3 p-4"><button onClick={onClose} aria-label={t('trade.close')}><ArrowLeft size={20} /></button>
      <h1 className="font-bold">{t('trade.screener')}</h1></div>
    <MarketStatus />
    <div className="flex gap-2 px-3 pb-3">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('trade.searchPair')}
        className="min-w-0 flex-1 rounded-lg bg-zinc-900 p-2 text-sm" />
      <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="rounded-lg bg-zinc-900 p-2 text-xs">
        <option value="volume">{t('trade.turnover24h')}</option>
        <option value="gainers">{t('trade.priceChange')} ↑</option>
        <option value="losers">{t('trade.priceChange')} ↓</option>
      </select>
    </div>
    <div className="flex-1 overflow-y-auto px-3">
      {rows.map(item => <button key={item.symbol} disabled={item.price === null}
        className="flex w-full items-center justify-between border-b border-zinc-900 py-3 text-left disabled:opacity-40"
        onClick={() => { useCryptoStore.getState().setSelectedSymbol(item.symbol); useAppStore.getState().setActiveMarket('crypto'); }}>
        <span className="text-sm">{item.symbol}<span className="block text-xs text-zinc-500">{formatVolume(item.turnover24h)} {item.quoteAsset}</span></span>
        <span className="text-right text-sm">{formatInstrumentPrice(item)}
          <span className={'block text-xs ' + ((item.changePercent ?? 0) >= 0 ? 'text-bitget-green' : 'text-bitget-red')}>
            {formatSignedPercent(item.changePercent)}</span></span>
      </button>)}
      {!rows.length && <p className="p-8 text-center text-zinc-500">{t('trade.nothingFound')}</p>}
    </div>
  </div>;
};

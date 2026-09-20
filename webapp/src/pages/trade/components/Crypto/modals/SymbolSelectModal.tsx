import { useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { formatInstrumentPrice, formatSignedPercent, formatVolume } from '../data/marketData';
import { useCryptoStore } from '../store/useCryptoStore';
import { useMarketStore } from '../store/useMarketStore';

export const SymbolSelectModal = () => {
  const { t } = useTranslation();
  const isOpen = useCryptoStore(state => state.isSymbolSelectOpen);
  const selected = useCryptoStore(state => state.selectedSymbol);
  const favorites = useCryptoStore(state => state.favoriteSymbols);
  const instruments = useMarketStore(state => state.instruments);
  const { setSelectedSymbol, toggleFavoriteSymbol, setSymbolSelectOpen } = useCryptoStore.getState();
  const [filter, setFilter] = useState<'all' | 'favorites' | 'new'>('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'symbol' | 'volume' | 'change'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'symbol' | 'volume' | 'change') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'symbol' ? 'asc' : 'desc');
    }
  };

  useBackButton(isOpen ? () => setSymbolSelectOpen(false) : null);
  const rows = useMemo(() => {
    const direction = sortOrder === 'asc' ? 1 : -1;
    return Object.values(instruments)
      .filter(item => (filter !== 'favorites' || favorites.includes(item.symbol))
        && (filter !== 'new' || item.isNew) && item.symbol.toLowerCase().includes(search.trim().toLowerCase()))
      .sort((a, b) => sortField === 'symbol' ? direction * a.symbol.localeCompare(b.symbol)
        : sortField === 'volume' ? direction * ((a.turnover24h ?? -Infinity) - (b.turnover24h ?? -Infinity))
        : direction * ((a.changePercent ?? -Infinity) - (b.changePercent ?? -Infinity)));
  }, [instruments, favorites, search, filter, sortField, sortOrder]);

  return <BottomSheet isOpen={isOpen} onClose={() => setSymbolSelectOpen(false)} fullHeight noPadding>
    <div className="flex h-full flex-col text-zinc-100">
      <div className="m-3 flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2">
        <Search size={18} className="text-zinc-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('trade.searchPair')}
          className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="flex gap-4 px-4 pb-3 text-sm">
        {(['all', 'favorites', 'new'] as const).map(value => <button key={value}
          onClick={() => setFilter(value)} className={filter === value ? 'text-white' : 'text-zinc-500'}>
          {t('trade.' + value)}
        </button>)}
      </div>
      <div className="flex justify-between border-y border-zinc-800 p-3 text-xs text-zinc-500">
        <button onClick={() => handleSort('symbol')} className="flex items-center gap-1">
          {t('trade.name')} {sortField === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('volume')} className="flex items-center gap-1">
          {t('trade.turnover24h')} {sortField === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSort('change')} className="flex items-center gap-1">
          {t('trade.priceChange')} {sortField === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rows.map(item => <div key={item.symbol} className={'flex items-center px-4 ' + (item.symbol === selected ? 'bg-zinc-900' : '')}>
          <button disabled={item.price === null} onClick={() => { haptic.medium(); setSelectedSymbol(item.symbol); }}
            className="flex flex-1 items-center justify-between py-3 pr-3 text-left disabled:opacity-40">
            <span><b className="text-sm">{item.symbol}</b>
              <span className="block text-[11px] text-zinc-500">{formatVolume(item.turnover24h)} {item.quoteAsset}</span></span>
            <span className="text-right text-sm">{formatInstrumentPrice(item)}
              <span className={'block text-xs ' + ((item.changePercent ?? 0) >= 0 ? 'text-bitget-green' : 'text-bitget-red')}>
                {formatSignedPercent(item.changePercent)}</span></span>
          </button>
          <button onClick={() => { haptic.light(); toggleFavoriteSymbol(item.symbol); }}
            aria-label={t(favorites.includes(item.symbol) ? 'trade.removeFavorite' : 'trade.addFavorite')}>
            <Star size={18} className={favorites.includes(item.symbol) ? 'fill-amber-500 text-amber-500' : 'text-zinc-600'} />
          </button>
        </div>)}
        {!rows.length && <p className="p-8 text-center text-sm text-zinc-500">{t('trade.nothingFound')}</p>}
      </div>
    </div>
  </BottomSheet>;
};

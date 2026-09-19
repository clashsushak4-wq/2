import { useState, useMemo } from 'react';
import { Search, Star } from 'lucide-react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { formatInstrumentPrice, formatSignedPercent } from '../data/mockInstruments.ts';
import { useCryptoStore } from '../store/useCryptoStore';
import { useMarketStore } from '../store/useMarketStore';

export const SymbolSelectModal = () => {
  const isOpen = useCryptoStore(state => state.isSymbolSelectOpen);
  const onClose = () => useCryptoStore.getState().setSymbolSelectOpen(false);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const favoriteSymbols = useCryptoStore(state => state.favoriteSymbols);
  const instruments = useCryptoStore(state => state.instruments);
  const setSelectedSymbol = useCryptoStore(state => state.setSelectedSymbol);
  const toggleFavoriteSymbol = useCryptoStore(state => state.toggleFavoriteSymbol);
  const tickers = useMarketStore(state => state.tickers);
  const { t } = useTranslation();

  useBackButton(isOpen ? onClose : null);

  const [mainTab, setMainTab] = useState<'fav' | 'futures'>('futures');
  const [subTab, setSubTab] = useState<'all' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return Object.values(instruments).filter((instrument) => {
      const matchesMainTab = mainTab === 'fav' ? favoriteSymbols.includes(instrument.symbol) : true;
      const matchesSubTab = mainTab !== 'futures' || subTab === 'all' || instrument.isNew;
      const matchesSearch = !normalizedQuery
        || instrument.symbol.toLowerCase().includes(normalizedQuery)
        || instrument.baseAsset.toLowerCase().includes(normalizedQuery);
      return matchesMainTab && matchesSubTab && matchesSearch;
    });
  }, [favoriteSymbols, mainTab, searchQuery, subTab, instruments]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} fullHeight noPadding>
      <div className="flex flex-col h-full text-zinc-100">
        
        {/* Hidden anchor to prevent auto-focus on input */}
        <button type="button" className="sr-only">Focus anchor</button>
        
        {/* Search */}
        <div className="px-4 mb-4 mt-2">
          <div className="flex items-center bg-[#1C1C1E] rounded-xl px-3 py-2.5">
            <Search size={18} className="text-zinc-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder={t('trade.searchPair')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[15px] text-zinc-100 w-full placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-6 px-4 mb-4">
          <button 
            type="button"
            className={`relative pb-2 transition-colors ${mainTab === 'fav' ? 'text-white' : 'text-zinc-500'}`}
            onClick={() => { haptic.light(); setMainTab('fav'); }}
          >
            <span className="text-[16px] font-medium tracking-wide">{t('trade.favorites')}</span>
            {mainTab === 'fav' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-white rounded-full" />}
          </button>
          <button 
            type="button"
            className={`relative pb-2 transition-colors ${mainTab === 'futures' ? 'text-white' : 'text-zinc-500'}`}
            onClick={() => { haptic.light(); setMainTab('futures'); }}
          >
            <span className="text-[16px] font-medium tracking-wide">{t('trade.futures')}</span>
            {mainTab === 'futures' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-white rounded-full" />}
          </button>
        </div>

        {/* Sub Tabs */}
        {mainTab === 'futures' && (
          <div className="flex items-center gap-6 px-4 mb-3">
            <button 
              type="button"
              className={`text-[13px] font-bold pb-1 transition-colors border-b-[2px] ${subTab === 'all' ? 'text-white border-white' : 'text-zinc-500 border-transparent'}`}
              onClick={() => { haptic.light(); setSubTab('all'); }}
            >
              {t('trade.all')}
            </button>
            <button 
              type="button"
              className={`text-[13px] font-bold pb-1 transition-colors border-b-[2px] ${subTab === 'new' ? 'text-white border-white' : 'text-zinc-500 border-transparent'}`}
              onClick={() => { haptic.light(); setSubTab('new'); }}
            >
              {t('trade.new')}
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-zinc-800/50 mb-1" />

        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-zinc-500 mb-1">
          <div className="flex items-center gap-1">
            <span>{t('trade.name')} ⇕</span>
            <span className="text-zinc-700">/</span>
            <span>{t('trade.volume')} ⇕</span>
          </div>
          <div className="flex items-center gap-1 pr-9">
            <span>{t('trade.price')} ⇕</span>
            <span className="text-zinc-700">/</span>
            <span>{t('trade.priceChange')} ⇕</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredAssets.map((asset) => {
            const isFavorite = favoriteSymbols.includes(asset.symbol);
            const isSelected = selectedSymbol === asset.symbol;
            
            // Get live ticker data or fallback to mock asset
            const ticker = tickers[asset.symbol];
            const livePrice = ticker ? ticker.price : asset.price;
            const liveChange = ticker ? ticker.change24h : asset.changePercent;
            const liveVolume = ticker ? ticker.volume24h : 0;
            
            const changeColor = liveChange >= 0 ? 'text-bitget-green' : 'text-bitget-red';

            return (
            <div key={asset.symbol} className={`flex items-center px-4 transition-colors ${isSelected ? 'bg-zinc-900/60' : 'active:bg-zinc-900/50'}`}>
              <button
                type="button"
                aria-pressed={isSelected}
                className="flex flex-1 items-center justify-between py-2.5 pr-3 text-left cursor-pointer"
                onClick={() => { haptic.light(); setSelectedSymbol(asset.symbol); }}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[16px] font-bold text-white tracking-wide">{asset.symbol}</span>
                    <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-[1.5px] rounded tracking-wide leading-none">
                      {t('trade.perpetual')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-500">
                      {liveVolume > 0 ? `${(liveVolume / 1000000).toFixed(2)}M` : asset.turnover24h}
                    </span>
                    {asset.tagKey && <span className="text-[10px] text-cyan-600 font-medium tracking-tight">{t(asset.tagKey)}</span>}
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[16px] font-bold text-white tracking-wide">
                    {/* Format based on price size */}
                    {livePrice >= 100 ? livePrice.toFixed(2) : livePrice >= 1 ? livePrice.toFixed(4) : livePrice.toFixed(5)}
                  </span>
                  <span className={`text-[12px] font-medium mt-0.5 ${changeColor}`}>
                    {liveChange > 0 ? '+' : ''}{liveChange.toFixed(2)}%
                  </span>
                </div>
              </button>

              <button
                type="button"
                aria-label={t(isFavorite ? 'trade.removeFavorite' : 'trade.addFavorite')}
                aria-pressed={isFavorite}
                className="p-1 shrink-0 -mr-1"
                onClick={() => { haptic.light(); toggleFavoriteSymbol(asset.symbol); }}
              >
                <Star size={18} className={isFavorite ? 'text-amber-500 fill-amber-500' : 'text-zinc-600 fill-zinc-600'} />
              </button>
            </div>
          );
          })}
          {filteredAssets.length === 0 && (
            <div className="text-center text-zinc-500 py-10 text-sm">{t('trade.nothingFound')}</div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

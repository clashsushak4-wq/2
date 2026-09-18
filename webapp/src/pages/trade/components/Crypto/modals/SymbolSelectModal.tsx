import { useState, useMemo } from 'react';
import { Search, Star } from 'lucide-react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useCryptoStore } from '../store/useCryptoStore';

const MOCK_ASSETS = [
  { symbol: 'BTCUSDT', type: 'Бессрочный', turnover: '1.82B', price: '76,776.9', change: '+0.91%', isFav: true },
  { symbol: 'ETHUSDT', type: 'Бессрочный', turnover: '1.63B', price: '2,456.64', change: '+1.67%', isFav: false },
  { symbol: 'ZECUSDT', type: 'Бессрочный', turnover: '467.82M', price: '1,488.14', change: '+9.32%', isFav: true },
  { symbol: 'SOLUSDT', type: 'Бессрочный', turnover: '192M', price: '102.347', change: '+3.52%', isFav: false },
  { symbol: 'XRPUSDT', type: 'Бессрочный', turnover: '146.03M', price: '1.3036', change: '+0.75%', isFav: true },
  { symbol: 'XAUUSDT', type: 'Бессрочный', turnover: '128.51M', price: '4,357.24', change: '+1.37%', isFav: false, tag: 'Металлы TradFi' },
  { symbol: 'HYPEUSDT', type: 'Бессрочный', turnover: '95.94M', price: '86.494', change: '+9.97%', isFav: false },
  { symbol: 'SNDKUSDT', type: 'Бессрочный', turnover: '92.93M', price: '1,611.67', change: '+5.19%', isFav: false, tag: 'TradFi US-Stock' },
  { symbol: 'SOXLUSDT', type: 'Бессрочный', turnover: '82.99M', price: '113.16', change: '+6.51%', isFav: false, tag: 'ETF TradFi' },
  { symbol: 'SPCXUSDT', type: 'Бессрочный', turnover: '77.85M', price: '154.84', change: '+1.63%', isFav: false, tag: 'TradFi US-Stock' },
];

export const SymbolSelectModal = () => {
  const isOpen = useCryptoStore(state => state.isSymbolSelectOpen);
  const onClose = () => useCryptoStore.getState().setSymbolSelectOpen(false);

  useBackButton(isOpen ? onClose : null);

  const [mainTab, setMainTab] = useState<'fav' | 'futures'>('futures');
  const [subTab, setSubTab] = useState<'all' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = useMemo(() => {
    return MOCK_ASSETS.filter(a => {
      const matchesTab = mainTab === 'fav' ? a.isFav : true;
      const matchesSearch = a.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [mainTab, searchQuery]);

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
              placeholder="Поиск"
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
            <span className="text-[16px] font-medium tracking-wide">Избранные</span>
            {mainTab === 'fav' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-white rounded-full" />}
          </button>
          <button 
            type="button"
            className={`relative pb-2 transition-colors ${mainTab === 'futures' ? 'text-white' : 'text-zinc-500'}`}
            onClick={() => { haptic.light(); setMainTab('futures'); }}
          >
            <span className="text-[16px] font-medium tracking-wide">Фьючерсы</span>
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
              Все
            </button>
            <button 
              type="button"
              className={`text-[13px] font-bold pb-1 transition-colors border-b-[2px] ${subTab === 'new' ? 'text-white border-white' : 'text-zinc-500 border-transparent'}`}
              onClick={() => { haptic.light(); setSubTab('new'); }}
            >
              Новое
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-zinc-800/50 mb-1" />

        {/* Table Header */}
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-zinc-500 mb-1">
          <div className="flex items-center gap-1">
            <span>Название ⇕</span>
            <span className="text-zinc-700">/</span>
            <span>Оборот ⇕</span>
          </div>
          <div className="flex items-center gap-1 pr-9">
            <span>Цена ⇕</span>
            <span className="text-zinc-700">/</span>
            <span>Изменение% ⇕</span>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredAssets.map((asset, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 cursor-pointer active:bg-zinc-900/50 transition-colors" onClick={() => { haptic.light(); onClose(); }}>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[16px] font-bold text-white tracking-wide">{asset.symbol}</span>
                  <span className="text-[9px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-[1.5px] rounded tracking-wide leading-none">
                    {asset.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-500">{asset.turnover}</span>
                  {asset.tag && <span className="text-[10px] text-cyan-600 font-medium tracking-tight">{asset.tag}</span>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[16px] font-bold text-white tracking-wide">{asset.price}</span>
                  <span className={`text-[12px] font-medium mt-0.5 ${asset.change.startsWith('+') ? 'text-bitget-green' : 'text-bitget-red'}`}>
                    {asset.change}
                  </span>
                </div>
                <button type="button" className="p-1 shrink-0 -mr-1" onClick={(e) => { e.stopPropagation(); haptic.light(); }}>
                  <Star size={18} className={asset.isFav ? 'text-amber-500 fill-amber-500' : 'text-zinc-600 fill-zinc-600'} />
                </button>
              </div>

            </div>
          ))}
          {filteredAssets.length === 0 && (
            <div className="text-center text-zinc-500 py-10 text-sm">Ничего не найдено</div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

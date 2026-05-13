import { useState, useMemo } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { Search, X, Star, ArrowUpDown } from 'lucide-react';
import { useBackButton } from '../../../../../../hooks';
import { useTranslation } from '../../../../../../i18n';
import { haptic } from '../../../../../../utils';
import type { FilterTab, TradePair } from '../../types';
import { MOCK_PAIRS, parseVolume } from '../../data/mockPairs';

const FILTER_TABS: { key: FilterTab; i18nKey: string }[] = [
  { key: 'all', i18nKey: 'trade.all' },
  { key: 'new', i18nKey: 'trade.new' },
  { key: 'favorites', i18nKey: 'trade.favorites' },
];

interface SymbolPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pair: TradePair) => void;
}

export const SymbolPicker = ({ open, onClose, onSelect }: SymbolPickerProps) => {
  const { t } = useTranslation();
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['BTCUSDT', 'ETHUSDT']));
  const [sortByVolume, setSortByVolume] = useState(true);

  const filtered = useMemo(() => {
    const q = query.toUpperCase();
    let list = MOCK_PAIRS.filter(
      (p) => q === '' || p.symbol.includes(q) || p.base.includes(q),
    );
    if (filterTab === 'favorites') list = list.filter((p) => favorites.has(p.symbol));
    if (filterTab === 'new') list = list.filter((p) => p.isNew);
    if (sortByVolume) list = [...list].sort((a, b) => parseVolume(b.volume) - parseVolume(a.volume));
    return list;
  }, [filterTab, query, favorites, sortByVolume]);

  const handleSelect = (pair: TradePair) => {
    haptic.medium();
    onSelect(pair);
    onClose();
  };

  const toggleFavorite = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    haptic.light();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 80 || info.offset.y > 100) onClose();
  };

  useBackButton(open ? onClose : null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/60"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={{ top: 0, left: 0, right: 0.5, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-[61] bg-zinc-950 rounded-t-2xl flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            {/* Search */}
            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                <Search size={14} className="text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('trade.search')}
                  className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-zinc-600"
                />
                {query && (
                  <button onClick={() => setQuery('')}>
                    <X size={14} className="text-zinc-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto no-scrollbar">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { if (tab.key !== filterTab) { haptic.light(); setFilterTab(tab.key); } }}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                    filterTab === tab.key ? 'bg-violet-500/20 text-violet-400' : 'text-zinc-500'
                  }`}
                >
                  {t(tab.i18nKey)}
                </button>
              ))}
            </div>

            {/* Column headers */}
            <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800/60">
              <button
                onClick={() => { haptic.light(); setSortByVolume((p) => !p); }}
                className="flex items-center gap-1"
              >
                <span className="text-zinc-600 text-[10px]">{t('trade.name')}</span>
                <ArrowUpDown size={8} className="text-zinc-600" />
                <span className="text-zinc-700 text-[10px]">/ {t('trade.volume')}</span>
              </button>
              <div className="flex items-center gap-4">
                <span className="text-zinc-600 text-[10px]">{t('trade.priceChange')}</span>
                <span className="text-zinc-700 text-[10px] w-4" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto" onPointerDownCapture={(e) => e.stopPropagation()}>
              {filtered.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <span className="text-zinc-600 text-sm">{t('trade.nothingFound')}</span>
                </div>
              )}
              {filtered.map((pair, i) => {
                const isPositive = pair.change >= 0;
                const isFav = favorites.has(pair.symbol);
                return (
                  <button
                    key={`${pair.type}-${pair.symbol}-${i}`}
                    onClick={() => handleSelect(pair)}
                    className="w-full flex items-center px-4 py-3 active:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-bold">{pair.symbol}</span>
                          <span className="text-zinc-600 text-[9px] bg-zinc-800/80 px-1.5 py-0.5 rounded">
                            {t('trade.perpetual')}
                          </span>
                        </div>
                        <span className="text-zinc-600 text-[11px]">{pair.volume}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-mono tabular-nums">
                          {pair.price.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                        </p>
                        <p className={`text-[11px] font-bold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-violet-400'}`}>
                          {isPositive ? '+' : ''}{pair.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div onClick={(e) => toggleFavorite(e, pair.symbol)} className="ml-3 shrink-0 p-1">
                      <Star size={16} className={isFav ? 'text-violet-400 fill-violet-400' : 'text-zinc-700'} />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

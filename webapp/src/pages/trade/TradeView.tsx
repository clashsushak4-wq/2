import { Bitcoin, ScanSearch, Book } from 'lucide-react';
import { PageWrapper } from '../../shared/ui';
import { haptic } from '../../utils';
import { useAppStore } from '../../store';
import { MarketTile } from './components';
import type { MarketType } from '../../store/useAppStore';

const TILES: { market: MarketType; icon: typeof Bitcoin; title: string; subtitleKey: string }[] = [
  { market: 'crypto', icon: Bitcoin, title: 'Crypto', subtitleKey: 'trade.crypto' },
  { market: 'screener', icon: ScanSearch, title: 'Screener', subtitleKey: 'trade.screener' },
  { market: 'diary', icon: Book, title: 'Дневник трейдера', subtitleKey: 'trade.diary' },
];

export const TradeView = () => {
  const { setActiveMarket } = useAppStore();

  const handleTradeSelect = (market: MarketType) => {
    haptic.light();
    setActiveMarket(market);
  };

  return (
    <PageWrapper className="-mx-4 md:mx-0 -mt-2 md:mt-0 flex justify-center">
      <div className="flex flex-col gap-3 px-1 pt-0 w-full max-w-3xl">
        {TILES.map((tile) => (
          <MarketTile
            key={tile.market}
            icon={tile.icon}
            title={tile.title}
            subtitleKey={tile.subtitleKey}
            onClick={() => handleTradeSelect(tile.market)}
          />
        ))}
      </div>
    </PageWrapper>
  );
};

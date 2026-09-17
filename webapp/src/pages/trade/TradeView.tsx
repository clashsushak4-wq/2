import { Bitcoin, ScanSearch, Book } from 'lucide-react';
import { PageWrapper } from '../../shared/ui';
import { haptic } from '../../utils';
import { useAppStore } from '../../store';
import { useTranslation } from '../../i18n';
import { MarketTile } from './components';
import type { MarketType } from '../../store/useAppStore';

const TILES: { market: MarketType; icon: typeof Bitcoin; titleKey: string }[] = [
  { market: 'crypto', icon: Bitcoin, titleKey: 'trade.crypto' },
  { market: 'screener', icon: ScanSearch, titleKey: 'trade.screener' },
  { market: 'diary', icon: Book, titleKey: 'trade.diary' },
];

export const TradeView = () => {
  const { setActiveMarket } = useAppStore();
  const { t } = useTranslation();

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
            title={t(tile.titleKey)}
            onClick={() => handleTradeSelect(tile.market)}
          />
        ))}
      </div>
    </PageWrapper>
  );
};

import { useState } from 'react';
import { useTranslation } from '../../../../../i18n';
import { PositionTPSLModal } from '../modals/PositionTPSLModal';
import { useCryptoStore } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';
import { PositionCard } from './PositionCard';

export const PositionsTab = () => {
  const { t } = useTranslation();
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const instruments = useCryptoStore(state => state.instruments);
  const positions = usePaperTradingStore(state => state.positions);

  if (positions.length === 0) {
    return (
      <div className="px-2 py-8 flex flex-col items-center justify-center text-zinc-500">
        <span className="text-sm">{t('trade.noOpenPositions')}</span>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-2 px-2 pb-5 pt-2">
      {positions.map((position) => {
        const instrument = instruments[position.symbol];
        if (!instrument) return null;
        return (
          <PositionCard
            key={position.id}
            position={position}
            instrument={instrument}
            onEditTPSL={() => setEditingSymbol(position.symbol)}
          />
        );
      })}
    </div>
    <PositionTPSLModal symbol={editingSymbol} onClose={() => setEditingSymbol(null)} />
    </>
  );
};

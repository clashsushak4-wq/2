import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore, UnitType } from '../store/useCryptoStore';

const getUnitLabel = (unit: UnitType, t: (key: string) => string) => {
  if (unit === 'qty_btc') return { left: t('trade.amount'), right: 'BTC' };
  if (unit === 'cost_usdt') return { left: t('trade.cost'), right: 'USDT' };
  return { left: t('trade.value'), right: 'USDT' };
};

export const AmountSlider = () => {
  const amountPercent = useCryptoStore(state => state.amountPercent);
  const setAmountPercent = useCryptoStore.getState().setAmountPercent;
  const unit = useCryptoStore(state => state.unit);
  const setUnitOpen = useCryptoStore.getState().setUnitOpen;
  const { t } = useTranslation();
  
  const unitInfo = getUnitLabel(unit, t);

  return (
    <>
      {/* Amount Input */}
      <div className={`bg-zinc-900 rounded px-2 py-2.5 flex items-center justify-between ${amountPercent > 0 ? 'mb-1' : 'mb-2'}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 font-medium">{unitInfo.left}</span>
          {amountPercent > 0 && <span className="text-sm text-zinc-100 font-bold ml-1">{amountPercent}%</span>}
        </div>
        
        <button
          type="button"
          aria-haspopup="dialog"
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => { haptic.light(); setUnitOpen(true); }}
        >
          <span className="text-sm text-zinc-300 font-bold">{unitInfo.right}</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </button>
      </div>

      {amountPercent > 0 && (
        <div className="text-[10px] text-zinc-500 mb-2 h-[26px] flex items-center font-mono">
          ≈ <span className="text-zinc-300 ml-1">{(amountPercent * 0.005).toFixed(4)}</span> <span className="text-zinc-600 mx-1">/</span> <span className="text-zinc-300">{(amountPercent * 0.005).toFixed(4)}</span> BTC
        </div>
      )}

      {/* Slider */}
      <div className="px-1 mb-2 relative flex items-center h-4 group">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={amountPercent}
          onChange={(e) => {
            setAmountPercent(Number(e.target.value));
          }}
          onPointerUp={() => haptic.light()}
          onKeyUp={(event) => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) haptic.light();
          }}
          aria-label={t('trade.amount')}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />
        <div className="h-0.5 w-full bg-zinc-800 relative z-10 pointer-events-none">
          <div className="absolute left-0 top-0 bottom-0 bg-white" style={{ width: `${amountPercent}%` }} />

          {[0, 25, 50, 75, 100].map(mark => {
            const isZero = mark === 0;
            return (
              <div
                key={mark}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full -translate-x-1/2 transition-colors ${amountPercent >= mark ? (isZero ? 'bg-zinc-100' : 'bg-white') : 'bg-zinc-700'}`}
                style={{
                  left: `${mark}%`,
                  width: isZero ? '10px' : '6px',
                  height: isZero ? '10px' : '6px'
                }}
              />
            )
          })}

          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)] -translate-x-1/2"
            style={{ left: `${amountPercent}%` }}
          />
        </div>
      </div>
    </>
  );
};

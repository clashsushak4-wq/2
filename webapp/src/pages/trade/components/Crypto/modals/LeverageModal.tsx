import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { BottomSheet } from '../../../../../shared/ui';
import { haptic } from '../../../../../utils';
import { useBackButton } from '../../../../../hooks';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore, useInstrument } from '../store/useCryptoStore';

export const LeverageModal = () => {
  const isOpen = useCryptoStore(state => state.isLeverageOpen);
  const onClose = () => useCryptoStore.getState().setLeverageOpen(false);
  const currentLeverage = useCryptoStore(state => state.leverage);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const onChange = useCryptoStore.getState().setLeverage;
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);
  const maxLeverage = instrument.maxLeverage;
  const marks = Array.from(new Set([
    1,
    Math.max(2, Math.round(maxLeverage * 0.2)),
    Math.max(2, Math.round(maxLeverage * 0.4)),
    Math.max(2, Math.round(maxLeverage * 0.6)),
    Math.max(2, Math.round(maxLeverage * 0.8)),
    maxLeverage,
  ])).sort((a, b) => a - b);

  useBackButton(isOpen ? onClose : null);
  const [leverage, setLeverage] = useState(currentLeverage);

  // Sync when opened
  useEffect(() => {
    if (isOpen) {
      setLeverage(currentLeverage);
    }
  }, [isOpen, currentLeverage]);

  const handleConfirm = () => {
    haptic.medium();
    onChange(leverage);
    onClose();
  };

  const updateLeverage = (val: number, withHaptic = true) => {
    const newVal = Math.min(maxLeverage, Math.max(1, val));
    if (newVal !== leverage) {
      if (withHaptic) haptic.light();
      setLeverage(newVal);
    }
  };

  const getPercent = (val: number) => ((val - 1) / Math.max(1, maxLeverage - 1)) * 100;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t('trade.adjustLeverage')}>
      <div className="flex flex-col text-zinc-100">
        
        {/* Controls */}
        <div className="flex items-center justify-between bg-black rounded-xl p-1 mb-3 mt-0 border border-zinc-700">
          <button 
            type="button"
            onClick={() => updateLeverage(leverage - 1)}
            className="p-2 text-zinc-300 active:text-white"
          >
            <Minus size={20} />
          </button>
          <span className="text-xl font-bold">{leverage}x</span>
          <button 
            type="button"
            onClick={() => updateLeverage(leverage + 1)}
            className="p-2 text-zinc-300 active:text-white"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Custom Slider */}
        <div className="relative mb-6">
          <div className="relative h-6 flex items-center">
            <input 
              type="range"
              min="1"
              max={maxLeverage}
              value={leverage}
              onChange={(e) => updateLeverage(Number(e.target.value), false)}
              onPointerUp={() => haptic.light()}
              onKeyUp={(event) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) haptic.light();
              }}
              aria-label={t('trade.leverage')}
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
            />
            <div className="w-full h-1 bg-zinc-800 rounded-full relative z-10 pointer-events-none">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full"
                style={{ width: `${getPercent(leverage)}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ left: `calc(${getPercent(leverage)}% - 8px)` }}
              />
            </div>
          </div>
          
          {/* Marks */}
          <div className="absolute w-full top-6">
            {marks.map((mark) => (
              <div 
                key={mark} 
                className="absolute flex flex-col items-center -translate-x-1/2 text-[10px] text-zinc-500 font-medium whitespace-nowrap"
                style={{ left: `${getPercent(mark)}%` }}
              >
                <div className={`w-1.5 h-1.5 rounded-full mb-1 absolute -top-4 ${leverage >= mark ? 'bg-white' : 'bg-zinc-700'}`} />
                {mark}x
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-2 bg-white text-black font-bold text-base rounded-xl transition-transform active:scale-95"
        >
          {t('trade.confirm')}
        </button>

      </div>
    </BottomSheet>
  );
};

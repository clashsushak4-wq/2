import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { TPSLModeModal } from './TPSLModeModal';
import type { TPSLMode } from './TPSLModeModal';
import { useOrderCalculations } from '../hooks/useOrderCalculations';
import { calculateProjection } from '../domain/tpslCalculations';
import { formatWithSpaces } from '../data/marketData';

export const TPSLSettings = () => {
  const isTPSL = useCryptoStore(state => state.isTPSL);
  const setIsTPSL = useCryptoStore.getState().setIsTPSL;
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  
  const tpMode = useCryptoStore(state => state.tpMode);
  const slMode = useCryptoStore(state => state.slMode);
  const setTpMode = useCryptoStore.getState().setTpMode;
  const setSlMode = useCryptoStore.getState().setSlMode;
  const tpValue = useCryptoStore(state => state.tpValue);
  const slValue = useCryptoStore(state => state.slValue);
  const setTpValue = useCryptoStore.getState().setTpValue;
  const setSlValue = useCryptoStore.getState().setSlValue;
  
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);

  const [modalType, setModalType] = useState<'tp' | 'sl' | null>(null);


  const getModeLabel = (mode: TPSLMode) => {
    switch (mode) {
      case 'price': return t('trade.tpslPrice');
      case 'roi': return 'ROI (%)';
      case 'change': return t('trade.tpslChange');
      case 'pnl': return 'PnL';
    }
  };

  const getUnitLabel = (mode: TPSLMode) => (
    mode === 'price' || mode === 'pnl' ? instrument.quoteAsset : '%'
  );

  const updateValue = (type: 'tp' | 'sl', value: string) => {
    if (!/^\d*(\.\d*)?$/.test(value)) return;
    if (type === 'tp') setTpValue(value);
    else setSlValue(value);
  };

  const { baseAmount, parsedPrice, leverage } = useOrderCalculations();

  const renderProjection = (kind: 'tp' | 'sl') => {
    const mode = kind === 'tp' ? tpMode : slMode;
    const valueStr = kind === 'tp' ? tpValue : slValue;
    const value = Number(valueStr);
    if (!Number.isFinite(value) || value <= 0 || parsedPrice <= 0) return null;

    // Detect direction based on price if mode is 'price'
    let direction: 'long' | 'short' = 'long';
    if (mode === 'price') {
      if (kind === 'tp') direction = value > parsedPrice ? 'long' : 'short';
      else direction = value < parsedPrice ? 'long' : 'short';
    }

    const proj = calculateProjection(mode, value, parsedPrice, leverage, baseAmount || 1, direction);
    if (!proj) return null;

    return (
      <div className="flex justify-between px-2 text-[10px] text-zinc-500">
        <span>{direction === 'long' ? 'Long' : 'Short'}</span>
        <div className="flex gap-2">
          {mode !== 'price' && <span className="text-zinc-400">{formatWithSpaces(proj.price.toFixed(instrument.priceDecimals))}</span>}
          {mode !== 'roi' && <span className={proj.roi >= 0 ? 'text-bitget-green' : 'text-bitget-red'}>{proj.roi >= 0 ? '+' : ''}{proj.roi.toFixed(2)}%</span>}
          {mode !== 'pnl' && <span className={proj.pnl >= 0 ? 'text-bitget-green' : 'text-bitget-red'}>{proj.pnl >= 0 ? '+' : ''}{proj.pnl.toFixed(2)} {instrument.quoteAsset}</span>}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <button type="button" role="switch" aria-checked={isTPSL} className="flex items-center gap-1.5 cursor-pointer" onClick={() => { haptic.light(); setIsTPSL(!isTPSL); }}>
          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${isTPSL ? 'bg-bitget-green' : 'bg-zinc-800'}`}>
            {isTPSL && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
          </div>
          <span className="text-xs text-zinc-300 font-medium">TP/SL</span>
        </button>
        {isTPSL && <span className="text-[10px] text-zinc-400">{t('trade.advanced')}</span>}
      </div>

      {isTPSL && (
        <div className="mb-1 flex flex-col gap-1">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1 rounded bg-zinc-900 px-2 py-1">
              <label htmlFor="trade-tp-value" className="text-xs text-zinc-400">TP</label>
              <input
                id="trade-tp-value"
                type="text"
                inputMode="decimal"
                value={tpValue}
                placeholder="0"
                onChange={(event) => updateValue('tp', event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-right text-xs text-zinc-100 outline-none"
              />
              <span className="text-[10px] text-zinc-500">{getUnitLabel(tpMode)}</span>
              <button 
                type="button" 
                className="flex items-center gap-1 cursor-pointer active:opacity-70 transition-opacity" 
                onClick={() => { haptic.light(); setModalType('tp'); }}
              >
                <span className="text-xs text-zinc-100">{getModeLabel(tpMode)}</span>
                <ChevronDown size={12} className="text-zinc-500" />
              </button>
            </div>
            {tpValue !== '' && renderProjection('tp')}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-1 rounded bg-zinc-900 px-2 py-1">
              <label htmlFor="trade-sl-value" className="text-xs text-zinc-400">SL</label>
              <input
                id="trade-sl-value"
                type="text"
                inputMode="decimal"
                value={slValue}
                placeholder="0"
                onChange={(event) => updateValue('sl', event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-right text-xs text-zinc-100 outline-none"
              />
              <span className="text-[10px] text-zinc-500">{getUnitLabel(slMode)}</span>
              <button 
                type="button" 
                className="flex items-center gap-1 cursor-pointer active:opacity-70 transition-opacity" 
                onClick={() => { haptic.light(); setModalType('sl'); }}
              >
                <span className="text-xs text-zinc-100">{getModeLabel(slMode)}</span>
                <ChevronDown size={12} className="text-zinc-500" />
              </button>
            </div>
            {slValue !== '' && renderProjection('sl')}
          </div>
        </div>
      )}

      <TPSLModeModal 
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        selectedMode={(modalType === 'tp' ? tpMode : slMode) as TPSLMode}
        onSelectMode={(mode) => modalType === 'tp' ? setTpMode(mode) : setSlMode(mode)}
        type={modalType || 'tp'}
      />
    </>
  );
};

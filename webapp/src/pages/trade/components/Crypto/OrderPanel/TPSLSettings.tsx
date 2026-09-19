import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { TPSLModeModal } from './TPSLModeModal';
import type { TPSLMode } from './TPSLModeModal';

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

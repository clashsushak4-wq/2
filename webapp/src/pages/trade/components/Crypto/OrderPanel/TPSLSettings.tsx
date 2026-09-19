import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';
import { TPSLModeModal, TPSLMode } from './TPSLModeModal';

export const TPSLSettings = () => {
  const isTPSL = useCryptoStore(state => state.isTPSL);
  const setIsTPSL = useCryptoStore.getState().setIsTPSL;
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  
  const tpMode = useCryptoStore(state => state.tpMode);
  const slMode = useCryptoStore(state => state.slMode);
  const setTpMode = useCryptoStore.getState().setTpMode;
  const setSlMode = useCryptoStore.getState().setSlMode;
  
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);

  const [modalType, setModalType] = useState<'tp' | 'sl' | null>(null);


  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'price': return 'Цена';
      case 'roi': return 'ROI (%)';
      case 'change': return 'Изменение (%)';
      case 'pnl': return 'PnL';
      default: return 'Цена';
    }
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
          {/* TP Input */}
          <div className="flex items-center justify-between rounded bg-zinc-900 px-2 py-1">
            <span className="text-xs text-zinc-400">TP ({instrument.quoteAsset})</span>
            <button 
              type="button" 
              className="flex items-center gap-1 cursor-pointer active:opacity-70 transition-opacity" 
              onClick={() => { haptic.light(); setModalType('tp'); }}
            >
              <span className="text-xs text-zinc-100">{getModeLabel(tpMode)}</span>
              <ChevronDown size={12} className="text-zinc-500" />
            </button>
          </div>
          {/* SL Input */}
          <div className="flex items-center justify-between rounded bg-zinc-900 px-2 py-1">
            <span className="text-xs text-zinc-400">SL ({instrument.quoteAsset})</span>
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

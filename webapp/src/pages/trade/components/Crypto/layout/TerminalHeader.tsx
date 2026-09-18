import { ChevronDown, CandlestickChart, MoreHorizontal } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const TerminalHeader = () => {
  const setSymbolSelectOpen = useCryptoStore(state => state.setSymbolSelectOpen);
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-3 pt-2 pb-1.5 shrink-0">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-0.5">
          <button 
            type="button" 
            className="flex items-center gap-1.5 cursor-pointer transition-opacity active:opacity-70"
            onClick={() => { haptic.light(); setSymbolSelectOpen(true); }}
          >
            <h1 className="text-[18px] font-bold text-white tracking-tight leading-none">BTCUSDT</h1>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>
        </div>
        <span className="text-emerald-500 text-[12px] font-medium leading-none tracking-tight">+0.79%</span>
      </div>

      <div className="flex items-center gap-3.5 text-zinc-300">
        <button 
          type="button" 
          aria-label={t('trade.chart')} 
          className="cursor-pointer transition-opacity active:opacity-70 p-0.5" 
          onClick={() => { haptic.light(); useCryptoStore.getState().setChartOpen(true); }}
        >
          <CandlestickChart size={18} />
        </button>
        <button type="button" aria-label={t('trade.more')} className="cursor-pointer transition-opacity active:opacity-70 p-0.5" onClick={() => haptic.light()}>
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  );
};

import { ChevronDown, BarChart2, MoreHorizontal } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const TerminalHeader = () => {
  const setSymbolSelectOpen = useCryptoStore(state => state.setSymbolSelectOpen);
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-2 py-1.5 bg-black">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="flex items-center gap-1 cursor-pointer transition-opacity active:opacity-70"
            onClick={() => { haptic.light(); setSymbolSelectOpen(true); }}
          >
            <h1 className="text-xl font-bold text-white">CP/USDT</h1>
            <ChevronDown size={18} className="text-zinc-400" />
          </button>
        </div>
        <span className="text-zinc-300 text-sm font-medium mt-0.5">-5.21%</span>
      </div>

      <div className="flex items-center gap-4 text-zinc-400">
        <button 
          type="button" 
          aria-label={t('trade.chart')} 
          className="cursor-pointer transition-opacity active:opacity-70" 
          onClick={() => { haptic.light(); useCryptoStore.getState().setChartOpen(true); }}
        >
          <BarChart2 size={20} />
        </button>
        <button type="button" aria-label={t('trade.more')} className="cursor-pointer transition-opacity active:opacity-70" onClick={() => haptic.light()}><MoreHorizontal size={20} /></button>
      </div>
    </div>
  );
};

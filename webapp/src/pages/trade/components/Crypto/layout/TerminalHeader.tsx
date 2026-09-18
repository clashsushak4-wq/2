import { ChevronDown, BarChart2, MoreHorizontal, CircleDollarSign } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';

export const TerminalHeader = () => {
  const leverage = useCryptoStore(state => state.leverage);
  const setSymbolSelectOpen = useCryptoStore(state => state.setSymbolSelectOpen);
  const setLeverageOpen = useCryptoStore(state => state.setLeverageOpen);
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
          <button 
            type="button" 
            aria-label={t('trade.adjustLeverage')} 
            className="flex items-center cursor-pointer transition-opacity active:opacity-70" 
            onClick={() => { haptic.light(); setLeverageOpen(true); }}
          >
            <span className="bg-zinc-800 text-zinc-300 text-[10px] font-medium px-1.5 py-0.5 rounded">{leverage}x</span>
          </button>
        </div>
        <span className="text-zinc-300 text-sm font-medium mt-0.5">-5.21%</span>
      </div>

      <div className="flex items-center gap-4 text-zinc-400">
        <button type="button" aria-label={t('trade.balance')} className="flex items-center gap-1 cursor-pointer" onClick={() => haptic.light()}>
          <CircleDollarSign size={16} className="text-white" />
          <span className="text-sm font-medium text-white">0.00</span>
        </button>
        <button type="button" aria-label={t('trade.chart')} className="cursor-pointer" onClick={() => haptic.light()}><BarChart2 size={20} /></button>
        <button type="button" aria-label={t('trade.more')} className="cursor-pointer" onClick={() => haptic.light()}><MoreHorizontal size={20} /></button>
      </div>
    </div>
  );
};

import { ChevronDown, CandlestickChart } from 'lucide-react';
import { haptic } from '../../../../../utils';
import { useTranslation } from '../../../../../i18n';
import { formatSignedPercent } from '../data/marketData.ts';
import { useInstrument } from '../store/useCryptoStore';
import { useCryptoStore } from '../store/useCryptoStore';

export const TerminalHeader = () => {
  const setSymbolSelectOpen = useCryptoStore(state => state.setSymbolSelectOpen);
  const setChartOpen = useCryptoStore(state => state.setChartOpen);
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const { t } = useTranslation();
  const instrument = useInstrument(selectedSymbol);
  const changeColor = (instrument.changePercent ?? 0) >= 0 ? 'text-bitget-green' : 'text-bitget-red';

  return (
    <div className="flex items-center justify-between px-3 pt-2 pb-1.5 shrink-0">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-0.5">
          <button 
            type="button" 
            aria-label={t('trade.selectSymbol')}
            className="flex items-center gap-1.5 cursor-pointer transition-opacity active:opacity-70"
            onClick={() => { haptic.light(); setSymbolSelectOpen(true); }}
          >
            <h1 className="text-[18px] font-bold text-white tracking-tight leading-none">{instrument.symbol}</h1>
            <ChevronDown size={14} className="text-zinc-500" />
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1 py-0.5 text-[8px] font-bold leading-none text-amber-400">DEMO</span>
          </button>
        </div>
        <span className={`${changeColor} text-[12px] font-medium leading-none tracking-tight`}>
          {formatSignedPercent(instrument.changePercent)}
        </span>
      </div>

      <div className="flex items-center gap-3.5 text-zinc-300">
        <button 
          type="button" 
          aria-label={t('trade.chart')} 
          className="cursor-pointer transition-opacity active:opacity-70 p-0.5" 
          onClick={() => { haptic.light(); setChartOpen(true); }}
        >
          <CandlestickChart size={18} />
        </button>

      </div>
    </div>
  );
};

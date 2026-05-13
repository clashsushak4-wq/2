import { useTranslation } from '../../../../../../i18n';
import { OrderForm } from '../OrderForm';
import { OrderBook } from '../OrderBook';
import { PositionTabs } from '../PositionTabs';
import { MOCK_CURRENT_PRICE, MOCK_FUNDING_RATE, MOCK_FUNDING_COUNTDOWN } from '../../data/mockOrderBook';

interface TerminalProps {
  symbol: string;
  base: string;
  quote: string;
}

export const Terminal = ({ symbol: _symbol, base, quote }: TerminalProps) => {
  const { t } = useTranslation();


  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pb-[var(--safe-bottom,0px)]">
      {/* Leverage + Funding rate bar — full width */}
      <div className="flex items-start justify-between px-4 py-1 shrink-0 gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <button className="text-[11px] text-zinc-200 bg-[#1d1e23] border border-zinc-800 rounded-md px-2.5 py-1 font-semibold leading-none">
            {t('trade.isolated')}
          </button>
          <button className="text-[11px] text-white bg-[#1d1e23] border border-zinc-800 rounded-md px-2 py-1 font-bold flex items-center gap-1 leading-none">
            <span>10x</span>
            <span>10x</span>
          </button>
          <button className="text-[11px] text-zinc-400 bg-[#1d1e23] border border-zinc-800 rounded-md px-2 py-1 font-semibold leading-none">
            S
          </button>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-zinc-500 text-[9px] whitespace-nowrap leading-tight">
            {t('trade.fundingRate')}
          </span>
          <span className="text-[10px] whitespace-nowrap font-mono tabular-nums leading-tight">
            <span className={MOCK_FUNDING_RATE < 0 ? 'text-violet-400' : 'text-white'}>
              {MOCK_FUNDING_RATE > 0 ? '+' : ''}{MOCK_FUNDING_RATE}%
            </span>
            <span className="text-zinc-400"> / {MOCK_FUNDING_COUNTDOWN}(8 {t('trade.hoursShort')})</span>
          </span>
        </div>
      </div>

      {/* Main content: OrderForm + OrderBook side by side, natural height */}
      <div className="grid grid-cols-[minmax(0,56fr)_minmax(0,44fr)] gap-2.5 px-4 pb-2 shrink-0">
        {/* Left column: Order Form */}
        <div className="min-w-0 flex flex-col h-full">
          <OrderForm
            symbol={`${base}${quote}`}
            base={base}
            quote={quote}
            currentPrice={MOCK_CURRENT_PRICE}
          />
        </div>

        {/* Right column: Order Book */}
        <div className="min-w-0 flex flex-col h-full">
          <OrderBook base={base} quote={quote} />
        </div>
      </div>

      {/* Bottom: Position Tabs */}
      <PositionTabs />
    </div>
  );
};

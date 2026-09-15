import { ChevronDown, ListFilter } from 'lucide-react';
import { haptic } from '../../../../utils';

interface OrderBookProps {
  amountPercent: number;
  isTPSL: boolean;
}

export const OrderBook = ({ amountPercent, isTPSL }: OrderBookProps) => {
  const baseAsks = [
    { price: '0.01316', amount: '276.85K' },
    { price: '0.01315', amount: '171.21K' },
    { price: '0.01314', amount: '27.44K' },
    { price: '0.01313', amount: '70.29K' },
    { price: '0.01312', amount: '30.34K' },
  ];

  const asks = [...baseAsks];
  if (amountPercent > 0) {
    asks.unshift({ price: '0.01317', amount: (amountPercent * 1.5).toFixed(2) + 'K' });
  }
  if (isTPSL) {
    asks.unshift({ price: '0.01318', amount: '21.05K' });
    asks.unshift({ price: '0.01319', amount: '8.44K' });
  }

  const baseBids = [
    { price: '0.01311', amount: '11.06K' },
    { price: '0.01310', amount: '41.70K' },
    { price: '0.01309', amount: '69.23K' },
    { price: '0.01308', amount: '65.75K' },
    { price: '0.01307', amount: '63.24K' },
  ];

  const bids = [...baseBids];
  if (amountPercent > 0) {
    bids.push({ price: '0.01306', amount: (amountPercent * 1.2).toFixed(2) + 'K' });
  }
  if (isTPSL) {
    bids.push({ price: '0.01305', amount: '18.30K' });
    bids.push({ price: '0.01304', amount: '45.12K' });
  }

  return (
    <div className="flex flex-col flex-1 pl-1 text-xs font-mono select-none">
      <div className="flex justify-between items-center mb-2">
        <span className="text-zinc-500 font-sans">Цена<br />(USDT)</span>
        <span className="text-zinc-500 text-right font-sans">Количество<br />(CP)</span>
      </div>

      {/* Asks */}
      <div className="flex flex-col gap-1 flex-1 justify-end pb-2">
        {asks.map((ask, i) => (
          <div key={`ask-${i}`} className="flex justify-between items-center relative h-[16px]">
            {/* Volume indicator background */}
            <div
              className="absolute right-0 top-0 bottom-0 bg-zinc-500/40"
              style={{ width: `${Math.max(10, Math.random() * 100)}%` }}
            />
            <span className="text-zinc-400 z-10">{ask.price}</span>
            <span className="text-zinc-300 z-10">{ask.amount}</span>
          </div>
        ))}
      </div>

      {/* Current Price */}
      <div className="flex flex-col py-1 border-y border-zinc-900/50 my-1">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-100">0.01311</span>
          <span className="text-zinc-500 rotate-180">›</span>
        </div>
        <span className="text-zinc-500">≈₽0.58</span>
      </div>

      {/* Bids */}
      <div className="flex flex-col gap-1 flex-1 pt-2">
        {bids.map((bid, i) => (
          <div key={`bid-${i}`} className="flex justify-between items-center relative h-[16px]">
            {/* Volume indicator background */}
            <div
              className="absolute right-0 top-0 bottom-0 bg-white/20"
              style={{ width: `${Math.max(10, Math.random() * 100)}%` }}
            />
            <span className="text-white z-10">{bid.price}</span>
            <span className="text-zinc-300 z-10">{bid.amount}</span>
          </div>
        ))}
      </div>

      {/* Buy/Sell Ratio and Precision */}
      <div className="flex flex-col mt-auto pt-2 gap-2">
        <div className="flex items-center text-[10px] gap-1 h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 bg-white w-[48%]" />
          <div className="absolute right-0 top-0 bottom-0 bg-zinc-500 w-[52%]" />
        </div>
        <div className="flex justify-between text-[10px] text-zinc-500 font-sans">
          <span>B 48%</span>
          <span>52% S</span>
        </div>

        <div className="flex items-center justify-between bg-zinc-900 rounded p-1 mt-1 cursor-pointer" onClick={() => haptic.light()}>
          <ListFilter size={14} className="text-zinc-400" />
          <span className="text-zinc-300">0.00001</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </div>
      </div>
    </div>
  );
};

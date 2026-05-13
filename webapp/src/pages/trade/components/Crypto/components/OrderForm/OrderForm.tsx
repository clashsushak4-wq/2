import { useState } from 'react';
import { ChevronDown, Info, Minus, Plus, PlusCircle } from 'lucide-react';
import { useTranslation } from '../../../../../../i18n';
import { haptic } from '../../../../../../utils';
import type { OrderType } from '../../types';

type FormTab = 'open' | 'close';

interface OrderFormProps {
  symbol: string;
  base: string;
  quote: string;
  currentPrice: number;
}

export const OrderForm = ({ symbol: _symbol, base, quote, currentPrice }: OrderFormProps) => {
  const { t } = useTranslation();
  const [formTab, setFormTab] = useState<FormTab>('open');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price, setPrice] = useState(currentPrice.toString());
  const [quantity, setQuantity] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [tpslEnabled, setTpslEnabled] = useState(false);
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);

  const handleFormTab = (tab: FormTab) => {
    if (tab === formTab) return;
    haptic.light();
    setFormTab(tab);
  };

  const handleOrderType = (type: OrderType) => {
    haptic.light();
    setOrderType(type);
    setShowOrderTypeMenu(false);
  };

  const adjustPrice = (delta: number) => {
    haptic.light();
    const current = parseFloat(price) || 0;
    setPrice((current + delta).toFixed(1));
  };

  const sliderStops = [0, 25, 50, 75, 100];

  return (
    <div className="flex h-full flex-col gap-1 px-0 pt-0 pb-0.5 flex-1 min-h-0">
      {/* Open / Close tabs */}
      <div className="flex bg-[#1b1c20] rounded-lg p-0.5 overflow-hidden">
        <button
          onClick={() => handleFormTab('open')}
          className={`flex-1 h-[25px] rounded-md text-[12px] font-semibold transition-colors ${
            formTab === 'open' ? 'bg-[#35363c] text-white' : 'text-zinc-500'
          }`}
        >
          {t('trade.openTab')}
        </button>
        <button
          onClick={() => handleFormTab('close')}
          className={`flex-1 h-[25px] rounded-md text-[12px] font-semibold transition-colors ${
            formTab === 'close' ? 'bg-[#35363c] text-white' : 'text-zinc-500'
          }`}
        >
          {t('trade.closeTab')}
        </button>
      </div>

      {/* Order type selector — Bitget style with info icon */}
      <div className="relative">
        <button
          onClick={() => { haptic.light(); setShowOrderTypeMenu(!showOrderTypeMenu); }}
          className="flex items-center gap-1.5 w-full bg-[#1d1e23] border border-zinc-800 rounded-md px-2.5 h-[30px]"
        >
          <Info size={11} className="text-zinc-400" />
          <span className="text-white text-[11px] font-semibold">
            {orderType === 'limit' ? t('trade.limitOrder') : t('trade.marketOrder')}
          </span>
          <ChevronDown size={11} className="text-zinc-500 ml-auto" />
        </button>

        {showOrderTypeMenu && (
          <div className="absolute top-full left-0 right-0 mt-0.5 bg-zinc-900 border border-zinc-800 rounded-md z-10 overflow-hidden">
            <button
              onClick={() => handleOrderType('limit')}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${
                orderType === 'limit' ? 'text-white bg-zinc-800' : 'text-zinc-400'
              }`}
            >
              <Info size={11} className={orderType === 'limit' ? 'text-white' : 'text-zinc-500'} />
              {t('trade.limitOrder')}
            </button>
            <button
              onClick={() => handleOrderType('market')}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${
                orderType === 'market' ? 'text-white bg-zinc-800' : 'text-zinc-400'
              }`}
            >
              <Info size={11} className={orderType === 'market' ? 'text-white' : 'text-zinc-500'} />
              {t('trade.marketOrder')}
            </button>
          </div>
        )}
      </div>

      {/* Price input — Bitget style: vertical layout */}
      {orderType === 'limit' && (
        <div className="flex gap-1.5">
          <div className="bg-[#1d1e23] border border-zinc-800 rounded-md px-2 py-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-zinc-500 text-[9px] leading-tight">{t('trade.price')}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent text-white text-[15px] font-mono font-semibold outline-none leading-tight"
                />
              </div>
              <button
                onClick={() => adjustPrice(-0.1)}
                className="p-1 text-zinc-400 active:text-white"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => adjustPrice(0.1)}
                className="p-1 text-zinc-400 active:text-white"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
          <button className="w-[54px] shrink-0 rounded-md bg-[#1d1e23] border border-zinc-800 text-[12px] text-white font-bold">
            BBO
          </button>
        </div>
      )}

      {/* Quantity input — Bitget style: vertical layout */}
      <div className="bg-[#1d1e23] border border-zinc-800 rounded-md px-2 py-0.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            <input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={t('trade.amount')}
              className="w-full bg-transparent text-white text-[15px] font-semibold outline-none leading-tight placeholder:text-zinc-400"
            />
          </div>
          <button className="text-zinc-300 text-[11px] font-bold shrink-0 flex items-center gap-1">
            {base}
            <ChevronDown size={10} className="text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1 py-1">
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-[2px] appearance-none bg-zinc-800 rounded-full outline-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-zinc-600"
        />
        <div className="flex items-center justify-between mt-0.5">
          {sliderStops.map((stop) => (
            <button
              key={stop}
              onClick={() => { haptic.light(); setSliderValue(stop); }}
              className={`w-1.5 h-1.5 rotate-45 transition-colors ${
                sliderValue >= stop ? 'bg-violet-400' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* TP/SL */}
      <button
        onClick={() => { haptic.light(); setTpslEnabled(!tpslEnabled); }}
        className="flex items-center gap-1.5"
      >
        <div
          className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${
            tpslEnabled ? 'bg-violet-500 border-violet-500' : 'border-zinc-600'
          }`}
        >
          {tpslEnabled && (
            <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="text-zinc-400 text-[11px]">{t('trade.tpsl')}</span>
      </button>

      {/* Bottom block: Available + Max + buttons — natural flow, no gap to TP/SL */}
      <div className="flex flex-col gap-1">
        {/* Available — with plus-circle icon */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">{t('trade.available')}</span>
          <div className="flex items-center gap-1">
            <span className="text-white text-[10px] font-mono">0.0145 {quote}</span>
            <PlusCircle size={11} className="text-zinc-500" />
          </div>
        </div>

        {/* Max to open — long */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">{t('trade.maxToOpen')}</span>
          <span className="text-white text-[10px] font-mono tabular-nums">0.00 {base}</span>
        </div>

        {/* Open Long button — Bitget cyan */}
        <button className="w-full h-[46px] rounded-lg bg-white active:bg-zinc-200 transition-colors">
          <span className="text-black text-[12px] font-bold block leading-tight">{t('trade.openLong')}</span>
          <span className="text-black/60 text-[10px] block font-mono leading-tight">0.00 {quote}</span>
        </button>

        {/* Max to open — short */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 text-[10px]">{t('trade.maxToOpen')}</span>
          <span className="text-white text-[10px] font-mono tabular-nums">0.00 {base}</span>
        </div>

        {/* Open Short button — Bitget pink */}
        <button className="w-full h-[46px] rounded-lg bg-violet-500 active:bg-violet-600 transition-colors">
          <span className="text-white text-[12px] font-bold block leading-tight">{t('trade.openShort')}</span>
          <span className="text-white/80 text-[10px] block font-mono leading-tight">0.00 {quote}</span>
        </button>
      </div>
    </div>
  );
};

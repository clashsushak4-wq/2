import { useState } from 'react';
import { ChevronDown, Info, PlusCircle } from 'lucide-react';
import { useTranslation } from '../../../../../../i18n';
import { haptic } from '../../../../../../utils';
import type { OrderType } from '../../types';
import { api } from '../../../../../../api/client';

type FormTab = 'open' | 'close';

interface OrderFormProps {
  symbol: string;
  base: string;
  quote: string;
  currentPrice: number;
  price: string;
  onPriceChange: (val: string) => void;
}

export const OrderForm = ({ symbol, base, quote, currentPrice: _currentPrice, price, onPriceChange }: OrderFormProps) => {
  const { t } = useTranslation();
  const [formTab, setFormTab] = useState<FormTab>('open');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [quantity, setQuantity] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [tpslEnabled, setTpslEnabled] = useState(false);
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitOrder = async (side: 'buy' | 'sell') => {
    if (!quantity || isNaN(parseFloat(quantity))) return;

    haptic.medium();
    setIsSubmitting(true);
    try {
      await api.trade.placeOrder({
        symbol,
        side,
        type: orderType,
        quantity: parseFloat(quantity),
        price: orderType === 'limit' ? parseFloat(price) : undefined,
        leverage: 10,
      });
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(`Успешно открыта ${side === 'buy' ? 'Long' : 'Short'} позиция!`);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Ошибка при открытии позиции');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const sliderStops = [0, 25, 50, 75, 100];

  return (
    <div className="flex h-full flex-col gap-1 px-0 pt-0 pb-0.5 flex-1 min-h-0">

      {/* Open / Close tabs - Slider Style */}
      <div className="flex bg-[#1d1e23] rounded-md p-1 overflow-hidden relative h-[28px]">
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#35363c] rounded-sm transition-transform duration-200 ease-out`}
          style={{ transform: formTab === 'open' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
        />
        <button
          onClick={() => handleFormTab('open')}
          className={`flex-1 relative z-10 text-[12px] font-bold transition-colors ${formTab === 'open' ? 'text-white' : 'text-zinc-500'
            }`}
        >
          {t('trade.openTab')}
        </button>
        <button
          onClick={() => handleFormTab('close')}
          className={`flex-1 relative z-10 text-[12px] font-bold transition-colors ${formTab === 'close' ? 'text-white' : 'text-zinc-500'
            }`}
        >
          {t('trade.closeTab')}
        </button>
      </div>

      {/* Order type selector */}
      <div className="relative">
        <button
          onClick={() => { haptic.light(); setShowOrderTypeMenu(!showOrderTypeMenu); }}
          className="flex items-center gap-1.5 w-full bg-[#1d1e23] rounded-md px-2.5 h-[28px]"
        >
          <Info size={12} className="text-zinc-500" />
          <span className="text-zinc-200 text-[12px]">
            {orderType === 'limit' ? t('trade.limitOrder') : t('trade.marketOrder')}
          </span>
          <ChevronDown size={12} className="text-zinc-600 ml-auto" />
        </button>

        {showOrderTypeMenu && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#25262b] rounded-md z-20 shadow-xl overflow-hidden border border-zinc-800">
            <button
              onClick={() => handleOrderType('limit')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] ${orderType === 'limit' ? 'text-white bg-zinc-800' : 'text-zinc-400'
                }`}
            >
              <Info size={12} className={orderType === 'limit' ? 'text-white' : 'text-zinc-500'} />
              {t('trade.limitOrder')}
            </button>
            <button
              onClick={() => handleOrderType('market')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] ${orderType === 'market' ? 'text-white bg-zinc-800' : 'text-zinc-400'
                }`}
            >
              <Info size={12} className={orderType === 'market' ? 'text-white' : 'text-zinc-500'} />
              {t('trade.marketOrder')}
            </button>
          </div>
        )}
      </div>

      {/* Price input */}
      {orderType === 'limit' && (
        <div className="flex bg-[#1d1e23] rounded-md px-2.5 h-[28px] items-center justify-between">
          <span className="text-zinc-500 text-[11px]">{t('trade.price')}</span>
          <div className="flex items-center gap-1 w-1/2 justify-end">
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="w-full bg-transparent text-white text-[12px] font-mono text-right outline-none placeholder:text-zinc-600"
              placeholder="0"
            />
            <span className="text-zinc-500 text-[11px] font-mono">{quote}</span>
          </div>
        </div>
      )}

      {/* Quantity/Cost input */}
      <div className="flex bg-[#1d1e23] rounded-md px-2.5 h-[28px] items-center justify-between">
        <span className="text-zinc-500 text-[11px]">{orderType === 'market' ? 'Стоимость' : 'Количество'}</span>
        <div className="flex items-center gap-1 w-1/2 justify-end">
          <input
            type="text"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-transparent text-white text-[12px] font-mono text-right outline-none placeholder:text-zinc-600"
            placeholder="0.00"
          />
          <button className="text-zinc-300 text-[11px] font-mono flex items-center gap-0.5">
            {orderType === 'market' ? quote : base}
            <ChevronDown size={10} className="text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1 py-0 mt-0.5">
        <input
          type="range"
          min={0}
          max={100}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-[2px] appearance-none bg-zinc-800 rounded-full outline-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px]
            [&::-webkit-slider-thumb]:border-black"
        />
        <div className="flex items-center justify-between mt-1 px-0.5">
          {sliderStops.map((stop) => (
            <button
              key={stop}
              onClick={() => { haptic.light(); setSliderValue(stop); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${sliderValue >= stop ? 'bg-zinc-400' : 'bg-zinc-800'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Expected Stats */}
      <div className="flex flex-col mt-0.5 border-t border-dashed border-zinc-800 pt-1">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-zinc-500">Ожид. открытие</span>
          <span className="text-zinc-400">-- / -- {quote}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-zinc-500">Ожид. цена ликвид.</span>
          <span className="text-zinc-400">-- / --</span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-1 mt-1">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-[11px]">Дост.</span>
          <div className="flex items-center gap-1">
            <span className="text-zinc-200 text-[11px] font-mono">0.0274 {quote}</span>
            <PlusCircle size={11} className="text-zinc-400" />
          </div>
        </div>

        {/* TP/SL */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { haptic.light(); setTpslEnabled(!tpslEnabled); }}
            className={`w-[14px] h-[14px] rounded-[3px] border flex items-center justify-center transition-colors ${tpslEnabled ? 'bg-zinc-600 border-zinc-600' : 'border-zinc-700 bg-transparent'
              }`}
          >
            {tpslEnabled && (
              <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-zinc-400 text-[11px]">Т-п/с-л</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1 mt-1">
          <button
            onClick={() => submitOrder('buy')}
            disabled={isSubmitting}
            className="w-full h-[32px] rounded-md bg-white active:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <span className="text-black text-[13px] font-bold">Открыть лонг</span>
          </button>

          <button
            onClick={() => submitOrder('sell')}
            disabled={isSubmitting}
            className="w-full h-[32px] rounded-md bg-violet-500 active:bg-violet-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <span className="text-white text-[13px] font-bold">Открыть шорт</span>
          </button>
        </div>
      </div>
    </div>
  );
};

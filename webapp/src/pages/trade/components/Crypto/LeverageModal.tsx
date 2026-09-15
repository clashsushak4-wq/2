import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { BottomSheet } from '../../../../shared/ui';
import { haptic } from '../../../../utils';

interface LeverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLeverage: number;
  onChange: (leverage: number) => void;
}

const MARKS = [1, 30, 60, 90, 120, 150];

export const LeverageModal = ({ isOpen, onClose, currentLeverage, onChange }: LeverageModalProps) => {
  const [leverage, setLeverage] = useState(currentLeverage);
  const [isBatch, setIsBatch] = useState(false);

  // Sync when opened
  useEffect(() => {
    if (isOpen) {
      setLeverage(currentLeverage);
    }
  }, [isOpen, currentLeverage]);

  const handleConfirm = () => {
    haptic.medium();
    onChange(leverage);
    onClose();
  };

  const updateLeverage = (val: number) => {
    const newVal = Math.min(150, Math.max(1, val));
    if (newVal !== leverage) {
      haptic.light();
      setLeverage(newVal);
    }
  };

  const getPercent = (val: number) => ((val - 1) / 149) * 100;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Отрегулируйте кредитное плечо">
      <div className="flex flex-col text-zinc-100">
        
        {/* Controls */}
        <div className="flex items-center justify-between bg-zinc-900 rounded-xl p-2 mb-8 mt-2 border border-zinc-800">
          <button 
            onClick={() => updateLeverage(leverage - 1)}
            className="p-3 text-zinc-400 active:text-white"
          >
            <Minus size={20} />
          </button>
          <span className="text-xl font-bold">{leverage}x</span>
          <button 
            onClick={() => updateLeverage(leverage + 1)}
            className="p-3 text-zinc-400 active:text-white"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Custom Slider */}
        <div className="relative mb-12">
          <div className="relative h-6 flex items-center">
            <input 
              type="range"
              min="1"
              max="150"
              value={leverage}
              onChange={(e) => updateLeverage(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
            />
            <div className="w-full h-1 bg-zinc-800 rounded-full relative z-10 pointer-events-none">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full"
                style={{ width: `${getPercent(leverage)}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ left: `calc(${getPercent(leverage)}% - 8px)` }}
              />
            </div>
          </div>
          
          {/* Marks */}
          <div className="absolute w-full top-6">
            {MARKS.map((mark) => (
              <div 
                key={mark} 
                className="absolute flex flex-col items-center -translate-x-1/2 text-[10px] text-zinc-500 font-medium whitespace-nowrap"
                style={{ left: `${getPercent(mark)}%` }}
              >
                <div className={`w-1.5 h-1.5 rounded-full mb-1 absolute -top-4 ${leverage >= mark ? 'bg-white' : 'bg-zinc-700'}`} />
                {mark}x
              </div>
            ))}
          </div>
        </div>

        {/* Info Rows */}
        <div className="flex justify-between items-center mb-6 mt-2">
          <span className="text-sm text-zinc-400">Макс. открытие после изменения кредитного плеча</span>
          <span className="text-sm text-white font-medium">1,200.0</span>
        </div>

        <div className="flex justify-between items-center mb-6 gap-4">
          <span className="text-sm text-zinc-400 leading-snug">
            Пакетная корректировка кредитного плеча (≤20x) для всех Фьючерсы USDT-M
          </span>
          <div 
            onClick={() => { haptic.light(); setIsBatch(!isBatch); }}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors shrink-0 ${isBatch ? 'bg-white' : 'bg-zinc-600'}`}
          >
            <div className={`w-5 h-5 rounded-full shadow-md transform transition-transform ${isBatch ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'}`} />
          </div>
        </div>

        {/* Warning Text */}
        <div className="text-xs text-amber-500 font-medium leading-relaxed mb-6">
          * Если вы сейчас настроите кредитное плечо, это повлияет на все позиции и отложенные ордера.<br/>
          Выбор торговли с кредитным плечом более 10x может легко привести к ликвидации. Пожалуйста, выполняйте регулировку с осторожностью!
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 bg-white text-black font-bold text-lg rounded-xl transition-transform active:scale-95"
        >
          Подтвердить
        </button>

      </div>
    </BottomSheet>
  );
};

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface PinPadProps {
  title?: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  error?: string;
}

export const PinPad = ({ title = "Введите PIN-код", subtitle = "Для защиты ваших средств", onComplete, error }: PinPadProps) => {
  const [pin, setPin] = useState("");

  const PIN_LENGTH = 6;

  const handlePress = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === PIN_LENGTH) {
        // Небольшая задержка, чтобы юзер увидел последнюю точку
        setTimeout(() => {
          onComplete(newPin);
          setPin(""); // сброс для возможного повторного ввода (например, подтверждение)
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const renderDots = () => {
    return (
      <div className="flex items-center justify-center gap-3 mb-8 h-12">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => {
          const isFilled = i < pin.length;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{ 
                scale: isFilled ? 1.2 : 1,
                backgroundColor: isFilled ? "#3B82F6" : "#27272A",
                borderColor: isFilled ? "#3B82F6" : "#3F3F46"
              }}
              className={`w-4 h-4 rounded-full border-2`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-center min-h-[70vh] w-full"
    >
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-zinc-400 mb-8">{subtitle}</p>

      {renderDots()}

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mb-4">
          {error}
        </motion.p>
      )}

      <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-20 h-20 rounded-full bg-zinc-900/80 border border-zinc-800 text-white text-3xl font-medium active:bg-zinc-800 active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
        <div /> {/* Empty cell */}
        <button
          onClick={() => handlePress("0")}
          className="w-20 h-20 rounded-full bg-zinc-900/80 border border-zinc-800 text-white text-3xl font-medium active:bg-zinc-800 active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-20 h-20 rounded-full bg-transparent text-zinc-400 flex items-center justify-center active:bg-zinc-900/50 active:scale-95 transition-all"
        >
          <Delete size={28} />
        </button>
      </div>
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Copy, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useState, useMemo } from 'react';

interface SeedBackupProps {
  mnemonic: string[];
  onConfirm: () => void;
}

export const SeedBackup = ({ mnemonic, onConfirm }: SeedBackupProps) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [inputs, setInputs] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState(false);

  // Генерируем 6 случайных уникальных индексов для проверки (от 0 до 23)
  const verifyIndices = useMemo(() => {
    const indices = new Set<number>();
    while (indices.size < 6) {
      indices.add(Math.floor(Math.random() * 24));
    }
    return Array.from(indices).sort((a, b) => a - b);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    const isValid = verifyIndices.every((index, i) => 
      inputs[i].trim().toLowerCase() === mnemonic[index]
    );

    if (isValid) {
      setError(false);
      onConfirm();
    } else {
      setError(true);
    }
  };

  if (isVerifying) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col min-h-full pb-10 px-4"
      >
        <div className="flex items-center gap-4 mt-4 mb-6">
          <button onClick={() => setIsVerifying(false)} className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-white">Проверка фразы</h2>
        </div>

        <p className="text-zinc-400 text-sm mb-6">
          Введите 6 слов из вашей секретной фразы, чтобы мы убедились, что вы сохранили её правильно.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          {verifyIndices.map((index, i) => (
            <div key={index} className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500 ml-2">Слово #{index + 1}</label>
              <input
                type="text"
                value={inputs[i]}
                onChange={(e) => {
                  const newInputs = [...inputs];
                  newInputs[i] = e.target.value.toLowerCase();
                  setInputs(newInputs);
                  setError(false);
                }}
                className={`w-full bg-zinc-900 border ${error ? 'border-red-500' : 'border-zinc-800 focus:border-blue-500'} rounded-xl px-4 py-3 text-white outline-none transition-colors`}
                placeholder={`Слово ${index + 1}`}
                autoCapitalize="none"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">
            Некоторые слова введены неверно. Попробуйте еще раз.
          </p>
        )}

        <div className="mt-auto pt-4 flex justify-center">
          <button
            onClick={handleVerify}
            disabled={inputs.some(i => i.length === 0)}
            className="w-full max-w-sm h-12 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 active:scale-95 transition-transform"
          >
            Проверить
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-10"
    >
      <div className="flex flex-col items-center text-center mt-6 mb-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Секретная фраза</h2>
        <p className="text-zinc-400 text-sm max-w-[300px]">
          Запишите эти 24 слова в правильном порядке. Это единственный способ восстановить кошелек, если вы забудете PIN.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 relative">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {mnemonic.map((word, index) => (
            <div key={index} className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-zinc-500 text-[11px] w-4 text-right shrink-0">{index + 1}.</span>
              <span className="text-zinc-100 text-[13px] font-medium bg-zinc-800/60 px-2 py-1 rounded-md w-full truncate text-center border border-zinc-700/30">
                {word}
              </span>
            </div>
          ))}
        </div>
        
        <button 
          onClick={handleCopy}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full font-medium shadow-lg hover:bg-blue-600 transition-colors"
        >
          {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>

      <div className="mt-auto pt-6 flex justify-center">
        <button
          onClick={() => setIsVerifying(true)}
          className="w-full max-w-sm h-12 rounded-xl bg-white text-black font-bold active:scale-95 transition-transform"
        >
          Я записал фразу
        </button>
      </div>
    </motion.div>
  );
};

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { importWallet } from '../../../utils/crypto';

interface SeedImportProps {
  onBack: () => void;
  onSuccess: (mnemonic: string[], address: string) => void;
}

export const SeedImport = ({ onBack, onSuccess }: SeedImportProps) => {
  const [words, setWords] = useState<string[]>(Array(24).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const pastedWords = pastedData.trim().split(/\s+/).map(w => w.toLowerCase());
    
    if (pastedWords.length > 0) {
      const newWords = [...words];
      let j = 0;
      for (let i = index; i < 24 && j < pastedWords.length; i++, j++) {
        newWords[i] = pastedWords[j];
      }
      setWords(newWords);
      setError(null);
    }
  };

  const handleImport = async () => {
    const isComplete = words.every(w => w.trim().length > 0);
    if (!isComplete) {
      setError("Пожалуйста, заполните все 24 слова.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Искусственная задержка для плавности UX
      await new Promise(r => setTimeout(r, 500));
      const cleanWords = words.map(w => w.trim().toLowerCase());
      const walletData = await importWallet(cleanWords);
      onSuccess(cleanWords, walletData.address);
    } catch (e) {
      setError("Неверная сид-фраза. Проверьте правильность написания слов.");
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-full pb-10 px-4"
    >
      <div className="flex items-center gap-4 mt-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Импорт кошелька</h2>
      </div>

      <p className="text-zinc-400 text-sm mb-6">
        Введите 24 слова вашей секретной фразы для восстановления доступа. Можно скопировать всю фразу целиком и вставить в первое поле.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {words.map((word, index) => (
          <div key={index} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-zinc-500 text-[10px] w-4 text-right">{index + 1}.</span>
            <input
              type="text"
              value={word}
              onChange={(e) => {
                const newWords = [...words];
                newWords[index] = e.target.value.toLowerCase();
                setWords(newWords);
                setError(null);
              }}
              onPaste={(e) => handlePaste(e, index)}
              className="w-full bg-transparent text-white text-sm outline-none"
              placeholder={`Слово ${index + 1}`}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center mb-4">{error}</p>
      )}

      <div className="mt-auto pt-4 flex justify-center">
        <button
          onClick={handleImport}
          disabled={isLoading}
          className="w-full max-w-sm h-12 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Восстановить"
          )}
        </button>
      </div>
    </motion.div>
  );
};

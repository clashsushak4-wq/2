import { motion } from 'framer-motion';
import { Plus, Download } from 'lucide-react';

interface OnboardingProps {
  onCreate: () => void;
  onImport: () => void;
}

export const Onboarding = ({ onCreate, onImport }: OnboardingProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      {/* Decorative Icon Glow */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700/50 flex items-center justify-center shadow-2xl">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#blue-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-white mb-3">Ваш Кошелек</h2>
      <p className="text-zinc-400 mb-10 max-w-[280px]">
        Безопасное хранение TON и USDT. Ключи хранятся только у вас.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <button
          onClick={onCreate}
          className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-center gap-2 bg-zinc-950/50 backdrop-blur-sm px-6 py-4 rounded-2xl text-white font-semibold transition-all group-hover:bg-zinc-950/30">
            <Plus size={20} className="text-blue-400" />
            Создать новый
          </div>
        </button>

        <button
          onClick={onImport}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <Download size={20} className="text-zinc-400" />
          У меня есть сид-фраза
        </button>
      </div>
    </motion.div>
  );
};

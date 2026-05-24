import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ExchangeCard, AddExchangeForm } from './components';
import { useExchanges } from './hooks';

export const ExchangesView = () => {
  const { exchanges, isLoading, handleAdd, handleDelete } = useExchanges();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
    >
      {isLoading && exchanges.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-zinc-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {exchanges.map((ex) => (
            <ExchangeCard key={ex.id} exchange={ex} onDelete={handleDelete} />
          ))}

          <AddExchangeForm onAdd={handleAdd} />

          {exchanges.length === 0 && !isLoading && (
            <p className="text-center text-zinc-600 text-xs py-8">
              Нет добавленных бирж. Нажмите кнопку выше, чтобы добавить.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};


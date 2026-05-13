import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ExchangeCard, AddExchangeForm } from './components';
import { api } from '../../api/client';
import type { ExchangeItem } from '../../api/client';

export const ExchangesView = () => {
  const [exchanges, setExchanges] = useState<ExchangeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.exchanges.getAll();
      setExchanges(data);
    } catch (e) {
      console.error('Failed to load exchanges:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = useCallback(async (name: string, apiKey: string, apiSecret: string) => {
    await api.exchanges.create(name, apiKey, apiSecret);
    await load();
  }, [load]);

  const handleDelete = useCallback(async (id: number) => {
    await api.exchanges.delete(id);
    setExchanges((prev) => prev.filter((e) => e.id !== id));
  }, []);

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

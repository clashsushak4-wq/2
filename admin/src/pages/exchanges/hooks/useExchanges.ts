import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api/client';
import type { ExchangeItem } from '../../../api/client';

export const useExchanges = () => {
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

  return {
    exchanges,
    isLoading,
    handleAdd,
    handleDelete,
  };
};

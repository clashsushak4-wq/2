import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../api/client';
import type { ExchangeItem } from '../../../api/client';
import { useToastStore } from '../../../shared/ui';
import { getApiError } from '../../../shared/utils';

export const useExchanges = () => {
  const [exchanges, setExchanges] = useState<ExchangeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastStore((s) => s.add);

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

  const handleAdd = useCallback(async (name: string, apiKey: string, apiSecret: string): Promise<boolean> => {
    try {
      await api.exchanges.create(name, apiKey, apiSecret);
      await load();
      return true;
    } catch (e: any) {
      toast(getApiError(e, 'Не удалось добавить биржу'), 'error');
      return false;
    }
  }, [load, toast]);

  const handleDelete = useCallback(async (id: number): Promise<boolean> => {
    try {
      await api.exchanges.delete(id);
      setExchanges((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (e: any) {
      toast(getApiError(e, 'Не удалось удалить биржу'), 'error');
      return false;
    }
  }, [toast]);

  return {
    exchanges,
    isLoading,
    handleAdd,
    handleDelete,
  };
};

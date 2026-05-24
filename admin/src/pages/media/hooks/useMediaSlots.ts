import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import type { BotMediaItem, BotMediaSlot } from '../../../api/client';
import { useToastStore } from '../../../shared/ui';

export const useMediaSlots = () => {
  const [slots, setSlots] = useState<BotMediaSlot[]>([]);
  const [items, setItems] = useState<BotMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToastStore((s) => s.add);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slotsData, itemsData] = await Promise.all([
        api.botMedia.getSlots(),
        api.botMedia.getAll(),
      ]);
      setSlots(slotsData);
      setItems(itemsData);
    } catch (e: any) {
      toast(e?.message || 'Ошибка загрузки', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const itemsByKey = new Map(items.map((i) => [i.key, i]));

  const handleSet = useCallback(
    async (key: string, fileUrl: string, thumbUrl: string | null) => {
      try {
        const updated = await api.botMedia.set(key, fileUrl, thumbUrl);
        setItems((prev) => {
          const filtered = prev.filter((i) => i.key !== key);
          return [...filtered, updated];
        });
        toast('Фото обновлено');
      } catch (e: any) {
        toast(e?.message || 'Ошибка сохранения', 'error');
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (key: string) => {
      try {
        await api.botMedia.delete(key);
        setItems((prev) =>
          prev.map((i) =>
            i.key === key
              ? { ...i, file_url: null, thumb_url: null, updated_at: null }
              : i,
          ),
        );
        toast('Фото удалено');
      } catch (e: any) {
        toast(e?.message || 'Ошибка удаления', 'error');
      }
    },
    [toast],
  );

  return {
    slots,
    isLoading,
    itemsByKey,
    handleSet,
    handleDelete,
  };
};

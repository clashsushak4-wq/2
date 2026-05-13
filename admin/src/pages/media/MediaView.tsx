import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import type { BotMediaItem, BotMediaSlot } from '../../api/client';
import { useToastStore } from '../../shared/ui';
import { MediaSlotCard } from './components';

export const MediaView = () => {
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
    >
      {isLoading && slots.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-zinc-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, index) => (
            <MediaSlotCard
              key={slot.key}
              index={index + 1}
              slot={slot}
              item={itemsByKey.get(slot.key) ?? null}
              onSet={handleSet}
              onDelete={handleDelete}
            />
          ))}

          {slots.length === 0 && (
            <p className="text-center text-zinc-600 text-xs py-8">
              Нет настраиваемых слотов.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
};

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { MediaSlotCard } from './components';
import { useMediaSlots } from './hooks';

export const MediaView = () => {
  const { slots, isLoading, itemsByKey, handleSet, handleDelete } = useMediaSlots();

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


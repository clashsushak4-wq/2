import { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import { api } from '../../../../api/client';
import type { BotMediaItem, BotMediaSlot } from '../../../../api/client';
import { useToastStore } from '../../../../shared/ui';

interface Props {
  index: number;
  slot: BotMediaSlot;
  item: BotMediaItem | null;
  onSet: (key: string, fileUrl: string, thumbUrl: string | null) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
}

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif';
const API_ORIGIN = (() => {
  const raw = import.meta.env.VITE_API_URL || '';
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
})();

const resolvePreviewUrl = (relativePath: string | null): string | null => {
  if (!relativePath) return null;
  if (/^https?:\/\//.test(relativePath)) return relativePath;
  return `${API_ORIGIN}${relativePath}`;
};

export const MediaSlotCard = ({ index, slot, item, onSet, onDelete }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const toast = useToastStore((s) => s.add);

  // Превью грузим из thumb_url — это уменьшенный WebP (~5-15 KB),
  // на старых записях thumb_url может быть null — тогда fallback на full file_url.
  const previewUrl = resolvePreviewUrl(item?.thumb_url ?? item?.file_url ?? null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast('Файл больше 10 MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const { url, thumb_url } = await api.uploads.upload(file, file.name);
      await onSet(slot.key, url, thumb_url);
    } catch (err: any) {
      toast(err?.message || 'Ошибка загрузки', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setConfirming(false);
    await onDelete(slot.key);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Превью / placeholder */}
        <div className="w-20 h-20 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
          {previewUrl ? (
            <img src={previewUrl} alt={slot.title} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={20} className="text-zinc-600" />
          )}
        </div>

        {/* Текст */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 rounded-md px-1.5 py-0.5">
              #{index}
            </span>
            <h3 className="text-white text-sm font-semibold truncate">{slot.title}</h3>
          </div>
          <p className="text-zinc-500 text-[11px] leading-snug">{slot.description}</p>
          {item?.updated_at && (
            <p className="text-zinc-600 text-[10px] mt-1">
              Обновлено: {new Date(item.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Действия */}
      <div className="flex items-center gap-1.5 mt-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 h-9 rounded-xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {item?.file_url ? 'Заменить' : 'Загрузить'}
        </button>

        {item?.file_url &&
          (confirming ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                className="px-2.5 h-9 rounded-xl bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2.5 h-9 rounded-xl bg-zinc-800 text-zinc-400 text-[11px] font-medium hover:bg-zinc-700 transition-colors"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
              title="Удалить"
            >
              <Trash2 size={14} className="text-red-400" />
            </button>
          ))}
      </div>
    </div>
  );
};

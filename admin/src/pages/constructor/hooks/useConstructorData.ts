import { useState, useEffect, useCallback, useRef } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { api } from '../../../api/client';
import type { HomeTile, HomeTileCreate, HomeTileUpdate } from '../../../api/client';
import { useToastStore } from '../../../shared/ui';

export const useConstructorData = () => {
  const [tiles, setTiles] = useState<HomeTile[]>([]);
  const serverTiles = useRef<HomeTile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  
  const toast = useToastStore((s) => s.add);

  const isDirty = useCallback(() => {
    if (tiles.length !== serverTiles.current.length) return true;
    return tiles.some((t, i) => {
      const s = serverTiles.current[i];
      return t.id !== s.id || t.is_active !== s.is_active;
    });
  }, [tiles]);

  const loadTiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.tiles.getAll();
      setTiles(data);
      serverTiles.current = data;
    } catch (e: any) {
      toast(e?.message || 'Ошибка загрузки', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadTiles(); }, [loadTiles]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tiles.findIndex(t => t.id === active.id);
    const newIndex = tiles.findIndex(t => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newTiles = [...tiles];
    const [moved] = newTiles.splice(oldIndex, 1);
    newTiles.splice(newIndex, 0, moved);
    setTiles(newTiles);
  };

  const handleToggleActive = (tile: HomeTile) => {
    setTiles(prev => prev.map(t => t.id === tile.id ? { ...t, is_active: !t.is_active } : t));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const orders = tiles.map((t, i) => ({ id: t.id, order: i }));
      await api.tiles.reorder(orders);

      const toggleUpdates = tiles
        .map((tile) => {
          const server = serverTiles.current.find(s => s.id === tile.id);
          if (server && server.is_active !== tile.is_active) {
            return api.tiles.update(tile.id, { is_active: tile.is_active });
          }
          return null;
        })
        .filter((p): p is Promise<HomeTile> => p !== null);

      await Promise.all(toggleUpdates);

      toast('Все изменения сохранены');
      await loadTiles();
    } catch (e: any) {
      toast(e?.message || 'Ошибка сохранения', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setTiles([...serverTiles.current]);
    toast('Изменения отменены', 'info');
  };

  const handleCreate = async (data: HomeTileCreate) => {
    try {
      await api.tiles.create(data);
      toast('Тайл создан');
      await loadTiles();
      return true;
    } catch (e: any) {
      toast(e?.message || 'Ошибка создания', 'error');
      return false;
    }
  };

  const handleUpdate = async (id: number, data: Partial<HomeTileCreate>) => {
    try {
      await api.tiles.update(id, data as HomeTileUpdate);
      toast('Тайл сохранён');
      await loadTiles();
      return true;
    } catch (e: any) {
      toast(e?.message || 'Ошибка обновления', 'error');
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.tiles.delete(id);
      toast('Тайл удалён');
      await loadTiles();
      return true;
    } catch (e: any) {
      toast(e?.message || 'Ошибка удаления', 'error');
      return false;
    }
  };

  const handleDuplicate = async (tile: HomeTile) => {
    try {
      await api.tiles.create({
        type: tile.type,
        size: tile.size,
        order: tiles.length,
        is_active: false,
        content: { ...tile.content, title: (tile.content?.title || '') + ' (копия)' },
      });
      toast('Тайл дублирован', 'info');
      await loadTiles();
    } catch (e: any) {
      toast(e?.message || 'Ошибка дублирования', 'error');
    }
  };

  return {
    tiles,
    isLoading,
    isSaving,
    activeDragId,
    hasChanges: isDirty(),
    handleDragStart,
    handleDragEnd,
    handleToggleActive,
    handleSaveAll,
    handleDiscardChanges,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDuplicate,
  };
};

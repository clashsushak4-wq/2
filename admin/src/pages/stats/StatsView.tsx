import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, CalendarDays, Bell, AtSign, MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { getApiError } from '../../shared/utils';
import type { AdminStatsResponse } from '../../api/client';
import { StatsCard } from './components';

export const StatsView = () => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.users.getStats();
      setStats(data);
    } catch (e: any) {
      setError(getApiError(e, 'Ошибка загрузки статистики'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const metrics = stats
    ? [
        { label: 'Сегодня', value: stats.new_today, icon: UserPlus },
        { label: 'За 7 дней', value: stats.new_week, icon: CalendarDays },
        { label: 'Уведомления', value: stats.with_notifications, icon: Bell },
        { label: 'С никнеймом', value: stats.with_nickname, icon: AtSign },
        { label: 'Тикеты', value: stats.tickets_new, icon: MessageCircle },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-zinc-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-medium text-sm mb-1">Не удалось загрузить данные</h3>
            <p className="text-zinc-500 text-xs">{error}</p>
          </div>
          <button
            onClick={load}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition-colors mt-2"
          >
            Повторить
          </button>
        </div>
      ) : stats ? (
        <StatsCard
          totalUsers={stats.total_users}
          metrics={metrics}
        />
      ) : null}
    </motion.div>
  );
};

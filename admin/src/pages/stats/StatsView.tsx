import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, CalendarDays, Bell, AtSign, MessageCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import type { AdminStatsResponse } from '../../api/client';
import { StatsCard } from './components';

export const StatsView = () => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await api.users.getStats();
      setStats(data);
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
      {isLoading || !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="text-zinc-600 animate-spin" />
        </div>
      ) : (
        <StatsCard
          totalUsers={stats.total_users}
          metrics={metrics}
        />
      )}
    </motion.div>
  );
};

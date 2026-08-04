import { useAppStore, useAuthStore } from '../../../../store';
import { NotificationButton } from '../NotificationButton';

interface ProfileCardProps {
  onNotificationClick?: () => void;
  isNotificationActive?: boolean;
}

export const ProfileCard = ({ onNotificationClick, isNotificationActive }: ProfileCardProps = {}) => {
  const user = useAppStore((s) => s.user);
  const session = useAuthStore((s) => s.session);

  // Уникальный ник, заданный в боте, — главное отображаемое имя.
  // Если ника ещё нет (новый пользователь / нет сессии) — показываем Telegram-имя.
  const nickname = session?.nickname || null;
  const fallbackName = user?.username ?? user?.firstName ?? 'User';
  const displayName = nickname ? `#${nickname}` : fallbackName;
  const avatarChar = (nickname ?? fallbackName)[0]?.toUpperCase() ?? 'U';

  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 hover:border-white/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-br-full pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-2xl flex items-center justify-center text-2xl font-bold text-white border border-zinc-700">
            {avatarChar}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{displayName}</h3>
            {user?.id && <p className="text-zinc-500 text-sm">ID: {user.id}</p>}
          </div>
        </div>
        <NotificationButton onClick={onNotificationClick} isActive={isNotificationActive} />
      </div>
    </div>
  );
};

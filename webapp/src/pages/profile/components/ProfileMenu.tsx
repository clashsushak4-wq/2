import { Settings, Shield, Users, Info, ChevronRight, Bell } from 'lucide-react';

interface ProfileMenuProps {
  activeTab: string;
  onTabChange: (tab: 'settings' | 'about' | 'security' | 'referrals' | 'notifications') => void;
}

export const ProfileMenu = ({ activeTab, onTabChange }: ProfileMenuProps) => {
  const menuItems = [
    { id: 'settings', icon: Settings, label: 'Настройки' },
    { id: 'notifications', icon: Bell, label: 'Уведомления' },
    { id: 'security', icon: Shield, label: 'Безопасность' },
    { id: 'referrals', icon: Users, label: 'Реферальная программа' },
    { id: 'about', icon: Info, label: 'О нас' },
  ] as const;

  return (
    <div className="flex flex-col gap-3 w-full">
      {menuItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-zinc-900 border-2 rounded-xl transition-colors text-left ${
              isActive ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-700 active:bg-zinc-800'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
              <item.icon size={18} className="text-black" />
            </div>
            <span className="flex-1 text-white text-base font-medium">{item.label}</span>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>
        );
      })}
    </div>
  );
};

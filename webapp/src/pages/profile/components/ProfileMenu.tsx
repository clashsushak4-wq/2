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
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[20px] p-2 flex flex-col w-full shadow-lg">
      {menuItems.map((item, index) => {
        const isActive = activeTab === item.id;
        return (
          <div key={item.id}>
            <button 
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <item.icon size={20} />
                </div>
                <span className="font-semibold text-[15px]">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-zinc-600" />
            </button>
            {index < menuItems.length - 1 && (
              <div className="w-[calc(100%-64px)] ml-auto h-[1px] bg-white/5 my-1" />
            )}
          </div>
        );
      })}
    </div>
  );
};

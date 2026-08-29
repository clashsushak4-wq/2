import { Home, TrendingUp, Wallet, Headphones, User } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { haptic } from '../../utils';

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TopNav = ({ activeTab, onTabChange }: TopNavProps) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'wallet', icon: Wallet, label: t('nav.wallet') },
    { id: 'trade', icon: TrendingUp, label: t('nav.trade') },
    { id: 'support', icon: Headphones, label: t('nav.support') },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="w-full h-20 border-b border-zinc-800 bg-zinc-950 shrink-0 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">D</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">DTX Trading</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.light();
                onTabChange(item.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-500' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              }`}
            >
              <item.icon 
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "text-blue-500" : "text-zinc-500"}
              />
              <span className={`text-[15px] font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

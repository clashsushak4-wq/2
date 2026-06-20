import { Home, TrendingUp, Wallet, Headphones, User } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { haptic } from '../../utils';

interface SideNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SideNav = ({ activeTab, onTabChange }: SideNavProps) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', icon: Home, label: t('nav.home') },
    { id: 'wallet', icon: Wallet, label: t('nav.wallet') },
    { id: 'trade', icon: TrendingUp, label: t('nav.trade') },
    { id: 'support', icon: Headphones, label: t('nav.support') },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="w-64 h-full border-r border-zinc-800 bg-zinc-950 p-6 flex flex-col shrink-0">
      <div className="text-2xl font-bold text-white mb-10 pl-2">TradingBot</div>
      
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                haptic.light();
                onTabChange(item.id);
              }}
              className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-zinc-800 text-white shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <item.icon 
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
              />
              <span className="text-base font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

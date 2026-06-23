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
    <div className="w-full h-16 border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center">
        <div className="text-xl font-bold text-white mr-8">TradingBot</div>
        
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  haptic.light();
                  onTabChange(item.id);
                }}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-zinc-800 text-white shadow-md' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <item.icon 
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}
                />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

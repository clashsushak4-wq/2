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
    <div className="w-full h-16 border-b border-zinc-800 bg-zinc-950 px-6 shrink-0 flex justify-center">
      <div className="flex items-center justify-between w-full max-w-6xl h-full">
        <div className="flex items-center justify-center h-full w-full">
          <div className="flex items-center gap-6 h-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    haptic.light();
                    onTabChange(item.id);
                  }}
                  className={`flex items-center gap-2 px-4 h-full relative transition-colors duration-200 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <item.icon 
                    size={16}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[14px] font-semibold tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../shared/ui';
import { 
  ProfileMenu
} from './components';
import { SettingsModal } from './components/SettingsTile/SettingsModal';
import { AboutModal } from './components/AboutTile/AboutModal';
import { NotificationModal } from './components/NotificationButton/NotificationModal';
import { useMediaQuery } from '../../hooks';

type ProfileTab = 'settings' | 'security' | 'referrals' | 'about' | 'notifications' | null;

export const ProfileView = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [activeTab, setActiveTab] = useState<ProfileTab>(null);

  const handleTabChange = (tab: 'settings' | 'about' | 'security' | 'referrals' | 'notifications') => {
    if (tab === 'security' || tab === 'referrals') {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showAlert) {
        tg.showAlert('Раздел находится в разработке');
      } else {
        alert('Раздел находится в разработке');
      }
      return;
    }
    setActiveTab(tab);
  };

  const closeModal = () => setActiveTab(null);

  if (isDesktop) {
    return (
      <PageWrapper className="pb-4 px-4 h-full flex flex-col items-center w-full">
        <div className="w-full max-w-lg flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pt-8">
          <ProfileMenu activeTab={activeTab || ''} onTabChange={handleTabChange} />
        </div>

        <AnimatePresence>
          {activeTab === 'settings' && <SettingsModal key="settings" onClose={closeModal} />}
          {activeTab === 'about' && <AboutModal key="about" onClose={closeModal} />}
          {activeTab === 'notifications' && <NotificationModal key="notifications" onClose={closeModal} isDesktopInline={false} />}
        </AnimatePresence>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="pb-8 -mx-3 px-1 md:mx-auto md:px-4 md:max-w-2xl md:mt-12 flex flex-col gap-4 pt-4">
      <div className="w-full">
        <ProfileMenu activeTab={activeTab || ''} onTabChange={handleTabChange} />
      </div>

      <AnimatePresence>
        {activeTab === 'settings' && <SettingsModal key="settings_mobile" onClose={closeModal} />}
        {activeTab === 'about' && <AboutModal key="about_mobile" onClose={closeModal} />}
        {activeTab === 'notifications' && <NotificationModal key="notifications_mobile" onClose={closeModal} />}
      </AnimatePresence>
    </PageWrapper>
  );
};

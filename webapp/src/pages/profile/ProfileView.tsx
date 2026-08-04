import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../shared/ui';
import { 
  ProfileCard, 
  SettingsTile, 
  AboutTile 
} from './components';
import { SettingsModal } from './components/SettingsTile/SettingsModal';
import { AboutModal } from './components/AboutTile/AboutModal';
import { NotificationModal } from './components/NotificationButton/NotificationModal';
import { useMediaQuery } from '../../hooks';

type ProfileTab = 'notifications' | 'settings' | 'about';

export const ProfileView = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [activeTab, setActiveTab] = useState<ProfileTab>('notifications');

  if (isDesktop) {
    return (
      <PageWrapper className="pb-4 px-4 md:mx-auto lg:max-w-[1000px] flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 h-[calc(100vh-120px)] min-h-[500px]">
        <div className="lg:col-span-5 w-full flex flex-col gap-4">
          <ProfileCard onNotificationClick={() => setActiveTab('notifications')} isNotificationActive={activeTab === 'notifications'} />
          <SettingsTile onClick={() => setActiveTab('settings')} isActive={activeTab === 'settings'} />
          <AboutTile onClick={() => setActiveTab('about')} isActive={activeTab === 'about'} />
        </div>
        <div className="lg:col-span-7 w-full h-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative">
          <AnimatePresence mode="wait">
            {activeTab === 'notifications' && <NotificationModal key="notifications" isDesktopInline onClose={() => {}} />}
            {activeTab === 'settings' && <SettingsModal key="settings" isDesktopInline onClose={() => {}} />}
            {activeTab === 'about' && <AboutModal key="about" isDesktopInline onClose={() => {}} />}
          </AnimatePresence>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="pb-4 px-4 md:mx-auto md:max-w-2xl md:mt-12 flex flex-col gap-4 md:gap-6">
      <div className="shrink-0 w-full">
        <ProfileCard />
      </div>
      <div className="w-full flex flex-col gap-3">
        <SettingsTile />
        <AboutTile />
      </div>
    </PageWrapper>
  );
};

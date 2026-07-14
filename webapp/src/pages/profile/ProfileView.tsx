import { PageWrapper } from '../../shared/ui';
import { 
  ProfileCard, 
  SettingsTile, 
  AboutTile 
} from './components';

export const ProfileView = () => {
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

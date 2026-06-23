import { PageWrapper } from '../../shared/ui';
import { 
  ProfileCard, 
  SettingsTile, 
  AboutTile 
} from './components';

export const ProfileView = () => {
  return (
    <PageWrapper className="pb-4 -mx-2 md:mx-0 flex flex-col md:grid md:grid-cols-[350px_1fr] gap-3 md:gap-8">
      <div className="shrink-0">
        <ProfileCard />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3 items-start h-min">
        <SettingsTile />
        <AboutTile />
      </div>
    </PageWrapper>
  );
};

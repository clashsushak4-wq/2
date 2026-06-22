import { ReactNode } from 'react';
import { SideNav } from './SideNav';

interface DesktopLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  isFullscreen?: boolean;
}

export const DesktopLayout = ({ activeTab, onTabChange, children, isFullscreen }: DesktopLayoutProps) => {
  return (
    <div 
      className="flex h-screen bg-black overflow-hidden"
      style={{ 
        paddingTop: isFullscreen ? 'var(--safe-top, 0px)' : '0px'
      }}
    >
      <SideNav activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-full p-8 lg:p-12">
          {children}
        </div>
      </div>
    </div>
  );
};

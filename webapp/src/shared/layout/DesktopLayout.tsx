import { ReactNode } from 'react';
import { TopNav } from './TopNav';

interface DesktopLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  isFullscreen?: boolean;
}

export const DesktopLayout = ({ activeTab, onTabChange, children, isFullscreen }: DesktopLayoutProps) => {
  return (
    <div 
      className="flex flex-col h-screen bg-black overflow-hidden"
      style={{ 
        paddingTop: isFullscreen ? 'var(--safe-top, 0px)' : '0px'
      }}
    >
      <TopNav activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 overflow-y-auto">
        <div className="w-full h-full p-8 lg:p-12">
          {children}
        </div>
      </div>
    </div>
  );
};

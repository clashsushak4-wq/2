import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface MobileLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  isFullscreen?: boolean;
}

export const MobileLayout = ({ activeTab, onTabChange, children, isFullscreen }: MobileLayoutProps) => {
  return (
    <div 
      className="min-h-screen pb-24 transition-all duration-300"
      style={{ 
          paddingTop: isFullscreen ? 'var(--safe-top, 0px)' : '0px'
      }}
    >
      <div className="p-4">
          {children}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

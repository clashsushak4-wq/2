import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../shared/ui';
import { ChatTile, FAQSection, SupportChat } from './components';
import { useMediaQuery } from '../../hooks';

export const SupportView = () => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (isDesktop) {
    return (
      <PageWrapper className="pb-4 space-y-6 md:mx-auto lg:max-w-6xl md:space-y-0 lg:grid lg:grid-cols-12 md:gap-8 px-4 h-[calc(100vh-120px)] min-h-[500px]">
        <div className="lg:col-span-5 w-full flex flex-col h-full overflow-hidden">
          <FAQSection />
        </div>
        <div className="lg:col-span-7 w-full h-full bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col">
          <SupportChat onClose={() => {}} isDesktopInline />
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <PageWrapper className="pb-4 space-y-6 px-4 md:mx-auto md:max-w-5xl md:mt-8 md:flex md:flex-col md:gap-6">
        <div className="w-full">
          <ChatTile onClick={() => setIsChatOpen(true)} />
        </div>
        <div className="w-full">
          <FAQSection />
        </div>
      </PageWrapper>

      <AnimatePresence>
        {isChatOpen && (
          <SupportChat 
            key="support-chat" 
            onClose={() => setIsChatOpen(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

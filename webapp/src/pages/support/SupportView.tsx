import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../shared/ui';
import { ChatTile, FAQSection, SupportChat } from './components';

export const SupportView = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <PageWrapper className="pb-4 space-y-6 -mx-2 md:mx-0 md:space-y-0 md:flex md:flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="order-2 lg:order-1">
          <FAQSection />
        </div>

        <div className="order-1 lg:order-2 h-min">
          <ChatTile onClick={() => setIsChatOpen(true)} />
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

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper, PullToRefresh } from '../../shared/ui';
import { contentFade } from '../../shared/animations';
import { NewsFilter, DynamicTiles, ArticleModal, NewsList } from './components';
import { invalidateNewsCache, useBackButton } from '../../hooks';
import type { NewsArticle } from '../../hooks';
import { useReadNews } from './hooks';

export const HomeView = () => {
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [refreshSequence, setRefreshSequence] = useState(0);
  const { readNews, markAsRead } = useReadNews();

  const handleCloseNews = useCallback(() => setSelectedNews(null), []);
  useBackButton(selectedNews ? handleCloseNews : null);

  const handleNewsClick = (article: NewsArticle) => {
    setSelectedNews(article);
    markAsRead(article.id);
  };

  const refreshHome = useCallback(async () => {
    if (activeCategory === 1) invalidateNewsCache('forex');
    if (activeCategory === 2) invalidateNewsCache('crypto');
    setRefreshSequence(sequence => sequence + 1);
    await new Promise<void>(resolve => window.setTimeout(resolve, 650));
  }, [activeCategory]);

  return (
    <>
      <PullToRefresh
        disabled={selectedNews !== null}
        layout="document"
        onRefresh={refreshHome}
      >
        <PageWrapper key={refreshSequence} className="space-y-6 pb-4 -mx-2 md:mx-0">
          <NewsFilter activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                variants={contentFade()}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                {activeCategory === 0 && <DynamicTiles />}
                {activeCategory === 1 && (
                  <NewsList category="forex" onSelect={handleNewsClick} readIds={readNews} />
                )}
                {activeCategory === 2 && (
                  <NewsList category="crypto" onSelect={handleNewsClick} readIds={readNews} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </PageWrapper>
      </PullToRefresh>

      <AnimatePresence>
        {selectedNews && (
          <ArticleModal
            key="news-modal"
            article={selectedNews}
            onClose={handleCloseNews}
          />
        )}
      </AnimatePresence>
    </>
  );
};

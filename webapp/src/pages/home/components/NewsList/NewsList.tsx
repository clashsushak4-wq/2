import { Loader2 } from 'lucide-react';
import { useNews } from '../../../../hooks';
import type { NewsArticle } from '../../../../hooks';
import { useTranslation } from '../../../../i18n';
import { NewsItem } from '../NewsItem';

interface NewsListProps {
  category: 'crypto' | 'forex';
  onSelect: (article: NewsArticle) => void;
  readIds: Set<string>;
}

export const NewsList = ({ category, onSelect, readIds }: NewsListProps) => {
  const { items, isLoading, error } = useNews(category);
  const { t } = useTranslation();

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return <div className="text-center py-12 text-zinc-500 text-sm">{t('home.loadError')}</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-12 text-zinc-500 text-sm">{t('home.noNews')}</div>;
  }

  return (
    <>
      {items.map((article) => (
        <NewsItem
          key={article.id}
          source={article.source}
          title={article.title}
          time={article.time}
          readTime={article.readTime}
          image={article.image}
          isUnread={!readIds.has(article.id)}
          onClick={() => onSelect(article)}
        />
      ))}
    </>
  );
};

import { useState, useEffect, useCallback } from 'react';

const READ_NEWS_KEY = 'app_read_news';

const loadReadNews = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READ_NEWS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
};

export const useReadNews = () => {
  const [readNews, setReadNews] = useState<Set<string>>(() => loadReadNews());

  useEffect(() => {
    try {
      localStorage.setItem(READ_NEWS_KEY, JSON.stringify(Array.from(readNews)));
    } catch {}
  }, [readNews]);

  const markAsRead = useCallback((id: string) => {
    setReadNews((prev) => {
      if (prev.has(id)) return prev;
      return new Set([...prev, id]);
    });
  }, []);

  const isRead = useCallback((id: string) => {
    return readNews.has(id);
  }, [readNews]);

  return { readNews, markAsRead, isRead };
};

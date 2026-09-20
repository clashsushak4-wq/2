import { useEffect } from 'react';
import { useMarketStore } from '../store/useMarketStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

export function useMarketRuntime(userId?: number) {
  useEffect(() => {
    const market = useMarketStore.getState();
    market.connect();
    return () => market.disconnect();
  }, []);
  const sourceKey = useMarketStore(state => state.source?.key);
  useEffect(() => {
    const account = usePaperTradingStore.getState();
    account.clear();
    if (!userId || !sourceKey) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await account.refresh();
      if (!stopped) timer = setTimeout(poll, 1000);
    };
    void poll();
    return () => { stopped = true; clearTimeout(timer); account.clear(); };
  }, [userId, sourceKey]);
}

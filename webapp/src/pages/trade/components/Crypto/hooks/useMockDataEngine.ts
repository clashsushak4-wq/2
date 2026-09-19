import { useEffect } from 'react';
import { useCryptoStore } from '../store/useCryptoStore';

export const useMockDataEngine = () => {
  useEffect(() => {
    // Start global ticker for mock data
    const tick = useCryptoStore.getState().tick;
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, []);
};

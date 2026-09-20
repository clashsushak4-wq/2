import { useState, useMemo, useEffect, useRef } from 'react';
import type { UTCTimestamp } from 'lightweight-charts';
import { apiClient } from '../../../../../api/client';
import { useTranslation } from '../../../../../i18n';
import { useCryptoStore } from '../store/useCryptoStore';
import { useMarketStore } from '../store/useMarketStore';
import type { MarketCandle } from '../data/marketData';
import type { Timeframe, ChartType } from './types';
import { Toolbar } from './components/ChartToolbar/Toolbar';
import { TimeframeModal } from './components/ChartToolbar/TimeframeModal';
import { LightweightChart } from './components/ChartArea/LightweightChart';

export const ChartContainer = () => {
  const { t } = useTranslation();
  const symbol = useCryptoStore(state => state.selectedSymbol);
  const timeframe = useCryptoStore(state => state.chartTimeframe) as Timeframe;
  const setTimeframe = useCryptoStore(state => state.setChartTimeframe);
  const version = useMarketStore(state => state.version);
  const candle = useMarketStore(state => state.candles[symbol + ':' + timeframe]);
  const [history, setHistory] = useState<MarketCandle[]>([]);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEarlier, setHasEarlier] = useState(true);
  const requestId = useRef(0);

  useEffect(() => {
    const request = ++requestId.current;
    const controller = new AbortController();
    setHistory([]); setError(null); setLoading(true); setHasEarlier(true);
    apiClient.get('/market/candles/' + symbol, { params: { timeframe, version }, signal: controller.signal })
      .then(response => {
        if (request === requestId.current && response.data.version === useMarketStore.getState().version) {
          const rows: MarketCandle[] = response.data.candles;
          const live = useMarketStore.getState().candles[symbol + ':' + timeframe];
          const merged = new Map(rows.map(row => [row.time, row]));
          if (live && rows.length && live.time >= rows[rows.length - 1].time) merged.set(live.time, live);
          setHistory([...merged.values()].sort((a, b) => a.time - b.time)); setHasEarlier(rows.length >= 500);
        }
      }).catch(() => { if (!controller.signal.aborted) setError('trade.market.emptyChart'); })
      .finally(() => { if (request === requestId.current) setLoading(false); });
    return () => { controller.abort(); requestId.current += 1; };
  }, [symbol, timeframe, version]);

  const loadEarlier = async () => {
    if (loading || !history.length) return;
    const request = requestId.current;
    setLoading(true); setError(null);
    try {
      const response = await apiClient.get('/market/candles/' + symbol,
        { params: { timeframe, version, end: history[0].time * 1000 - 1 } });
      if (request !== requestId.current || response.data.version !== useMarketStore.getState().version) return;
      const rows: MarketCandle[] = response.data.candles;
      setHistory(previous => [...new Map([...rows, ...previous].map(item => [item.time, item])).values()].sort((a, b) => a.time - b.time));
      setHasEarlier(rows.length >= 500);
    } catch { if (request === requestId.current) setError('trade.market.emptyChart'); }
    finally { if (request === requestId.current) setLoading(false); }
  };

  const data = useMemo(() => ({
    candles: history.map(row => ({ ...row, time: row.time as UTCTimestamp })),
    area: history.map(row => ({ time: row.time as UTCTimestamp, value: row.close })),
  }), [history]);

  return <div className="flex flex-col mt-2">
    <Toolbar selectedTimeframe={timeframe} onSelectTimeframe={setTimeframe} chartType={chartType}
      onToggleChartType={() => setChartType(value => value === 'candles' ? 'area' : 'candles')} onOpenTimeframeModal={() => setModal(true)} />
    {error && <p role="alert" className="p-3 text-xs text-amber-400">{t(error)}</p>}
    <div className="h-[340px] w-full bg-[#0a0a0a]">
      <LightweightChart key={symbol + timeframe + version} data={data} liveCandle={candle} chartType={chartType} />
    </div>
    {hasEarlier && <button disabled={loading || !history.length} onClick={() => void loadEarlier()}
      className="p-3 text-xs text-zinc-400 disabled:opacity-40">{t('trade.market.loadEarlier')}</button>}
    <TimeframeModal isOpen={modal} onClose={() => setModal(false)} selectedTimeframe={timeframe} onSelectTimeframe={setTimeframe} />
  </div>;
};

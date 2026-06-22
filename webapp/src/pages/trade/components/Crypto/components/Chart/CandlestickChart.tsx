import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, ISeriesApi, Time } from 'lightweight-charts';
import { Maximize2, Loader2 } from 'lucide-react';
import { useBinanceKline } from '../../../../../../hooks/useBinanceMarket';

interface CandlestickChartProps {
  symbol: string;
  interval: string; // e.g., '1m', '5m', '1h', '1d'
}

export const CandlestickChart = ({ symbol, interval }: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const liveKline = useBinanceKline(symbol, interval);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#000000' },
        textColor: '#a1a1aa', // zinc-400
      },
      grid: {
        vertLines: { color: '#18181b' }, // zinc-900
        horzLines: { color: '#18181b' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#27272a',
      },
      rightPriceScale: {
        borderColor: '#27272a',
        autoScale: true,
      },
      crosshair: {
        mode: 0, // Normal mode
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Create Candlestick series (white for up, purple for down like Bitget)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ffffff',
      downColor: '#a78bfa', // violet-400
      borderVisible: false,
      wickUpColor: '#ffffff',
      wickDownColor: '#a78bfa',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Create Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // highest point of the series will be at 80% from top
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Fetch historical data from Binance REST API
    let isMounted = true;
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=500`);
        const data = await res.json();
        
        if (!isMounted) return;

        const cData = data.map((d: any) => ({
          time: (d[0] / 1000) as Time,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));

        const vData = data.map((d: any) => {
          const isUp = parseFloat(d[4]) >= parseFloat(d[1]);
          return {
            time: (d[0] / 1000) as Time,
            value: parseFloat(d[5]),
            color: isUp ? 'rgba(255, 255, 255, 0.4)' : 'rgba(167, 139, 250, 0.4)',
          };
        });

        candlestickSeries.setData(cData);
        volumeSeries.setData(vData);
      } catch (err) {
        console.error('Failed to fetch historical klines', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistoricalData();

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [symbol, interval]);

  // Update live kline from WebSocket
  useEffect(() => {
    if (liveKline && candlestickSeriesRef.current && volumeSeriesRef.current) {
      const { time, open, high, low, close, volume } = liveKline;
      const isUp = close >= open;
      
      candlestickSeriesRef.current.update({
        time: time as Time,
        open,
        high,
        low,
        close,
      });

      volumeSeriesRef.current.update({
        time: time as Time,
        value: volume,
        color: isUp ? 'rgba(255, 255, 255, 0.4)' : 'rgba(167, 139, 250, 0.4)',
      });
    }
  }, [liveKline]);

  return (
    <div className="relative h-[380px] border-b border-zinc-900 bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full" />
      <button className="absolute bottom-[20px] left-4 text-zinc-500 hover:text-white transition-colors z-10 bg-black/50 rounded-md p-1">
        <Maximize2 size={17} />
      </button>
    </div>
  );
};

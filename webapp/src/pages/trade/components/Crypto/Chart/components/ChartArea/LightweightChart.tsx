import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CandlestickSeries, AreaSeries } from 'lightweight-charts';
import type { ChartData } from '../../types';

interface LightweightChartProps {
  data: ChartData;
  chartType: 'candles' | 'area';
  livePrice?: number;
}

export const LightweightChart = ({ data, chartType, livePrice }: LightweightChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#71717a',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.4)' },
        horzLines: { color: 'rgba(39, 39, 42, 0.4)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#71717a',
          width: 1,
          style: 3,
          labelBackgroundColor: '#27272a',
        },
        horzLine: {
          color: '#71717a',
          width: 1,
          style: 3,
          labelBackgroundColor: '#27272a',
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      }
    });
    
    chartRef.current = chart;

    return () => {
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    if (chartType === 'candles') {
      const candlestickSeries = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#2ebd85', // Terminal's native green
        downColor: '#f6465d', // Terminal's native red
        borderVisible: false,
        wickUpColor: '#2ebd85',
        wickDownColor: '#f6465d',
        priceLineColor: '#ffffff', // White line for current price
        priceLineWidth: 1,
        priceLineStyle: 3, // Dashed
      });
      candlestickSeries.setData(data.candles);
      seriesRef.current = candlestickSeries;
    } else {
      const areaSeries = chartRef.current.addSeries(AreaSeries, {
        lineColor: '#00b8d9',
        topColor: 'rgba(0, 184, 217, 0.4)',
        bottomColor: 'rgba(0, 184, 217, 0.0)',
        lineWidth: 2,
        priceLineColor: '#ffffff',
        priceLineWidth: 1,
        priceLineStyle: 3,
      });
      areaSeries.setData(data.area);
      seriesRef.current = areaSeries;
    }
    
    chartRef.current.timeScale().fitContent();
    
  }, [data, chartType]);

  // Update last candle when livePrice changes
  useEffect(() => {
    if (!seriesRef.current || !livePrice) return;
    
    if (chartType === 'candles' && data.candles.length > 0) {
      const last = data.candles[data.candles.length - 1];
      seriesRef.current.update({
        time: last.time,
        open: last.open,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
        close: livePrice,
      });
    } else if (chartType === 'area' && data.area.length > 0) {
      const last = data.area[data.area.length - 1];
      seriesRef.current.update({
        time: last.time,
        value: livePrice,
      });
    }
  }, [livePrice, chartType, data]);

  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    
    const observer = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full"
    />
  );
};

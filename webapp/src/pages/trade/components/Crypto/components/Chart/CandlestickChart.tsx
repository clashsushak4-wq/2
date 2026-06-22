import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CandlestickChartProps {
  symbol: string;
  interval: string; // '1m', '5m', '1h', '1d', etc. (Binance format)
}

// Convert binance intervals to TradingView widget intervals
const mapInterval = (interval: string): any => {
  switch (interval) {
    case '1m': return '1';
    case '15m': return '15';
    case '1h': return '60';
    case '4h': return '240';
    case '1d': return 'D';
    default: return '60';
  }
};

export const CandlestickChart = ({ symbol, interval }: CandlestickChartProps) => {
  const [isReady, setIsReady] = useState(false);

  // Fallback timer to remove loader if iframe fails to emit ready state (though widget handles it)
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[380px] flex-1 bg-black">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      )}
      
      <AdvancedRealTimeChart
        symbol={`BINANCE:${symbol.toUpperCase()}`}
        theme="dark"
        interval={mapInterval(interval)}
        timezone="Etc/UTC"
        style="1"
        locale="ru"
        enable_publishing={false}
        hide_top_toolbar={false}
        hide_legend={false}
        save_image={false}
        container_id="tradingview_widget"
        autosize
        toolbar_bg="#000000"
      />
    </div>
  );
};
